// src/hooks/video-processing/BackgroundProcessor.js

import { SelfieSegmentation } from '@mediapipe/selfie_segmentation'
import { getScreenFilter } from './ScreenFilterProcessor.js'

export const BG_IMAGES = [
    { id: 'normal',   src: '/backgrounds/normal.jpg'   },
    { id: 'computer', src: '/backgrounds/computer.jpg' },
]

export class BackgroundProcessor {
    constructor() {
        this.segmentation    = null
        this.animFrame       = null
        this.offscreen       = null
        this.loadedBgImage   = null
        this.bgReady         = false
        this.screenFilterRef = { current: 'none' }
        this.ctx             = null
        this.canvas          = null

        // ── bgMode stored directly on instance — not via shared ref ──────────
        // This avoids the ref-sharing bug where ProcessingEngine reassigns the
        // whole ref object instead of mutating .current
        this.bgMode = 'raw'
    }

    // Called by ProcessingEngine.updateBgType() — sets directly on instance
    setBgMode(mode) {
        this.bgMode = mode
        console.log('[BackgroundProcessor] bgMode set to:', mode)
    }

    loadBgImage(src) {
        this.bgReady       = false
        this.loadedBgImage = null
        const img    = new Image()
        img.onload   = () => {
            this.loadedBgImage = img
            this.bgReady       = true
            console.log('[BG] Image loaded:', src)
        }
        img.onerror  = () => {
            console.error('[BG] Failed to load image:', src)
            this.bgReady = false
        }
        img.src = src
    }

    drawFrame(results) {
        const ctx    = this.ctx
        const canvas = this.canvas
        const W      = canvas.width
        const H      = canvas.height
        const mode   = this.bgMode                              // read directly from instance
        const sf     = getScreenFilter(this.screenFilterRef.current)

        if (mode === 'raw') {
            ctx.clearRect(0, 0, W, H)
            ctx.globalCompositeOperation = 'source-over'
            ctx.filter = sf
            ctx.drawImage(results.image, 0, 0, W, H)
            ctx.filter = 'none'
            return
        }

        if (mode === 'blur') {
            ctx.clearRect(0, 0, W, H)

            // Step 1: Draw frame with screen filter (person layer)
            ctx.globalCompositeOperation = 'source-over'
            ctx.filter = sf
            ctx.drawImage(results.image, 0, 0, W, H)
            ctx.filter = 'none'

            // Step 2: Mask — keep only person pixels
            ctx.globalCompositeOperation = 'destination-in'
            ctx.drawImage(results.segmentationMask, 0, 0, W, H)

            // Step 3: Draw blurred background BEHIND person
            ctx.globalCompositeOperation = 'destination-over'
            ctx.filter = sf !== 'none' ? `blur(14px) ${sf}` : 'blur(14px)'
            ctx.drawImage(results.image, 0, 0, W, H)

            // Step 4: Reset
            ctx.globalCompositeOperation = 'source-over'
            ctx.filter = 'none'
            return
        }

        if (mode === 'replace') {
            if (!this.bgReady || !this.loadedBgImage) return

            if (!this.offscreen) {
                this.offscreen        = document.createElement('canvas')
                this.offscreen.width  = W
                this.offscreen.height = H
            }
            const off    = this.offscreen
            const offCtx = off.getContext('2d')

            offCtx.globalCompositeOperation = 'source-over'
            offCtx.filter = sf
            offCtx.clearRect(0, 0, W, H)
            offCtx.drawImage(results.image, 0, 0, W, H)
            offCtx.filter = 'none'
            offCtx.globalCompositeOperation = 'destination-in'
            offCtx.drawImage(results.segmentationMask, 0, 0, W, H)
            offCtx.globalCompositeOperation = 'source-over'

            ctx.globalCompositeOperation = 'source-over'
            ctx.filter = 'none'
            ctx.clearRect(0, 0, W, H)
            ctx.drawImage(this.loadedBgImage, 0, 0, W, H)
            ctx.drawImage(off, 0, 0, W, H)
        }
    }

    async start(rawStream, canvas, initialBgMode) {
        this.canvas  = canvas
        this.ctx     = canvas.getContext('2d')
        this.bgMode  = initialBgMode || 'raw'

        canvas.width  = 1280
        canvas.height = 720

        const hiddenVideo       = document.createElement('video')
        hiddenVideo.srcObject   = rawStream
        hiddenVideo.autoplay    = true
        hiddenVideo.muted       = true
        hiddenVideo.playsInline = true
        hiddenVideo.width       = 1280
        hiddenVideo.height      = 720
        await new Promise((res) => { hiddenVideo.onloadedmetadata = res })
        await hiddenVideo.play()

        this.segmentation = new SelfieSegmentation({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
        })
        this.segmentation.setOptions({ modelSelection: 1 })
        this.segmentation.onResults((results) => { this.drawFrame(results) })

        const loop = async () => {
            if (!this.segmentation) return
            try { await this.segmentation.send({ image: hiddenVideo }) } catch { return }
            this.animFrame = requestAnimationFrame(loop)
        }
        loop()

        const canvasStream = canvas.captureStream(30)
        const audioTrack   = rawStream.getAudioTracks()[0]
        if (audioTrack) canvasStream.addTrack(audioTrack)
        return canvasStream
    }

    cleanup() {
        if (this.animFrame)    { cancelAnimationFrame(this.animFrame); this.animFrame = null }
        if (this.segmentation) { this.segmentation.close(); this.segmentation = null }
        this.offscreen = null
        console.log('[BackgroundProcessor] cleaned up')
    }
}
// src/hooks/video-processing/FaceProcessor.js

import { FaceMesh } from '@mediapipe/face_mesh'
import { getScreenFilter } from './ScreenFilterProcessor.js'

export class FaceProcessor {
    constructor() {
        this.faceMesh        = null
        this.animFrame       = null
        this.ctx             = null
        this.canvas          = null
        this.filterTypeRef   = { current: 'dog' }
        this.screenFilterRef = { current: 'none' }   // ← NEW
        this.hiddenVideo     = null
    }

    async start(rawStream, canvas) {
        this.canvas = canvas
        this.ctx    = canvas.getContext('2d')
        canvas.width  = 1280
        canvas.height = 720

        const hiddenVideo     = document.createElement('video')
        hiddenVideo.srcObject = rawStream
        hiddenVideo.autoplay  = true
        hiddenVideo.muted     = true
        hiddenVideo.width     = 1280
        hiddenVideo.height    = 720
        await new Promise((res) => { hiddenVideo.onloadedmetadata = res })
        await hiddenVideo.play()
        this.hiddenVideo = hiddenVideo

        this.faceMesh = new FaceMesh({
            locateFile: (file) =>
                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        })
        this.faceMesh.setOptions({
            maxNumFaces:            1,
            refineLandmarks:        true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence:  0.5,
        })
        this.faceMesh.onResults((results) => { this.drawFrame(results) })

        const loop = async () => {
            if (!this.faceMesh) return
            try { await this.faceMesh.send({ image: hiddenVideo }) } catch { return }
            this.animFrame = requestAnimationFrame(loop)
        }
        loop()

        const canvasStream = canvas.captureStream(30)
        const audioTrack   = rawStream.getAudioTracks()[0]
        if (audioTrack) canvasStream.addTrack(audioTrack)
        return canvasStream
    }

    drawFrame(results) {
        const ctx    = this.ctx
        const canvas = this.canvas
        const W      = canvas.width
        const H      = canvas.height

        // ── Draw base frame with screen filter ────────────────────────────────
        ctx.clearRect(0, 0, W, H)
        ctx.globalCompositeOperation = 'source-over'
        ctx.filter = getScreenFilter(this.screenFilterRef.current)  // ← screen filter
        ctx.drawImage(this.hiddenVideo, 0, 0, W, H)
        ctx.filter = 'none'

        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return

        const landmarks = results.multiFaceLandmarks[0]
        const filter    = this.filterTypeRef.current
        const pt = (idx) => ({ x: landmarks[idx].x * W, y: landmarks[idx].y * H })

        if (filter === 'dog')     this.drawDogFilter(ctx, pt, W, H)
        if (filter === 'cat')     this.drawCatFilter(ctx, pt, W, H)
        if (filter === 'glasses') this.drawGlassesFilter(ctx, pt, W, H)
        if (filter === 'beard')   this.drawBeardFilter(ctx, pt, W, H)
    }

    drawDogFilter(ctx, pt, W, H) {
        const nose     = pt(1)
        const leftEar  = pt(127)
        const rightEar = pt(356)
        const topHead  = pt(10)
        const leftEye  = pt(33)
        const rightEye = pt(263)
        const earW = Math.abs(rightEar.x - leftEar.x) * 0.35
        const earH = earW * 1.6

        ctx.save()
        ctx.fillStyle = '#8B4513'
        ctx.beginPath()
        ctx.ellipse(leftEar.x - earW * 0.3, topHead.y + earH * 0.1, earW, earH, -0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(rightEar.x + earW * 0.3, topHead.y + earH * 0.1, earW, earH, 0.3, 0, Math.PI * 2)
        ctx.fill()

        const noseR = Math.abs(rightEye.x - leftEye.x) * 0.12
        ctx.fillStyle = '#111'
        ctx.beginPath()
        ctx.ellipse(nose.x, nose.y, noseR * 1.4, noseR, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.5)'
        ctx.beginPath()
        ctx.arc(nose.x - noseR * 0.35, nose.y - noseR * 0.2, noseR * 0.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = 'rgba(0,0,0,0.7)'
        ctx.lineWidth = 1.5
        const wLeft = pt(61)
        for (let i = 0; i < 3; i++) {
            const o = (i - 1) * 8
            ctx.beginPath(); ctx.moveTo(wLeft.x, wLeft.y + o); ctx.lineTo(wLeft.x - 50, wLeft.y + o - 5); ctx.stroke()
        }
        const wRight = pt(291)
        for (let i = 0; i < 3; i++) {
            const o = (i - 1) * 8
            ctx.beginPath(); ctx.moveTo(wRight.x, wRight.y + o); ctx.lineTo(wRight.x + 50, wRight.y + o - 5); ctx.stroke()
        }
        ctx.restore()
    }

    drawCatFilter(ctx, pt, W, H) {
        const nose     = pt(1)
        const topHead  = pt(10)
        const leftEar  = pt(127)
        const rightEar = pt(356)
        const leftEye  = pt(33)
        const rightEye = pt(263)
        const earSize  = Math.abs(rightEar.x - leftEar.x) * 0.22

        ctx.save()
        ctx.fillStyle = '#888'
        ctx.beginPath()
        ctx.moveTo(leftEar.x - earSize, topHead.y + earSize * 0.5)
        ctx.lineTo(leftEar.x, topHead.y - earSize * 2)
        ctx.lineTo(leftEar.x + earSize * 0.5, topHead.y + earSize * 0.5)
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = '#ffb6c1'
        ctx.beginPath()
        ctx.moveTo(leftEar.x - earSize * 0.5, topHead.y + earSize * 0.3)
        ctx.lineTo(leftEar.x, topHead.y - earSize * 1.4)
        ctx.lineTo(leftEar.x + earSize * 0.3, topHead.y + earSize * 0.3)
        ctx.closePath(); ctx.fill()

        ctx.fillStyle = '#888'
        ctx.beginPath()
        ctx.moveTo(rightEar.x - earSize * 0.5, topHead.y + earSize * 0.5)
        ctx.lineTo(rightEar.x, topHead.y - earSize * 2)
        ctx.lineTo(rightEar.x + earSize, topHead.y + earSize * 0.5)
        ctx.closePath(); ctx.fill()
        ctx.fillStyle = '#ffb6c1'
        ctx.beginPath()
        ctx.moveTo(rightEar.x - earSize * 0.3, topHead.y + earSize * 0.3)
        ctx.lineTo(rightEar.x, topHead.y - earSize * 1.4)
        ctx.lineTo(rightEar.x + earSize * 0.5, topHead.y + earSize * 0.3)
        ctx.closePath(); ctx.fill()

        const noseSize = Math.abs(rightEye.x - leftEye.x) * 0.09
        ctx.fillStyle = '#ff69b4'
        ctx.beginPath()
        ctx.moveTo(nose.x, nose.y - noseSize)
        ctx.lineTo(nose.x - noseSize, nose.y + noseSize * 0.5)
        ctx.lineTo(nose.x + noseSize, nose.y + noseSize * 0.5)
        ctx.closePath(); ctx.fill()

        ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1
        const wL = pt(61); const wR = pt(291)
        for (let i = 0; i < 3; i++) {
            const o = (i - 1) * 7
            ctx.beginPath(); ctx.moveTo(wL.x, wL.y + o); ctx.lineTo(wL.x - 65, wL.y + o - 8 + i * 4); ctx.stroke()
            ctx.beginPath(); ctx.moveTo(wR.x, wR.y + o); ctx.lineTo(wR.x + 65, wR.y + o - 8 + i * 4); ctx.stroke()
        }
        ctx.restore()
    }

    drawGlassesFilter(ctx, pt, W, H) {
        const leftEye    = pt(33)
        const rightEye   = pt(263)
        const leftOuter  = pt(130)
        const rightOuter = pt(359)
        const nose       = pt(6)
        const eyeDist    = Math.abs(rightEye.x - leftEye.x)
        const lensR      = eyeDist * 0.28

        ctx.save()
        ctx.strokeStyle = '#222'; ctx.lineWidth = 3
        ctx.beginPath(); ctx.arc(leftEye.x,  leftEye.y,  lensR, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath(); ctx.arc(rightEye.x, rightEye.y, lensR, 0, Math.PI * 2); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(leftEye.x + lensR, leftEye.y)
        ctx.quadraticCurveTo(nose.x, nose.y - lensR * 0.3, rightEye.x - lensR, rightEye.y)
        ctx.stroke()
        ctx.beginPath(); ctx.moveTo(leftEye.x - lensR, leftEye.y);   ctx.lineTo(leftOuter.x - 20, leftOuter.y);   ctx.stroke()
        ctx.beginPath(); ctx.moveTo(rightEye.x + lensR, rightEye.y); ctx.lineTo(rightOuter.x + 20, rightOuter.y); ctx.stroke()
        ctx.restore()
    }

    drawBeardFilter(ctx, pt, W, H) {
        const chin       = pt(152)
        const leftJaw    = pt(172)
        const rightJaw   = pt(397)
        const leftMouth  = pt(61)
        const rightMouth = pt(291)
        const upperLip   = pt(13)

        ctx.save()
        ctx.fillStyle = '#2c1a0e'
        ctx.beginPath()
        ctx.moveTo(leftMouth.x, upperLip.y + 4)
        ctx.lineTo(leftJaw.x, leftJaw.y)
        ctx.quadraticCurveTo(chin.x, chin.y + 15, rightJaw.x, rightJaw.y)
        ctx.lineTo(rightMouth.x, upperLip.y + 4)
        ctx.quadraticCurveTo(upperLip.x, upperLip.y + 8, leftMouth.x, upperLip.y + 4)
        ctx.closePath(); ctx.fill()

        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1
        for (let i = 0; i < 5; i++) {
            const x = leftJaw.x + (rightJaw.x - leftJaw.x) * (i / 5)
            ctx.beginPath(); ctx.moveTo(x, upperLip.y + 10); ctx.lineTo(x + 5, chin.y + 5); ctx.stroke()
        }
        ctx.restore()
    }

    cleanup() {
        if (this.animFrame) { cancelAnimationFrame(this.animFrame); this.animFrame = null }
        if (this.faceMesh)  { this.faceMesh.close(); this.faceMesh = null }
        this.hiddenVideo = null
        console.log('[FaceProcessor] cleaned up')
    }
}
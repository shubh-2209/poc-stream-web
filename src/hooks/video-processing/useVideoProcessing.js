// src/hooks/video-processing/useVideoProcessing.js

import { useRef, useEffect, useCallback, useState } from 'react'
import { ProcessingEngine }  from './ProcessingEngine.js'
import { PROCESSING_MODES, BACKGROUND_TYPES, FACE_FILTER_TYPES } from './ModeController.js'
import { BG_IMAGES }         from './BackgroundProcessor.js'
import { SCREEN_FILTERS, getScreenFilter } from './ScreenFilterProcessor.js'

export { BG_IMAGES, SCREEN_FILTERS, PROCESSING_MODES, BACKGROUND_TYPES, FACE_FILTER_TYPES }

export function useVideoProcessing({ canvasRef }) {
    const engineRef          = useRef(new ProcessingEngine())
    const processedStreamRef = useRef(null)

    // Raw canvas loop refs
    const rawAnimFrameRef     = useRef(null)
    const rawVideoRef         = useRef(null)
    const rawStreamRef        = useRef(null)

    // All mode state stored in refs too — avoids stale closure bugs
    const processingModeRef  = useRef(PROCESSING_MODES.RAW)
    const backgroundTypeRef  = useRef(BACKGROUND_TYPES.RAW)
    const faceFilterTypeRef  = useRef(FACE_FILTER_TYPES.DOG)
    const screenFilterRef    = useRef('none')
    const selectedBgIdRef    = useRef(BG_IMAGES[0].id)

    // UI state — only for rendering
    const [processingMode, setProcessingMode]  = useState(PROCESSING_MODES.RAW)
    const [backgroundType, setBackgroundTypeUI] = useState(BACKGROUND_TYPES.RAW)
    const [faceFilterType, setFaceFilterTypeUI] = useState(FACE_FILTER_TYPES.DOG)
    const [screenFilter,   setScreenFilterUI]   = useState('none')
    const [selectedBgId,   setSelectedBgId]     = useState(BG_IMAGES[0].id)

    // ── Raw canvas loop ───────────────────────────────────────────────────────
    const startRawCanvasLoop = useCallback(async (rawStream, canvas) => {
        canvas.width  = 1280
        canvas.height = 720
        const ctx = canvas.getContext('2d')

        const hiddenVideo       = document.createElement('video')
        hiddenVideo.srcObject   = rawStream
        hiddenVideo.autoplay    = true
        hiddenVideo.muted       = true
        hiddenVideo.playsInline = true
        rawVideoRef.current     = hiddenVideo

        await new Promise((resolve, reject) => {
            hiddenVideo.onloadedmetadata = resolve
            hiddenVideo.onerror = () => reject(new Error('Video load failed'))
            setTimeout(() => reject(new Error('Video metadata timeout')), 8000)
        })
        await hiddenVideo.play()

        const loop = () => {
            if (!rawVideoRef.current) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.globalCompositeOperation = 'source-over'
            ctx.filter = getScreenFilter(screenFilterRef.current)
            ctx.drawImage(hiddenVideo, 0, 0, canvas.width, canvas.height)
            ctx.filter = 'none'
            rawAnimFrameRef.current = requestAnimationFrame(loop)
        }
        loop()

        const canvasStream = canvas.captureStream(30)
        const audioTrack   = rawStream.getAudioTracks()[0]
        if (audioTrack) canvasStream.addTrack(audioTrack)
        return canvasStream
    }, [])

    const stopRawCanvasLoop = useCallback(() => {
        if (rawAnimFrameRef.current) {
            cancelAnimationFrame(rawAnimFrameRef.current)
            rawAnimFrameRef.current = null
        }
        rawVideoRef.current = null
    }, [])

    // ── Start processing — reads from refs, not state (no stale closure) ──────
    const startProcessing = useCallback(async (rawStream) => {
        rawStreamRef.current = rawStream
        const canvas = canvasRef.current
        const engine = engineRef.current

        const mode   = processingModeRef.current
        const sf     = screenFilterRef.current
        const bgType = backgroundTypeRef.current
        const ffType = faceFilterTypeRef.current
        const bgId   = selectedBgIdRef.current

        console.log('[Processing] starting mode:', mode, 'screenFilter:', sf)

        // ── RAW mode ──────────────────────────────────────────────────────────
        if (mode === PROCESSING_MODES.RAW) {
            if (sf !== 'none') {
                // Only use canvas when screen filter is actually selected
                console.log('[Processing] raw + screen filter → canvas loop')
                const stream = await startRawCanvasLoop(rawStream, canvas)
                processedStreamRef.current = stream
                return stream
            }
            // Pure raw — skip canvas entirely, return null
            console.log('[Processing] pure raw → no canvas')
            processedStreamRef.current = null
            return null
        }

        // ── Background or Face mode ───────────────────────────────────────────
        const stream = await engine.start(rawStream, canvas, mode, bgType, ffType)
        if (mode === PROCESSING_MODES.BACKGROUND &&
            bgType === BACKGROUND_TYPES.REPLACE) {
            const bgImage = BG_IMAGES.find((b) => b.id === bgId)
            if (bgImage) engine.updateBgImage(bgImage.src)
        }
        processedStreamRef.current = stream
        return stream
    }, [canvasRef, startRawCanvasLoop])

    // ── Switch processing mode while live ─────────────────────────────────────
    const switchProcessingMode = useCallback(async (newMode, rawStream, videoRef) => {
        processingModeRef.current = newMode
        setProcessingMode(newMode)
        stopRawCanvasLoop()

        const engine = engineRef.current
        const rs     = rawStream || rawStreamRef.current
        const sf     = screenFilterRef.current
        const bgId   = selectedBgIdRef.current
        const bgImage = BG_IMAGES.find((b) => b.id === bgId)

        if (newMode === PROCESSING_MODES.RAW) {
            engine.cleanup()
            if (sf !== 'none' && rs) {
                const stream = await startRawCanvasLoop(rs, canvasRef.current)
                processedStreamRef.current = stream
                if (videoRef?.current) videoRef.current.srcObject = stream
            } else {
                processedStreamRef.current = null
                if (videoRef?.current && rs) videoRef.current.srcObject = rs
            }
            return processedStreamRef.current
        }

        const stream = await engine.switchMode(
            newMode,
            backgroundTypeRef.current,
            faceFilterTypeRef.current,
            bgImage?.src
        )
        processedStreamRef.current = stream
        if (videoRef?.current && stream) videoRef.current.srcObject = stream
        return stream
    }, [canvasRef, startRawCanvasLoop, stopRawCanvasLoop])

    const switchBackgroundType = useCallback((type) => {
        backgroundTypeRef.current = type
        setBackgroundTypeUI(type)
        engineRef.current.updateBgType(type)
    }, [])

    const switchFaceFilter = useCallback((filter) => {
        faceFilterTypeRef.current = filter
        setFaceFilterTypeUI(filter)
        engineRef.current.updateFaceFilter(filter)
    }, [])

    const switchScreenFilter = useCallback((filter) => {
        screenFilterRef.current = filter
        setScreenFilterUI(filter)
        engineRef.current.updateScreenFilter(filter)
    }, [])

    const selectBgImage = useCallback((bgId) => {
        selectedBgIdRef.current = bgId
        setSelectedBgId(bgId)
        const found = BG_IMAGES.find((b) => b.id === bgId)
        if (found) engineRef.current.updateBgImage(found.src)
    }, [])

    const cleanupProcessing = useCallback(() => {
        stopRawCanvasLoop()
        engineRef.current.cleanup()
        processedStreamRef.current = null
        rawStreamRef.current = null
    }, [stopRawCanvasLoop])

    useEffect(() => {
        return () => {
            stopRawCanvasLoop()
            engineRef.current.cleanup()
        }
    }, [stopRawCanvasLoop])

    return {
        processingMode,
        backgroundType,
        faceFilterType,
        screenFilter,
        selectedBgId,
        processedStreamRef,
        startProcessing,
        switchProcessingMode,
        switchBackgroundType,
        switchFaceFilter,
        switchScreenFilter,
        selectBgImage,
        cleanupProcessing,
    }
}
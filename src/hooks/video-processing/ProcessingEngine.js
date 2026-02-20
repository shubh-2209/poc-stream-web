// src/hooks/video-processing/ProcessingEngine.js

import { BackgroundProcessor } from './BackgroundProcessor.js'
import { FaceProcessor }       from './FaceProcessor.js'
import { PROCESSING_MODES }    from './ModeController.js'

export class ProcessingEngine {
    constructor() {
        this.bgProcessor     = null
        this.faceProcessor   = null
        this.activeMode      = PROCESSING_MODES.RAW
        this.canvas          = null
        this.rawStream       = null
        this.processedStream = null

        this.faceFilterRef   = { current: 'dog' }
        this.screenFilterRef = { current: 'none' }
    }

    async start(rawStream, canvas, initialMode, initialBgType, initialFaceFilter) {
        this.rawStream = rawStream
        this.canvas    = canvas
        this.activeMode = initialMode || PROCESSING_MODES.RAW

        this.faceFilterRef.current   = initialFaceFilter || 'dog'
        this.screenFilterRef.current = 'none'

        if (this.activeMode === PROCESSING_MODES.BACKGROUND) {
            return await this._startBackground(rawStream, canvas, initialBgType || 'raw')
        }
        if (this.activeMode === PROCESSING_MODES.FACE) {
            return await this._startFace(rawStream, canvas)
        }
        return null
    }

    async switchMode(newMode, newBgType, newFaceFilter, newBgImageSrc) {
        if (this.activeMode === newMode) {
            // Same mode — just update sub-type
            if (newBgType && this.bgProcessor) this.bgProcessor.setBgMode(newBgType)
            if (newFaceFilter) this.faceFilterRef.current = newFaceFilter
            if (newBgImageSrc && this.bgProcessor) this.bgProcessor.loadBgImage(newBgImageSrc)
            return this.processedStream
        }

        this._cleanupAll()
        this.activeMode = newMode

        if (newMode === PROCESSING_MODES.BACKGROUND) {
            this.processedStream = await this._startBackground(this.rawStream, this.canvas, newBgType || 'raw')
        } else if (newMode === PROCESSING_MODES.FACE) {
            if (newFaceFilter) this.faceFilterRef.current = newFaceFilter
            this.processedStream = await this._startFace(this.rawStream, this.canvas)
        } else {
            this.processedStream = null
        }
        return this.processedStream
    }

    // ── updateBgType — calls setBgMode directly on processor instance ─────────
    updateBgType(bgType) {
        if (this.bgProcessor) {
            this.bgProcessor.setBgMode(bgType)
        }
    }

    updateBgImage(src) {
        if (this.bgProcessor) this.bgProcessor.loadBgImage(src)
    }

    updateFaceFilter(filterType) {
        this.faceFilterRef.current = filterType
        if (this.faceProcessor) this.faceProcessor.filterTypeRef = this.faceFilterRef
    }

    updateScreenFilter(filterId) {
        this.screenFilterRef.current = filterId
    }

    async _startBackground(rawStream, canvas, initialBgMode) {
        this.bgProcessor                 = new BackgroundProcessor()
        this.bgProcessor.screenFilterRef = this.screenFilterRef
        const stream                     = await this.bgProcessor.start(rawStream, canvas, initialBgMode)
        this.processedStream             = stream
        return stream
    }

    async _startFace(rawStream, canvas) {
        this.faceProcessor                 = new FaceProcessor()
        this.faceProcessor.filterTypeRef   = this.faceFilterRef
        this.faceProcessor.screenFilterRef = this.screenFilterRef
        const stream                       = await this.faceProcessor.start(rawStream, canvas)
        this.processedStream               = stream
        return stream
    }

    _cleanupAll() {
        if (this.bgProcessor)   { this.bgProcessor.cleanup();   this.bgProcessor   = null }
        if (this.faceProcessor) { this.faceProcessor.cleanup(); this.faceProcessor = null }
        this.processedStream = null
    }

    cleanup() {
        this._cleanupAll()
        this.rawStream = null
        this.canvas    = null
    }
}
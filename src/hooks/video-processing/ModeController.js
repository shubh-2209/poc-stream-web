// src/hooks/video-processing/ModeController.js
//
// Manages mode state and switching logic.
// Ensures only ONE heavy ML model runs at a time.
// Destroys previous model before starting new one.

export const PROCESSING_MODES = {
    RAW:        'raw',
    BACKGROUND: 'background',
    FACE:       'face',
}

export const BACKGROUND_TYPES = {
    RAW:     'raw',
    BLUR:    'blur',
    REPLACE: 'replace',
}

export const FACE_FILTER_TYPES = {
    DOG:     'dog',
    CAT:     'cat',
    GLASSES: 'glasses',
    BEARD:   'beard',
}

export class ModeController {
    constructor() {
        this.processingMode  = PROCESSING_MODES.RAW
        this.backgroundType  = BACKGROUND_TYPES.RAW
        this.faceFilterType  = FACE_FILTER_TYPES.DOG
        this.screenFilter    = 'none'
        this.onModeChange    = null   // callback → useVideoProcessing hook
    }

    setOnModeChange(cb) {
        this.onModeChange = cb
    }

    // ── Switch processing mode — triggers model swap ──────────────────────────
    setProcessingMode(mode) {
        if (this.processingMode === mode) return
        console.log(`[ModeController] switching: ${this.processingMode} → ${mode}`)
        this.processingMode = mode
        this.onModeChange?.('processingMode', mode)
    }

    setBackgroundType(type) {
        this.backgroundType = type
        this.onModeChange?.('backgroundType', type)
    }

    setFaceFilterType(type) {
        this.faceFilterType = type
        this.onModeChange?.('faceFilterType', type)
    }

    setScreenFilter(filter) {
        this.screenFilter = filter
        this.onModeChange?.('screenFilter', filter)
    }

    getState() {
        return {
            processingMode:  this.processingMode,
            backgroundType:  this.backgroundType,
            faceFilterType:  this.faceFilterType,
            screenFilter:    this.screenFilter,
        }
    }
}
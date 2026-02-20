// src/hooks/video-processing/ScreenFilterProcessor.js
//
// Lightweight color filters applied on top of any mode.
// Uses CSS canvas filter strings — zero ML, zero overhead.
// Works in combination with Background or Face modes.

export const SCREEN_FILTERS = [
    { id: 'none',    label: 'None'    },
    { id: 'warm',    label: 'Warm'    },
    { id: 'cool',    label: 'Cool'    },
    { id: 'vintage', label: 'Vintage' },
    { id: 'bw',      label: 'B&W'     },
]

// Returns a CSS filter string for the given filter id
// Applied to ctx.filter BEFORE drawing the base frame
// so it affects the entire output including overlays
export function getScreenFilter(filterId) {
    switch (filterId) {
        case 'warm':
            // Warmer tones — increase brightness + sepia hint
            return 'sepia(0.3) saturate(1.4) brightness(1.05)'
        case 'cool':
            // Cooler/blue tones
            return 'hue-rotate(20deg) saturate(0.9) brightness(1.02)'
        case 'vintage':
            // Faded retro look
            return 'sepia(0.6) contrast(0.85) brightness(0.9) saturate(0.8)'
        case 'bw':
            // Black and white
            return 'grayscale(1) contrast(1.1)'
        default:
            return 'none'
    }
}

// Apply screen filter to a canvas context
// Call this BEFORE drawing the video frame in your render loop
export function applyScreenFilter(ctx, filterId) {
    ctx.filter = getScreenFilter(filterId)
}

// Reset filter after drawing
export function resetScreenFilter(ctx) {
    ctx.filter = 'none'
}
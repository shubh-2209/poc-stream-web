import React, { useEffect, useRef } from 'react'

// Dynamically import video.js to avoid SSR issues
let videojs = null

export default function VideoPlayer({ hlsUrl, title, cloudinaryUrl }) {
    const videoRef = useRef(null)
    const playerRef = useRef(null)

    const videoUrl = hlsUrl || cloudinaryUrl

    useEffect(() => {
        if (!videoUrl || !videoRef.current) return

        let mounted = true

        const initPlayer = async () => {
            try {
                // Lazy load video.js
                if (!videojs) {
                    const vjs = await import('video.js')
                    // Import CSS
                    await import('video.js/dist/video-js.css')
                    videojs = vjs.default
                }

                if (!mounted || playerRef.current) return

                playerRef.current = videojs(videoRef.current, {
                    controls: true,
                    autoplay: false,
                    preload: 'metadata',
                    fluid: true,
                    responsive: true,
                    playbackRates: [0.5, 1, 1.25, 1.5, 2],
                    sources: [
                        {
                            // If it's an HLS URL use m3u8 type, otherwise use mp4
                            src: videoUrl,
                            type: videoUrl.includes('.m3u8')
                                ? 'application/x-mpegURL'
                                : 'video/mp4',
                        },
                    ],
                })

                playerRef.current.on('error', () => {
                    console.error('Video.js error for:', videoUrl)
                })
            } catch (err) {
                console.error('Failed to initialize video player:', err)
            }
        }

        initPlayer()

        return () => {
            mounted = false
            if (playerRef.current) {
                playerRef.current.dispose()
                playerRef.current = null
            }
        }
    }, [videoUrl])

    if (!videoUrl) {
        return (
            <div style={styles.card}>
                <div style={styles.noVideo}>🎬 No video URL available</div>
            </div>
        )
    }

    return (
        <div style={styles.card}>
            {title && <h4 style={styles.title}>{title}</h4>}
            <div data-vjs-player style={styles.playerWrap}>
                <video
                    ref={videoRef}
                    className="video-js vjs-big-play-centered vjs-theme-city"
                    style={{ width: '100%', borderRadius: '8px' }}
                    playsInline
                />
            </div>
        </div>
    )
}

const styles = {
    card: {
        background: '#1e1e2e',
        border: '1px solid #2a2a3e',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
    },
    title: {
        color: '#fff',
        fontSize: '16px',
        fontWeight: '600',
        margin: '0 0 14px 0',
    },
    playerWrap: {
        borderRadius: '8px',
        overflow: 'hidden',
        background: '#000',
    },
    noVideo: {
        color: '#666',
        textAlign: 'center',
        padding: '40px',
        fontSize: '14px',
    },
}
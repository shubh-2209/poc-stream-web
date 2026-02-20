import React from 'react'

/**
 * VideoPreview Component
 * FIXED: Now properly detects and reports video duration
 * 
 * This component is crucial for step 2 → 3 navigation
 */
const VideoPreview = ({
  videoUrl,
  videoFile,
  duration,
  onDurationChange,
}) => {
  // ============ HANDLE VIDEO DURATION ============
  /**
   * This is called when video metadata loads
   * CRITICAL: Must call onDurationChange() to enable Next button
   */
  const handleLoadedMetadata = (event) => {
    const videoDuration = event.target.duration
    
    console.log('🎬 Video loaded!')
    console.log('   Duration:', videoDuration)
    
    // ✅ IMPORTANT: Call the callback to update parent state
    if (videoDuration && onDurationChange) {
      console.log('✅ Calling onDurationChange callback')
      onDurationChange(videoDuration)
    }
  }

  // ============ RENDER ============
  return (
    <div className="video-preview-container">
      <h3>📺 Video Preview</h3>

      {/* VIDEO PLAYER */}
      <video
        src={videoUrl}
        controls
        onLoadedMetadata={handleLoadedMetadata}  // ← CRITICAL EVENT
        className="video-player"
        style={{
          width: '100%',
          maxHeight: '400px',
          backgroundColor: '#000',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      />

      {/* VIDEO INFO */}
      <div className="video-info">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
          }}
        >
          {/* File Name */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <label style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#6b7280',
              display: 'block',
              marginBottom: '8px',
            }}>
              📄 File Name
            </label>
            <p
              style={{
                margin: '0',
                fontWeight: 'bold',
                color: '#1f2937',
                fontSize: '0.95rem',
              }}
            >
              {videoFile?.name || 'Unknown'}
            </p>
          </div>

          {/* File Size */}
          <div
            style={{
              padding: '15px',
              backgroundColor: '#f3f4f6',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <label style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#6b7280',
              display: 'block',
              marginBottom: '8px',
            }}>
              💾 File Size
            </label>
            <p
              style={{
                margin: '0',
                fontWeight: 'bold',
                color: '#1f2937',
                fontSize: '0.95rem',
              }}
            >
              {videoFile?.size
                ? (videoFile.size / 1024 / 1024).toFixed(2) + ' MB'
                : 'Unknown'}
            </p>
          </div>

          {/* Duration */}
          <div
            style={{
              padding: '15px',
              backgroundColor: duration > 0 ? '#d1fae5' : '#fee2e2',
              borderRadius: '8px',
              border: duration > 0 ? '1px solid #6ee7b7' : '1px solid #fecaca',
            }}
          >
            <label style={{
              fontSize: '0.85rem',
              fontWeight: '600',
              color: duration > 0 ? '#065f46' : '#991b1b',
              display: 'block',
              marginBottom: '8px',
            }}>
              ⏱️ Duration
            </label>
            <p
              style={{
                margin: '0',
                fontWeight: 'bold',
                color: duration > 0 ? '#065f46' : '#991b1b',
                fontSize: '0.95rem',
              }}
            >
              {duration > 0 ? duration.toFixed(2) + ' seconds' : '⏳ Loading...'}
            </p>
          </div>
        </div>
      </div>

      {/* STATUS MESSAGE */}
      {duration > 0 ? (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            backgroundColor: '#d1fae5',
            border: '1px solid #6ee7b7',
            borderRadius: '6px',
            color: '#065f46',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✅</span>
          <span>Video loaded successfully! You can proceed to the next step.</span>
        </div>
      ) : (
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>⏳</span>
          <span>Please wait for the video to load completely...</span>
        </div>
      )}
    </div>
  )
}

export default VideoPreview

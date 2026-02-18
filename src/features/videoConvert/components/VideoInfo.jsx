// src/features/videoConvert/components/VideoInfo.jsx

import React from 'react'

const VideoInfo = ({ video, onRemove }) => {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  return (
    <div className="video-info-card">
      <div className="video-info-content">
        <div className="video-icon">🎬</div>
        <div className="video-details">
          <div className="video-name">{video.originalName}</div>
          <div className="video-meta">
            {formatBytes(video.size)} · Uploaded ✓
          </div>
        </div>
      </div>
      <button onClick={onRemove} className="btn-remove">
        Remove
      </button>
    </div>
  )
}

export default VideoInfo
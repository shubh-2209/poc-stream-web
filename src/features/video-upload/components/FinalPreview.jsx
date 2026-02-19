import React, { useRef, useState } from "react";
import "../styles/FinalPreview.css";

const FinalPreview = ({ videoUrl, filters, trimData }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleProgressChange = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoStyle = () => {
    return {
      filter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
        opacity(${filters.opacity}%)
      `,
      WebkitFilter: `
        brightness(${filters.brightness}%)
        contrast(${filters.contrast}%)
        saturate(${filters.saturation}%)
        hue-rotate(${filters.hue}deg)
        blur(${filters.blur}px)
        opacity(${filters.opacity}%)
      `,
    };
  };

  const getTrimmedDuration = () => {
    return (trimData.end || duration) - trimData.start;
  };

  return (
    <div className="final-preview">
      <div className="preview-main">
        <h2>Final Preview</h2>
        <p>Review your video before uploading</p>

        <div className="final-video-container">
          <video
            ref={videoRef}
            src={videoUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            style={getVideoStyle()}
            className="final-video"
          />

          <button className="play-button-large" onClick={handlePlayPause}>
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        <div className="playback-controls">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            className="timeline-input"
          />
          <div className="time-info">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="preview-summary">
        <h3>Summary</h3>

        <div className="summary-section">
          <h4>Applied Filters</h4>
          <div className="filter-summary">
            <div className="summary-item">
              <span>Brightness:</span>
              <strong>{filters.brightness}%</strong>
            </div>
            <div className="summary-item">
              <span>Contrast:</span>
              <strong>{filters.contrast}%</strong>
            </div>
            <div className="summary-item">
              <span>Saturation:</span>
              <strong>{filters.saturation}%</strong>
            </div>
            <div className="summary-item">
              <span>Hue Rotation:</span>
              <strong>{filters.hue}°</strong>
            </div>
            <div className="summary-item">
              <span>Blur:</span>
              <strong>{filters.blur}px</strong>
            </div>
            <div className="summary-item">
              <span>Opacity:</span>
              <strong>{filters.opacity}%</strong>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h4>Trim Settings</h4>
          <div className="trim-summary">
            <div className="summary-item">
              <span>Start Time:</span>
              <strong>{formatTime(trimData.start)}</strong>
            </div>
            <div className="summary-item">
              <span>End Time:</span>
              <strong>{formatTime(trimData.end || duration)}</strong>
            </div>
            <div className="summary-item highlight">
              <span>Final Duration:</span>
              <strong>{formatTime(getTrimmedDuration())}</strong>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h4>Quality Check</h4>
          <div className="quality-checks">
            <div className="check-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Filters applied successfully</span>
            </div>
            <div className="check-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Trim settings configured</span>
            </div>
            <div className="check-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Ready for upload</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalPreview;
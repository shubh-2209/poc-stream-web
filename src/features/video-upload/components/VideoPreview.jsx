import React, { useRef, useState, useEffect } from "react";
import "../styles/VideoPreview.css";

const VideoPreview = ({ videoUrl, videoFile, duration = 0, thumbnails = [] }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);
  const [showThumbnailPreview, setShowThumbnailPreview] = useState(false);
  const [hoverThumbnail, setHoverThumbnail] = useState(null);

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
      const dur = videoRef.current.duration;
      setVideoDuration(dur);
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

  const getFileSize = () => {
    if (!videoFile) return "0 MB";
    const size = videoFile.size / (1024 * 1024);
    return size.toFixed(2) + " MB";
  };

  // Find nearest thumbnail for hover preview
  const getNearestThumbnail = (hoverTime) => {
    if (!thumbnails.length) return null;
    
    let nearest = thumbnails[0];
    let minDiff = Math.abs(thumbnails[0].timeSecond - hoverTime);
    
    for (let i = 1; i < thumbnails.length; i++) {
      const diff = Math.abs(thumbnails[i].timeSecond - hoverTime);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = thumbnails[i];
      }
    }
    
    return nearest;
  };

  const handleTimelineHover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const hoverTime = percent * videoDuration;
    const thumbnail = getNearestThumbnail(hoverTime);
    setHoverThumbnail(thumbnail);
  };

  return (
    <div className="video-preview">
      <div className="preview-container">
        <video
          ref={videoRef}
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          className="preview-video"
        />

        <button className="play-button" onClick={handlePlayPause}>
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

        <div className="video-controls">
          <div className="timeline-wrapper">
            <input
              type="range"
              min="0"
              max={videoDuration || 0}
              value={currentTime}
              onChange={handleProgressChange}
              onMouseEnter={() => setShowThumbnailPreview(true)}
              onMouseLeave={() => setShowThumbnailPreview(false)}
              onMouseMove={handleTimelineHover}
              className="timeline-input"
            />

            {/* Thumbnail preview on hover (if backend provides thumbnail URLs) */}
            {showThumbnailPreview && hoverThumbnail && (
              <div className="thumbnail-preview">
                <div className="thumb-image">
                  {hoverThumbnail.imagePath && (
                    <img
                      src={hoverThumbnail.imagePath}
                      alt={`Thumbnail at ${hoverThumbnail.timeLabel}`}
                      className="preview-thumb"
                    />
                  )}
                </div>
                <p className="thumb-label">{hoverThumbnail.timeLabel}</p>
              </div>
            )}
          </div>

          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(videoDuration)}</span>
          </div>
        </div>
      </div>

      <div className="video-info">
        <div className="info-group">
          <label>File Name</label>
          <p>{videoFile?.name || "Unknown"}</p>
        </div>

        <div className="info-group">
          <label>File Size</label>
          <p>{getFileSize()}</p>
        </div>

        <div className="info-group">
          <label>Duration</label>
          <p>{formatTime(videoDuration)}</p>
        </div>

        <div className="info-group">
          <label>Video Type</label>
          <p>{videoFile?.type || "Unknown"}</p>
        </div>

        {thumbnails.length > 0 && (
          <div className="info-group">
            <label>Thumbnails Generated</label>
            <p>{thumbnails.length} frames</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPreview;

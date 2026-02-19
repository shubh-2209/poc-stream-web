import React, { useRef, useState } from "react";
import FilterPanel from "./FilterPanel";
import TrimPanel from "./TrimPanel";
import "../styles/VideoEditor.css";

const VideoEditor = ({
  videoUrl,
  filters,
  trimData,
  duration = 0,
  onFilterChange,
  onTrimChange,
}) => {
  const videoRef = useRef(null);
  const [editorMode, setEditorMode] = useState("filters");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(duration);

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
      
      // Initialize trim data with actual video duration from backend
      if (!trimData.end || trimData.end === null) {
        onTrimChange({ start: 0, end: dur });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
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

  return (
    <div className="video-editor">
      <div className="editor-layout">
        <div className="editor-main">
          <div className="editor-preview">
            <video
              ref={videoRef}
              src={videoUrl}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              style={getVideoStyle()}
              className="editor-video"
            />
            <button className="play-overlay" onClick={handlePlayPause}>
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

          <div className="editor-mode-tabs">
            <button
              className={`mode-tab ${editorMode === "filters" ? "active" : ""}`}
              onClick={() => setEditorMode("filters")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
              Filters
            </button>
            <button
              className={`mode-tab ${editorMode === "trim" ? "active" : ""}`}
              onClick={() => setEditorMode("trim")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 3v18M18 3v18M3 6h18M3 18h18" />
              </svg>
              Trim
            </button>
          </div>
        </div>

        <div className="editor-sidebar">
          {editorMode === "filters" && (
            <FilterPanel filters={filters} onFilterChange={onFilterChange} />
          )}

          {editorMode === "trim" && (
            <TrimPanel
              videoRef={videoRef}
              duration={videoDuration}
              currentTime={currentTime}
              trimData={trimData}
              onTrimChange={onTrimChange}
              onTimeUpdate={(time) => {
                if (videoRef.current) {
                  videoRef.current.currentTime = time;
                  setCurrentTime(time);
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
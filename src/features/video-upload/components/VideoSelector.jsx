import React, { useRef } from "react";
import "../styles/VideoSelector.css";

const VideoSelector = ({ onVideoSelect, isLoading = false, error = null }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 2 * 1024 * 1024 * 1024) {
        // 2GB limit
        alert("File size exceeds 2GB limit");
        return;
      }
      onVideoSelect(file);
    } else {
      alert("Please select a valid video file");
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isLoading) {
      e.currentTarget.classList.add("drag-active");
    }
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-active");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-active");

    if (isLoading) return;

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 2 * 1024 * 1024 * 1024) {
        alert("File size exceeds 2GB limit");
        return;
      }
      onVideoSelect(file);
    } else {
      alert("Please drop a valid video file");
    }
  };

  return (
    <div className="video-selector">
      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
        </div>
      )}

      <div
        className={`selector-container ${isLoading ? "disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="selector-content loading">
            <div className="spinner"></div>
            <h2>Processing Video</h2>
            <p>Generating thumbnails and sprite sheet...</p>
            <p className="loading-subtext">This may take a minute depending on video length</p>
          </div>
        ) : (
          <div className="selector-content">
            <svg
              className="upload-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <h2>Select Your Video</h2>
            <p>Drag and drop your video file here or click to browse</p>

            <button
              className="select-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Choose Video File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              disabled={isLoading}
              style={{ display: "none" }}
            />

            <div className="supported-formats">
              <p>Supported formats: MP4, WebM, MOV, AVI, MKV</p>
              <p>Max file size: 100MB</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoSelector;

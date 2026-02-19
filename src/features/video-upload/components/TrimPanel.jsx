import React, { useState } from "react";
import "../styles/TrimPanel.css";

const TrimPanel = ({
  videoRef,
  duration,
  currentTime,
  trimData,
  onTrimChange,
  onTimeUpdate,
}) => {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds) return "0:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartChange = (e) => {
    const newStart = Math.min(parseFloat(e.target.value), trimData.end || duration);
    onTrimChange({ ...trimData, start: newStart });
  };

  const handleEndChange = (e) => {
    const newEnd = Math.max(parseFloat(e.target.value), trimData.start);
    onTrimChange({ ...trimData, end: newEnd });
  };

  const handleStartInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const newStart = Math.min(val, trimData.end || duration);
      onTrimChange({ ...trimData, start: newStart });
    }
  };

  const handleEndInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      const newEnd = Math.max(val, trimData.start);
      onTrimChange({ ...trimData, end: newEnd });
    }
  };

  const setStartToCurrentTime = () => {
    const newStart = Math.min(currentTime, trimData.end || duration);
    onTrimChange({ ...trimData, start: newStart });
  };

  const setEndToCurrentTime = () => {
    const newEnd = Math.max(currentTime, trimData.start);
    onTrimChange({ ...trimData, end: newEnd });
  };

  const getTrimmedDuration = () => {
    return (trimData.end || duration) - trimData.start;
  };

  return (
    <div className="trim-panel">
      <div className="trim-header">
        <h3>Trim Video</h3>
        <p className="trim-duration">
          Duration: {formatTime(getTrimmedDuration())}
        </p>
      </div>

      <div className="trim-section">
        <label>Start Time</label>
        <div className="time-input-group">
          <input
            type="range"
            min="0"
            max={trimData.end || duration}
            value={trimData.start}
            onChange={handleStartChange}
            className="trim-slider"
          />
          <input
            type="number"
            min="0"
            max={trimData.end || duration}
            value={Math.round(trimData.start * 100) / 100}
            onChange={handleStartInputChange}
            className="time-value-input"
            step="0.01"
          />
          <span className="time-display">{formatTime(trimData.start)}</span>
          <button
            className="set-time-btn"
            onClick={setStartToCurrentTime}
            title="Set to current position"
          >
            Set
          </button>
        </div>
      </div>

      <div className="trim-section">
        <label>End Time</label>
        <div className="time-input-group">
          <input
            type="range"
            min={trimData.start}
            max={duration}
            value={trimData.end || duration}
            onChange={handleEndChange}
            className="trim-slider"
          />
          <input
            type="number"
            min={trimData.start}
            max={duration}
            value={Math.round((trimData.end || duration) * 100) / 100}
            onChange={handleEndInputChange}
            className="time-value-input"
            step="0.01"
          />
          <span className="time-display">
            {formatTime(trimData.end || duration)}
          </span>
          <button
            className="set-time-btn"
            onClick={setEndToCurrentTime}
            title="Set to current position"
          >
            Set
          </button>
        </div>
      </div>

      <div className="trim-visual">
        <div className="timeline-bar">
          <div className="timeline-track">
            <div
              className="timeline-progress"
              style={{
                left: `${(currentTime / duration) * 100}%`,
              }}
            />
          </div>
          <div
            className="trim-range"
            style={{
              left: `${(trimData.start / duration) * 100}%`,
              right: `${100 - ((trimData.end || duration) / duration) * 100}%`,
            }}
          >
            <div className="trim-handle trim-start" />
            <div className="trim-handle trim-end" />
          </div>
        </div>
      </div>

      <div className="trim-info">
        <p>
          <strong>Original Duration:</strong> {formatTime(duration)}
        </p>
        <p>
          <strong>Trimmed Duration:</strong> {formatTime(getTrimmedDuration())}
        </p>
        <p className="trim-warning">
          Note: Actual trimming will be applied on the backend during upload
        </p>
      </div>
    </div>
  );
};

export default TrimPanel;
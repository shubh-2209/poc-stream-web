import React, { useState, useEffect, useRef } from "react"
import "../styles/UploadProgress.css"

/**
 * UploadProgress — Real progress via SSE (Server-Sent Events)
 * 
 * CHANGED:
 * - No more fake setTimeout progress simulation
 * - Shows real step-by-step status from server
 * - onUpload now receives SSE result via callback
 */
const UploadProgress = ({
  isUploading,
  progress,
  onUpload,
  videoFile,
  duration = 0,
  error = null,
  finalResult = null,
  statusMessage = "",   // ← NEW: real status text from server
}) => {
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadError, setUploadError] = useState(error)
  const [actualProgress, setActualProgress] = useState(0)
  const [currentStatus, setCurrentStatus] = useState("")

  // Sync from parent
  useEffect(() => { setActualProgress(progress) }, [progress])
  useEffect(() => { if (error) setUploadError(error) }, [error])
  useEffect(() => { if (statusMessage) setCurrentStatus(statusMessage) }, [statusMessage])
  useEffect(() => {
    if (finalResult) {
      setUploadComplete(true)
      setActualProgress(100)
    }
  }, [finalResult])

  const handleUpload = () => {
    setUploadError(null)
    setActualProgress(0)
    setUploadComplete(false)
    setCurrentStatus("")
    onUpload()
  }

  const getProgressStatus = () => {
    if (uploadError) return "Upload Failed"
    if (uploadComplete) return "Upload Complete ✅"
    if (isUploading) return "Processing..."
    return "Ready to Upload"
  }

  const getProgressMessage = () => {
    if (uploadError) return "An error occurred. Please try again."
    if (uploadComplete) return "Your video has been successfully uploaded and processed."
    if (isUploading && currentStatus) return currentStatus
    if (isUploading) return `Processing... ${Math.round(actualProgress)}%`
    return "Your video is ready to be uploaded to the server."
  }

  // Step indicators based on progress
  const getStepClass = (stepMin, stepMax) => {
    if (actualProgress >= stepMax) return "step-done"
    if (actualProgress >= stepMin) return "step-active"
    return "step-pending"
  }

  return (
    <div className="upload-progress-container">
      <div className="upload-header-section">
        <h2>Upload Video</h2>
        <p>Review and upload your edited video</p>
      </div>

      {/* Status Icon */}
      <div className="status-icon-wrapper">
        {uploadComplete ? (
          <div className="status-icon success">✓</div>
        ) : uploadError ? (
          <div className="status-icon error">✗</div>
        ) : isUploading ? (
          <div className="status-icon uploading">
            <div className="spinner" />
          </div>
        ) : (
          <div className="status-icon idle">▲</div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <span className="progress-status">{getProgressStatus()}</span>
          <span className="progress-percent">{Math.round(actualProgress)}%</span>
        </div>
        <div className="progress-bar-track">
          <div
            className={`progress-bar-fill ${uploadComplete ? "complete" : uploadError ? "error" : ""}`}
            style={{ width: `${actualProgress}%`, transition: "width 0.4s ease" }}
          />
        </div>
        <p className="progress-message">{getProgressMessage()}</p>
      </div>

      {/* Real Step Indicators — shows what server is actually doing */}
      {isUploading && (
        <div className="processing-steps">
          <div className={`processing-step ${getStepClass(0, 40)}`}>
            <span className="step-dot" />
            <span>Uploading video to cloud</span>
          </div>
          <div className={`processing-step ${getStepClass(40, 50)}`}>
            <span className="step-dot" />
            <span>Generating thumbnails & sprites</span>
          </div>
          <div className={`processing-step ${getStepClass(50, 88)}`}>
            <span className="step-dot" />
            <span>Applying filters & trim (FFmpeg)</span>
          </div>
          <div className={`processing-step ${getStepClass(88, 95)}`}>
            <span className="step-dot" />
            <span>Uploading processed video</span>
          </div>
          <div className={`processing-step ${getStepClass(95, 100)}`}>
            <span className="step-dot" />
            <span>Saving to database</span>
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="file-info-section">
        <h3>File Information</h3>
        <div className="file-info-grid">
          <div className="info-row">
            <span>File Name:</span>
            <span>{videoFile?.name || "Unknown"}</span>
          </div>
          <div className="info-row">
            <span>File Size:</span>
            <span>
              {videoFile?.size
                ? (videoFile.size / (1024 * 1024)).toFixed(2) + " MB"
                : "Unknown"}
            </span>
          </div>
          <div className="info-row">
            <span>Duration:</span>
            <span>{duration ? `${Math.round(duration)}s` : "Unknown"}</span>
          </div>
          {isUploading && (
            <div className="info-row">
              <span>Status:</span>
              <span style={{ color: "#f59e0b" }}>Processing on server...</span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {uploadError && (
        <div className="error-section">
          <p>⚠️ {uploadError}</p>
        </div>
      )}

      {/* Action Button */}
      <div className="action-section">
        {!isUploading && !uploadComplete ? (
          <button className="btn btn-primary btn-large" onClick={handleUpload}>
            ▲ Start Upload & Process
          </button>
        ) : uploadComplete ? (
          <button className="btn btn-success btn-large" disabled>
            ✓ Upload Complete
          </button>
        ) : (
          <button className="btn btn-primary btn-large" disabled>
            <span className="btn-spinner" />
            Processing... {Math.round(actualProgress)}%
          </button>
        )}
      </div>

      {/* Note about processing time */}
      {!isUploading && !uploadComplete && (
        <div className="processing-note">
          <p>
            ℹ️ <strong>Note:</strong> If filters/trim are applied, processing may take
            1–5 minutes depending on video length. You can see real-time progress above.
          </p>
        </div>
      )}

      {/* What's Next */}
      {uploadComplete && (
        <div className="whats-next-section">
          <h3>What's Next?</h3>
          <ul>
            <li>✅ Your video has been processed and saved</li>
            <li>📊 Visit your dashboard to manage your videos</li>
            <li>🔗 Share your video with others</li>
            {finalResult?.database?.id && (
              <li>🆔 Video ID: <strong>{finalResult.database.id}</strong></li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

export default UploadProgress
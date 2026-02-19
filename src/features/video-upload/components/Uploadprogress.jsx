import React, { useState, useEffect } from "react"
import "../styles/UploadProgress.css"

const UploadProgress = ({ isUploading, progress, onUpload, videoFile, duration = 0, error = null }) => {
  const [uploadComplete, setUploadComplete] = useState(false)
  const [uploadError, setUploadError] = useState(error)
  const [actualProgress, setActualProgress] = useState(0)

  // Update progress when the prop changes
  useEffect(() => {
    setActualProgress(progress)
  }, [progress])

  // Handle upload completion
  useEffect(() => {
    if (actualProgress === 100 && isUploading) {
      setTimeout(() => {
        setUploadComplete(true)
      }, 1500)
    }
  }, [actualProgress, isUploading])

  // Handle error from parent
  useEffect(() => {
    if (error) {
      setUploadError(error)
    }
  }, [error])

  const handleUpload = () => {
    setUploadError(null)
    setActualProgress(0)
    setUploadComplete(false)
    onUpload()
  }

  const getProgressStatus = () => {
    if (uploadError) return "Upload Failed"
    if (uploadComplete) return "Upload Complete"
    if (isUploading) return "Uploading..."
    return "Ready to Upload"
  }

  const getProgressMessage = () => {
    if (uploadError) return "An error occurred during upload. Please try again."
    if (uploadComplete)
      return "Your video has been successfully uploaded and is being processed."
    if (isUploading) return `Uploading... ${Math.round(actualProgress)}%`
    return "Your video is ready to be uploaded to the server."
  }

  return (
    <div className="upload-progress">
      <div className="upload-container">
        <div className="upload-header">
          <h2>Upload Video</h2>
          <p>Review and upload your edited video</p>
        </div>

        <div className="upload-card">
          <div className="upload-status">
            <div className={`status-icon ${uploadComplete ? "success" : ""}`}>
              {uploadComplete ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : uploadError ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              ) : (
                <div className="spinner" />
              )}
            </div>

            <h3>{getProgressStatus()}</h3>
            <p>{getProgressMessage()}</p>
          </div>

          <div className="progress-section">
            <div className="progress-bar-container">
              <div
                className={`progress-bar ${uploadComplete ? "complete" : ""}`}
                style={{ width: `${Math.min(actualProgress, 100)}%` }}
              />
            </div>
            <div className="progress-text">
              <span>{Math.round(actualProgress)}%</span>
            </div>
          </div>

          <div className="file-info">
            <h4>File Information</h4>
            <div className="info-row">
              <span>File Name:</span>
              <strong>{videoFile?.name || "Unknown"}</strong>
            </div>
            <div className="info-row">
              <span>File Size:</span>
              <strong>{videoFile?.size ? (videoFile.size / (1024 * 1024)).toFixed(2) + " MB" : "Unknown"}</strong>
            </div>
            <div className="info-row">
              <span>Duration:</span>
              <strong>{duration ? `${Math.round(duration)}s` : "Unknown"}</strong>
            </div>
            <div className="info-row">
              <span>Upload Speed:</span>
              <strong>~2.5 MB/s (estimated)</strong>
            </div>
          </div>

          {uploadError && (
            <div className="error-message">
              <p>{uploadError}</p>
            </div>
          )}

          <div className="upload-actions">
            {!isUploading && !uploadComplete ? (
              <button
                className="btn btn-large btn-primary"
                onClick={handleUpload}
              >
                Start Upload
              </button>
            ) : uploadComplete ? (
              <button className="btn btn-large btn-success" disabled>
                Upload Complete
              </button>
            ) : (
              <button className="btn btn-large" disabled>
                Uploading... {Math.round(actualProgress)}%
              </button>
            )}
          </div>

          {uploadComplete && (
            <div className="next-steps">
              <h4>Whats Next?</h4>
              <ul>
                <li>Your video is being processed by our servers</li>
                <li>Check your email for processing updates</li>
                <li>Visit your dashboard to manage your videos</li>
                <li>Share your video with others once ready</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadProgress
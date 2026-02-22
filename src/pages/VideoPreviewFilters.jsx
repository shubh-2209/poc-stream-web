import React, { useState, useEffect, useRef } from "react"
import VideoSelector from "../features/video-upload/components/VideoSelector"
import VideoPreview from "../features/video-upload/components/VideoPreview"
import VideoEditor from "../features/video-upload/components/VideoEditor"
import FinalPreview from "../features/video-upload/components/FinalPreview"
import UploadProgress from "../features/video-upload/components/Uploadprogress"
import StepIndicator from "../features/video-upload/components/StepIndicator"
import "../features/video-upload/styles/VideoUploadPage.css"

/**
 * VideoUploadFilterPage
 * 
 * KEY CHANGE vs original:
 * - handleUpload() now uses SSE (EventSource / fetch + ReadableStream)
 *   instead of a fake setInterval progress simulation
 * - Real server progress messages are passed to UploadProgress
 * - isUploading stays true until server sends 'complete' or 'error'
 * - No more 95% stall — progress reflects what server is actually doing
 */
const VideoUploadFilterPage = () => {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api"

  const [currentStep, setCurrentStep] = useState(1)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [duration, setDuration] = useState(0)

  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    opacity: 100,
  })

  const [trimData, setTrimData] = useState({ start: 0, end: null })

  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusMessage, setUploadStatusMessage] = useState("")
  const [uploadError, setUploadError] = useState(null)
  const [finalResult, setFinalResult] = useState(null)

  useEffect(() => {
    console.log("📊 State:", {
      step: currentStep,
      file: videoFile?.name || "none",
      duration: duration > 0 ? duration.toFixed(2) + "s" : "waiting",
    })
  }, [currentStep, videoFile, duration])

  // ── Step 1: Select ────────────────────────────────────────────
  const handleVideoSelect = (file) => {
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setUploadError(null)
    setFinalResult(null)
    setDuration(0)
    setCurrentStep(2)
  }

  // ── Step 2: Duration detected ─────────────────────────────────
  const handleVideoDuration = (videoDuration) => {
    setDuration(videoDuration)
    setTrimData({ start: 0, end: videoDuration })
  }

  const handleFilterChange = (newFilters) => setFilters(newFilters)
  const handleTrimChange = (newTrimData) => setTrimData(newTrimData)

  // ── Navigation ────────────────────────────────────────────────
  const handleNext = () => {
    if (isUploading) return
    if (currentStep === 2 && duration === 0) {
      setUploadError("Please wait for video to load completely")
      return
    }
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
      setUploadError(null)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1 && !isUploading) {
      setCurrentStep(currentStep - 1)
    }
  }

  // ── Step 5: Upload with REAL SSE progress ─────────────────────
  const handleUpload = async () => {
    if (!videoFile || duration === 0) {
      setUploadError(!videoFile ? "No video file selected" : "Video duration not detected")
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setUploadStatusMessage("Starting upload...")
    setUploadError(null)

    const formData = new FormData()
    formData.append("video", videoFile)
    formData.append("filters", JSON.stringify(filters))
    formData.append("trimData", JSON.stringify(trimData))

    try {
      // ─── SSE via fetch + ReadableStream ──────────────────────
      // We use fetch (not EventSource) because EventSource doesn't support POST.
      const res = await fetch(`${BASE_URL}/v1/videos/finalize`, {
        method: "POST",
        body: formData,
      })

      if (!res.ok) {
        // Non-SSE error response
        let msg = `Server error ${res.status}`
        try {
          const ct = res.headers.get("content-type") || ""
          if (ct.includes("application/json")) {
            const j = await res.json()
            msg = j.message || msg
          } else {
            msg = (await res.text()).substring(0, 200) || msg
          }
        } catch (_) {}
        throw new Error(msg)
      }

      // ─── Read SSE stream ──────────────────────────────────────
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE format: "event: foo\ndata: {...}\n\n"
        // Split on double newline to get individual events
        const parts = buffer.split("\n\n")
        buffer = parts.pop() // last incomplete chunk stays in buffer

        for (const part of parts) {
          if (!part.trim()) continue

          // Parse event type and data
          let eventType = "message"
          let dataStr = ""

          for (const line of part.split("\n")) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim()
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim()
            }
          }

          if (!dataStr) continue

          let payload
          try {
            payload = JSON.parse(dataStr)
          } catch (_) {
            continue
          }

          // ── Handle events ────────────────────────────────────
          if (eventType === "progress") {
            console.log(`📡 SSE progress: ${payload.percent}% — ${payload.message}`)
            setUploadProgress(payload.percent)
            setUploadStatusMessage(payload.message)
          } else if (eventType === "complete") {
            console.log("🎉 SSE complete!", payload.data)
            setUploadProgress(100)
            setUploadStatusMessage("Complete!")
            setFinalResult(payload.data)
            setIsUploading(false)
          } else if (eventType === "error") {
            console.error("❌ SSE error:", payload.message)
            throw new Error(payload.message)
          }
        }
      }
    } catch (error) {
      console.error("❌ Upload error:", error.message)
      setUploadError(error.message)
      setIsUploading(false)
      setUploadProgress(0)
      setUploadStatusMessage("")
    }
  }

  // ── Reset ─────────────────────────────────────────────────────
  const handleReset = () => {
    setCurrentStep(1)
    setVideoFile(null)
    setVideoUrl(null)
    setFinalResult(null)
    setFilters({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      hue: 0,
      blur: 0,
      sharpen: 0,
      opacity: 100,
    })
    setTrimData({ start: 0, end: null })
    setUploadProgress(0)
    setUploadError(null)
    setUploadStatusMessage("")
    setIsUploading(false)
    setDuration(0)
  }

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="video-upload-container">
      <header className="upload-header">
        <h1>🎬 Video Studio</h1>
        <p>Upload, edit, and process your videos</p>
      </header>

      <StepIndicator currentStep={currentStep} totalSteps={5} />

      <div className="upload-content">
        {currentStep === 1 && (
          <VideoSelector
            onVideoSelect={handleVideoSelect}
            isLoading={false}
            error={uploadError}
          />
        )}

        {currentStep === 2 && videoUrl && (
          <VideoPreview
            videoUrl={videoUrl}
            videoFile={videoFile}
            duration={duration}
            onDurationChange={handleVideoDuration}
          />
        )}

        {currentStep === 3 && videoUrl && (
          <VideoEditor
            videoUrl={videoUrl}
            filters={filters}
            trimData={trimData}
            duration={duration}
            onFilterChange={handleFilterChange}
            onTrimChange={handleTrimChange}
          />
        )}

        {currentStep === 4 && videoUrl && (
          <FinalPreview
            videoUrl={videoUrl}
            filters={filters}
            trimData={trimData}
            duration={duration}
          />
        )}

        {currentStep === 5 && videoUrl && (
          <UploadProgress
            isUploading={isUploading}
            progress={uploadProgress}
            onUpload={handleUpload}
            videoFile={videoFile}
            duration={duration}
            error={uploadError}
            finalResult={finalResult}
            statusMessage={uploadStatusMessage}   // ← real server messages
          />
        )}
      </div>

      {uploadError && currentStep < 5 && (
        <div
          className="error-banner"
          style={{
            backgroundColor: "#fee2e2",
            color: "#991b1b",
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "20px",
            border: "1px solid #fecaca",
          }}
        >
          ⚠️ {uploadError}
        </div>
      )}

      {!finalResult ? (
        <div className="navigation-buttons">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1 || isUploading}
          >
            ← Previous
          </button>

          <div className="step-info">
            Step {currentStep} of 5
            {currentStep === 1 && " - Select"}
            {currentStep === 2 && " - Preview"}
            {currentStep === 3 && " - Filters"}
            {currentStep === 4 && " - Review"}
            {currentStep === 5 && " - Upload"}
          </div>

          {currentStep < 5 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={isUploading || (currentStep === 2 && duration === 0)}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading
                ? `Processing... ${Math.round(uploadProgress)}%`
                : "Upload & Process"}
            </button>
          )}
        </div>
      ) : (
        <div className="navigation-buttons">
          <button className="btn btn-primary" onClick={handleReset}>
            Upload Another Video
          </button>
          <div className="success-info">
            ✅ Video processed successfully! (ID: {finalResult.database?.id})
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoUploadFilterPage
import React, { useState, useEffect } from "react"
import VideoSelector from "../features/video-upload/components/VideoSelector"
import VideoPreview from "../features/video-upload/components/VideoPreview"
import VideoEditor from "../features/video-upload/components/VideoEditor"
import FinalPreview from "../features/video-upload/components/FinalPreview"
import UploadProgress from "../features/video-upload/components/Uploadprogress"
import StepIndicator from "../features/video-upload/components/StepIndicator"
import "../features/video-upload/styles/VideoUploadPage.css"

/**
 * SIMPLE WORKFLOW - ONLY UPLOAD IN STEP 5
 * FIXED: Navigation from step 2 to 3 and beyond
 */
const VideoUploadFilterPage = () => {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api"
  
  // ============ STATE: Video File (LOCAL ONLY) ============
  const [currentStep, setCurrentStep] = useState(1)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  
  // ============ STATE: Filters (LOCAL ONLY) ============
  const [filters, setFilters] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    hue: 0,
    blur: 0,
    sharpen: 0,
    opacity: 100,
  })
  
  // ============ STATE: Trim (LOCAL ONLY) ============
  const [trimData, setTrimData] = useState({ start: 0, end: null })
  
  // ============ STATE: Upload Progress (STEP 5 ONLY) ============
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState(null)
  const [finalResult, setFinalResult] = useState(null)

  // ============ DEBUG LOGGING ============
  useEffect(() => {
    console.log('📊 Current state:', {
      step: currentStep,
      videoFile: videoFile?.name || 'none',
      duration: duration > 0 ? duration.toFixed(2) + 's' : 'waiting',
      canNext: currentStep < 5 && (currentStep !== 2 || duration > 0),
    })
  }, [currentStep, videoFile, duration, isUploading])

  // ============ STEP 1: SELECT VIDEO (NO API CALL) ============
  const handleVideoSelect = (file) => {
    try {
      console.log('📁 File selected:', file.name)

      setVideoFile(file)
      setVideoUrl(URL.createObjectURL(file))
      setUploadError(null)
      setFinalResult(null)
      setDuration(0) // Reset duration when new file selected
      
      // Move to step 2
      setCurrentStep(2)
      console.log('✅ Moving to step 2')

    } catch (error) {
      console.error('❌ Error:', error.message)
      setUploadError(error.message)
    }
  }

  // ============ STEP 2: VIDEO PREVIEW (NO API CALL) ============
  const handleVideoDuration = (videoDuration) => {
    console.log('⏱️ Duration detected:', videoDuration.toFixed(2) + 's')
    setDuration(videoDuration)
    setTrimData({
      start: 0,
      end: videoDuration,
    })
  }

  // ============ STEP 3: APPLY FILTERS (NO API CALL) ============
  const handleFilterChange = (newFilters) => {
    console.log('🎨 Filters changed')
    setFilters(newFilters)
  }

  // ============ STEP 4: TRIM VIDEO (NO API CALL) ============
  const handleTrimChange = (newTrimData) => {
    console.log('✂️ Trim changed:', (newTrimData.end - newTrimData.start).toFixed(2) + 's')
    setTrimData(newTrimData)
  }

  // ============ NAVIGATION ============
  const handleNext = () => {
    // ✅ FIX: Allow next if not uploading and conditions met
    if (isUploading) {
      console.log('⏸️ Cannot navigate while uploading')
      return
    }

    if (currentStep === 2 && duration === 0) {
      console.log('⚠️ Cannot proceed - waiting for duration')
      setUploadError('Please wait for video to load completely')
      return
    }

    if (currentStep < 5) {
      console.log('➡️ Step', currentStep, '→', currentStep + 1)
      setCurrentStep(currentStep + 1)
      setUploadError(null) // Clear error when moving forward
    }
  }

  const handlePrev = () => {
    if (currentStep > 1 && !isUploading) {
      console.log('⬅️ Step', currentStep, '→', currentStep - 1)
      setCurrentStep(currentStep - 1)
    }
  }

  // ============ STEP 5: UPLOAD WITH FILTERS (ONLY API CALL) ============
  const handleUpload = async () => {
    // ✅ Validate video file
    if (!videoFile) {
      console.error('❌ No video file')
      setUploadError('No video file selected')
      return
    }

    // ✅ Validate duration
    if (duration === 0) {
      console.error('❌ No duration')
      setUploadError('Video duration not detected')
      return
    }

    console.log('✅ Starting upload...')
    console.log('   Video:', videoFile.name)
    console.log('   Duration:', duration.toFixed(2) + 's')
    console.log('   Trim:', trimData.start.toFixed(2) + 's to ' + trimData.end.toFixed(2) + 's')

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    let progressInterval = null

    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('filters', JSON.stringify(filters))
      formData.append('trimData', JSON.stringify(trimData))

      console.log('📤 Sending to /api/v1/videos/finalize...')

      // Simulate progress
      let currentProgress = 0
      progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) return prev
          if (prev < 30) {
            currentProgress = prev + Math.random() * 5
          } else if (prev < 70) {
            currentProgress = prev + Math.random() * 8
          } else {
            currentProgress = prev + Math.random() * 12
          }
          return Math.min(currentProgress, 95)
        })
      }, 300)

      const response = await fetch(`${BASE_URL}/v1/videos/finalize`, {
        method: 'POST',
        body: formData,
      })

      console.log('📨 Response status:', response.status)

      if (!response.ok) {
        if (progressInterval) clearInterval(progressInterval)

        const contentType = response.headers.get('content-type') || ''
        let errorMessage = `HTTP ${response.status}`

        try {
          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } else {
            const text = await response.text()
            errorMessage = text.substring(0, 200) || errorMessage
          }
        } catch (e) {
          console.error('Error parsing error')
        }

        throw new Error(errorMessage)
      }

      const responseText = await response.text()

      if (!responseText) {
        if (progressInterval) clearInterval(progressInterval)
        throw new Error('Empty response')
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error')
        if (progressInterval) clearInterval(progressInterval)
        throw new Error('Invalid response')
      }

      if (!result.success) {
        if (progressInterval) clearInterval(progressInterval)
        throw new Error(result.message || 'Upload failed')
      }

      // Success!
      if (progressInterval) clearInterval(progressInterval)
      setUploadProgress(100)
      setFinalResult(result.data)

      console.log('🎉 SUCCESS!')
      console.log('   Database ID:', result.data.database.id)

    } catch (error) {
      console.error('❌ Upload error:', error.message)
      setUploadError(error.message)
      setIsUploading(false)
      setUploadProgress(0)

      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }

  // ============ RESET ============
  const handleReset = () => {
    console.log('🔄 Resetting...')
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
    setIsUploading(false)
    setDuration(0)
  }

  // ============ RENDER ============
  return (
    <div className="video-upload-container">
      <header className="upload-header">
        <h1>🎬 Video Studio</h1>
        <p>Upload, edit, and process your videos</p>
      </header>

      <StepIndicator currentStep={currentStep} totalSteps={5} />

      <div className="upload-content">
        {/* STEP 1: SELECT VIDEO */}
        {currentStep === 1 && (
          <VideoSelector
            onVideoSelect={handleVideoSelect}
            isLoading={false}
            error={uploadError}
          />
        )}

        {/* STEP 2: PREVIEW */}
        {currentStep === 2 && videoUrl && (
          <VideoPreview
            videoUrl={videoUrl}
            videoFile={videoFile}
            duration={duration}
            onDurationChange={handleVideoDuration}
          />
        )}

        {/* STEP 3: EDIT FILTERS */}
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

        {/* STEP 4: FINAL PREVIEW */}
        {currentStep === 4 && videoUrl && (
          <FinalPreview
            videoUrl={videoUrl}
            filters={filters}
            trimData={trimData}
            duration={duration}
          />
        )}

        {/* STEP 5: UPLOAD */}
        {currentStep === 5 && videoUrl && (
          <UploadProgress
            isUploading={isUploading}
            progress={uploadProgress}
            onUpload={handleUpload}
            videoFile={videoFile}
            duration={duration}
            error={uploadError}
            finalResult={finalResult}
          />
        )}
      </div>

      {/* ERROR MESSAGE */}
      {uploadError && currentStep < 5 && (
        <div className="error-banner" style={{
          backgroundColor: '#fee2e2',
          color: '#991b1b',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '20px',
          border: '1px solid #fecaca',
        }}>
          ⚠️ {uploadError}
        </div>
      )}

      {/* NAVIGATION */}
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
            {currentStep === 1 && ' - Select'}
            {currentStep === 2 && ' - Preview'}
            {currentStep === 3 && ' - Filters'}
            {currentStep === 4 && ' - Review'}
            {currentStep === 5 && ' - Upload'}
          </div>

          {currentStep < 5 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              // ✅ FIX: Allow next if not uploading and (not step 2 or duration loaded)
              disabled={isUploading || (currentStep === 2 && duration === 0)}
              title={currentStep === 2 && duration === 0 ? "Waiting for video to load..." : ""}
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
          <button
            className="btn btn-primary"
            onClick={handleReset}
          >
            Upload Another Video
          </button>
          <div className="success-info">
            ✅ Video processed successfully! (ID: {finalResult.database.id})
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoUploadFilterPage
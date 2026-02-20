import React, { useState, useEffect } from "react"
import VideoSelector from "../features/video-upload/components/VideoSelector"
import VideoPreview from "../features/video-upload/components/VideoPreview"
import VideoEditor from "../features/video-upload/components/VideoEditor"
import FinalPreview from "../features/video-upload/components/FinalPreview"
import UploadProgress from "../features/video-upload/components/Uploadprogress"
import StepIndicator from "../features/video-upload/components/StepIndicator"
import "../features/video-upload/styles/VideoUploadPage.css"

const VideoUploadFilterPage = () => {
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api"
  const [cloudinaryUrl, setCloudinaryUrl] = useState(null)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [videoFile, setVideoFile] = useState(null)
  const [videoUrl, setVideoUrl] = useState(null)
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
  const [uploadError, setUploadError] = useState(null)
  const [duration, setDuration] = useState(0)

  // ✅ Debug: Log state changes
  useEffect(() => {
    console.log('📊 State update:', {
      cloudinaryUrl: cloudinaryUrl?.substring(0, 50) + '...',
      duration,
      currentStep,
      videoFile: videoFile?.name,
      trimData
    })
  }, [cloudinaryUrl, duration, currentStep, videoFile, trimData])

  // ✅ FIXED: Proper handleVideoSelect with better error handling
  const handleVideoSelect = async (file) => {
  try {
    console.log('🎬 Starting video selection...')
    
    // Reset state
    setVideoFile(file)
    setVideoUrl(URL.createObjectURL(file))
    setUploadError(null)
    setCloudinaryUrl(null)
    setDuration(0)

    const formData = new FormData()
    formData.append('video', file)

    console.log('🔄 Fetching /api/v1/upload...')
    const response = await fetch(`${BASE_URL}/v1/upload`, {
      method: 'POST',
      body: formData,
    })

    console.log('📨 Response received')
    console.log('   Status:', response.status)
    console.log('   Status OK:', response.ok)
    console.log('   Headers:', {
      'content-type': response.headers.get('content-type'),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Response NOT OK:', errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    // ✅ CRITICAL: Get response as text first
    const responseText = await response.text()
    console.log('📝 Response text (raw):', responseText)
    console.log('   Length:', responseText.length)
    console.log('   First 200 chars:', responseText.substring(0, 200))

    // Parse JSON
    let result
    try {
      result = JSON.parse(responseText)
      console.log('✅ Parsed JSON successfully')
      console.log('   Full result:', result)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError)
      console.error('   Response was:', responseText)
      throw new Error('Failed to parse response as JSON')
    }

    if (!result.success) {
      console.error('❌ Response success=false:', result.message)
      throw new Error(result.message || 'Upload failed')
    }

    if (!result.data) {
      console.error('❌ No data in response')
      throw new Error('No data in response')
    }

    // ✅ Extract values
    const backendVideoUrl = result.data.videoUrl
    const videoDuration = result.data.duration

    console.log('📥 Extracted values:')
    console.log('   videoUrl:', backendVideoUrl)
    console.log('   duration:', videoDuration)

    if (!backendVideoUrl) {
      console.error('❌ Missing videoUrl:', result.data)
      throw new Error('No videoUrl in response')
    }

    // ✅ Set state
    console.log('✅ Setting cloudinaryUrl...')
    setCloudinaryUrl(backendVideoUrl)
    console.log('   setCloudinaryUrl called with:', backendVideoUrl)

    if (videoDuration) {
      console.log('✅ Setting duration:', videoDuration)
      setDuration(videoDuration)
      setTrimData({ start: 0, end: videoDuration })
    }

    // ✅ Move to step 2
    console.log('✅ Moving to step 2')
    setCurrentStep(2)
    console.log('✅ Done with video selection')

  } catch (error) {
    console.error('❌ ERROR in handleVideoSelect:', error)
    console.error('   Message:', error.message)
    console.error('   Stack:', error.stack)
    setUploadError(error.message || 'Failed to upload video')
    setCurrentStep(1)
    setCloudinaryUrl(null)
  }
}

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
  }

  const handleTrimChange = (trimDataNew) => {
    setTrimData(trimDataNew)
  }

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUpload = async () => {
    // ✅ Validate cloudinary URL
    if (!cloudinaryUrl) {
      console.error('❌ cloudinaryUrl is null:', { 
        cloudinaryUrl, 
        videoFile: videoFile?.name, 
        duration 
      })
      setUploadError('Video was not properly uploaded. Please select a video again.')
      return
    }

    if (!videoFile) {
      setUploadError('No video file selected')
      return
    }

    console.log('✅ Validation passed. Using Cloudinary URL:', cloudinaryUrl)

    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    let progressInterval = null

    try {
      const formData = new FormData()
      formData.append('videoUrl', cloudinaryUrl)  // ✅ Use Cloudinary URL
      formData.append('duration', String(duration))
      formData.append('filters', JSON.stringify(filters))
      formData.append('trimData', JSON.stringify(trimData))

      console.log('📤 Sending to /api/v1/videos/finalize...')
      console.log('Parameters:', {
        videoUrl: cloudinaryUrl.substring(0, 50) + '...',
        duration,
        filters,
        trimData
      })

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
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
          if (contentType.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorMessage
          } else {
            const text = await response.text()
            console.error('Non-JSON error response:', text)
            errorMessage = text || errorMessage
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }

        throw new Error(errorMessage)
      }

      const responseText = await response.text()
      console.log('📝 Raw response:', responseText.substring(0, 200))

      if (!responseText) {
        if (progressInterval) clearInterval(progressInterval)
        throw new Error('Empty response from server')
      }

      let result
      try {
        result = JSON.parse(responseText)
        console.log('✅ Parsed response:', result)
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        if (progressInterval) clearInterval(progressInterval)
        throw new Error(`Invalid JSON: ${responseText.substring(0, 100)}`)
      }

      if (!result.success) {
        if (progressInterval) clearInterval(progressInterval)
        throw new Error(result.message || 'Upload failed')
      }

      // Success!
      if (progressInterval) clearInterval(progressInterval)
      setUploadProgress(100)
      console.log('🎉 Upload successful!')
      console.log('Final video URL:', result.data?.finalUrl)

    } catch (error) {
      console.error('❌ Upload error:', error)
      setUploadError(error.message)
      setIsUploading(false)
      setUploadProgress(0)

      if (progressInterval) {
        clearInterval(progressInterval)
      }
    }
  }

  const handleReset = () => {
    setCurrentStep(1)
    setVideoFile(null)
    setVideoUrl(null)
    setCloudinaryUrl(null)
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

  return (
    <div className="video-upload-container">
      <header className="upload-header">
        <h1>Video Studio</h1>
        <p>Create, edit, and upload your videos with professional tools</p>
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
            onDurationChange={setDuration}
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
          />
        )}
      </div>

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
        </div>

        {currentStep < 5 ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={isUploading}
          >
            Next →
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleUpload}
            disabled={isUploading || !cloudinaryUrl}
          >
            {isUploading
              ? `Uploading... ${Math.round(uploadProgress)}%`
              : "Upload Video"}
          </button>
        )}
      </div>
    </div>
  )
}

export default VideoUploadFilterPage
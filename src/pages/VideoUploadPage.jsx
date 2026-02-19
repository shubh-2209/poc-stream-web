// src/pages/VideoUploadPage.jsx

import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  uploadVideoThunk,
  convertVideoThunk,
  downloadVideoThunk,
  resetVideoConvert,
  setCurrentStep,
  selectUploadStatus,
  selectUploadProgress,
  selectUploadedVideo,
  selectUploadError,
  selectConvertStatus,
  selectConvertedVideo,
  selectConvertError,
  selectDownloadStatus,
  selectCurrentStep,
  selectIsLoading,
} from '../features/videoConvert/videoConvertSlice'

import DropZone from '../features/videoConvert/components/DropZone'
import ProgressBar from '../features/videoConvert/components/ProgressBar'
import VideoInfo from '../features/videoConvert/components/VideoInfo'
import ConfigurationPanel from '../features/videoConvert/components/ConfigurationPanel'
import ConversionResult from '../features/videoConvert/components/ConversionResult'
import ErrorAlert from '../features/videoConvert/components/ErrorAlert'
import LoadingSpinner from '../features/videoConvert/components/LoadingSpinner'

import '../features/videoConvert/styles/VideoUploadPage.css'

const VideoUploadPage = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate();
  // Redux state
  const uploadStatus = useSelector(selectUploadStatus)
  const uploadProgress = useSelector(selectUploadProgress)
  const uploadedVideo = useSelector(selectUploadedVideo)
  const uploadError = useSelector(selectUploadError)

  const convertStatus = useSelector(selectConvertStatus)
  const convertedVideo = useSelector(selectConvertedVideo)
  const convertError = useSelector(selectConvertError)

  const downloadStatus = useSelector(selectDownloadStatus)
  const currentStep = useSelector(selectCurrentStep)
  const isLoading = useSelector(selectIsLoading)

  // Local state for configuration
  const [format, setFormat] = useState('mp4')
  const [quality, setQuality] = useState('medium')
  const [resolution, setResolution] = useState('')
  const [filters, setFilters] = useState({
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    sharpen: 0,
    denoise: 0,
    blur: 0,
    vignette: 0,
    colorTemp: 0,
    vibrance: 1,
    rotate: 0,
    flipH: false,
    flipV: false,
    blackWhite: false,
    sepia: false,
    negative: false,
  })
  const [activeTab, setActiveTab] = useState('basic')

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispatch(resetVideoConvert())
    }
  }, [dispatch])

  // Handlers
  const handleUpload = (file, title) => {
    dispatch(uploadVideoThunk({ file, title }))
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/dashboard')
    }
  }

  const handleConvert = () => {
    if (!uploadedVideo) return

    // Build filters object (only send non-default values)
    const activeFilters = {}
    if (filters.brightness !== 0) activeFilters.brightness = filters.brightness
    if (filters.contrast !== 1) activeFilters.contrast = filters.contrast
    if (filters.saturation !== 1) activeFilters.saturation = filters.saturation
    if (filters.gamma !== 1) activeFilters.gamma = filters.gamma
    if (filters.sharpen > 0) activeFilters.sharpen = filters.sharpen
    if (filters.denoise > 0) activeFilters.denoise = filters.denoise
    if (filters.blur > 0) activeFilters.blur = filters.blur
    if (filters.vignette > 0) activeFilters.vignette = filters.vignette
    if (filters.colorTemp !== 0) activeFilters.colorTemp = filters.colorTemp
    if (filters.vibrance !== 1) activeFilters.vibrance = filters.vibrance
    if (filters.rotate !== 0) activeFilters.rotate = filters.rotate
    if (filters.flipH) activeFilters.flipH = true
    if (filters.flipV) activeFilters.flipV = true
    if (filters.blackWhite) activeFilters.blackWhite = true
    if (filters.sepia) activeFilters.sepia = true
    if (filters.negative) activeFilters.negative = true

    dispatch(
      convertVideoThunk({
        videoId: uploadedVideo.id,
        outputFormat: format,
        quality,
        resolution: resolution || undefined,
        filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
      })
    )
  }

  const handleDownload = () => {
    if (!convertedVideo) return
    dispatch(downloadVideoThunk(convertedVideo.id))
  }

  const handleReset = () => {
    dispatch(resetVideoConvert())
    setFormat('mp4')
    setQuality('medium')
    setResolution('')
    setFilters({
      brightness: 0,
      contrast: 1,
      saturation: 1,
      gamma: 1,
      sharpen: 0,
      denoise: 0,
      blur: 0,
      vignette: 0,
      colorTemp: 0,
      vibrance: 1,
      rotate: 0,
      flipH: false,
      flipV: false,
      blackWhite: false,
      sepia: false,
      negative: false,
    })
    setActiveTab('basic')
  }

  const isUploadDisabled = uploadStatus === 'loading'
  const isConfigDisabled = uploadStatus !== 'succeeded' || isLoading
  const isConvertDisabled = uploadStatus !== 'succeeded' || isLoading

  return (
    <div className="video-upload-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">▶</div>
            <span className="logo-text">VIDFORGE PRO</span>
          </div>
          <div className="header-subtitle">ADVANCED FILTERS</div>
          <button className="back-button" onClick={handleBack}>
            ← Back
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-main">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">
            <span className="title-primary">Video</span>
            <br />
            <span className="title-accent">Converter</span>
          </h1>
          <p className="hero-subtitle">
            Professional video conversion with 15+ advanced filters
          </p>
        </div>

        {/* Step 1: Upload */}
        <section className="section-upload">
          <div className="section-header">
            <div className={`step-badge ${currentStep >= 1 ? 'active' : ''}`}>1</div>
            <span className="section-title">UPLOAD</span>
          </div>

          {uploadStatus === 'idle' || uploadStatus === 'loading' ? (
            <div>
              <DropZone onFile={handleUpload} disabled={isUploadDisabled} />
              {uploadStatus === 'loading' && (
                <div className="upload-progress-container">
                  <div className="progress-info">
                    <span className="progress-label">Uploading…</span>
                    <span className="progress-value">{uploadProgress}%</span>
                  </div>
                  <ProgressBar value={uploadProgress} />
                </div>
              )}
            </div>
          ) : uploadStatus === 'succeeded' && uploadedVideo ? (
            <VideoInfo video={uploadedVideo} onRemove={handleReset} />
          ) : null}

          {uploadError && <ErrorAlert message={uploadError} />}
        </section>

        {/* Step 2: Configure */}
        <section
          className={`section-configure ${isConfigDisabled ? 'disabled' : ''}`}
        >
          <div className="section-header">
            <div className={`step-badge ${currentStep >= 2 ? 'active' : ''}`}>2</div>
            <span className="section-title">CONFIGURE</span>
          </div>

          <ConfigurationPanel
            format={format}
            setFormat={setFormat}
            quality={quality}
            setQuality={setQuality}
            resolution={resolution}
            setResolution={setResolution}
            filters={filters}
            setFilters={setFilters}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            disabled={isConfigDisabled}
          />
        </section>

        {/* Step 3: Convert */}
        <section className="section-convert">
          {convertError && <ErrorAlert message={convertError} />}

          {convertStatus === 'loading' && (
            <div className="converting-container">
              <div className="converting-info">
                <span className="converting-label">Converting with filters…</span>
                <LoadingSpinner />
              </div>
              <div className="indeterminate-progress">
                <div className="indeterminate-bar" />
              </div>
            </div>
          )}

          {convertStatus !== 'succeeded' && (
            <button
              onClick={handleConvert}
              disabled={isConvertDisabled}
              className={`btn-convert ${isConvertDisabled ? 'disabled' : ''}`}
            >
              {convertStatus === 'loading' ? 'CONVERTING…' : 'CONVERT VIDEO'}
            </button>
          )}
        </section>

        {/* Step 4: Result */}
        {convertStatus === 'succeeded' && convertedVideo && (
          <ConversionResult
            result={convertedVideo}
            onDownload={handleDownload}
            onReset={handleReset}
            downloadStatus={downloadStatus}
          />
        )}
      </main>
    </div>
  )
}

export default VideoUploadPage
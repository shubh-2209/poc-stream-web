import { useState, useCallback, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useVideoProcessor } from '../hooks/useVideoProcessor'
import {
  processThumbnails,
  resetThumbnails,
  selectThumbnails,
  selectThumbVideoUrl,
  selectThumbDuration,
  selectThumbInterval,
  selectThumbLoading,
  selectThumbError,
  selectThumbProgress,
  selectThumbCount,
} from '../features/videoThumbnail/videoThumbnailSlice'
// import { getThumbnailImageUrl } from '../features/videoThumbnail/videoThumbnailApi'
import styles from '../styles/Upload/VideoUpload.module.css'

// ─── Constants ────────────────────────────────────────────────
const FORMATS = [
  { value: 'mp4',  label: 'MP4'  }, { value: 'mkv',  label: 'MKV'  },
  { value: 'webm', label: 'WebM' }, { value: 'avi',  label: 'AVI'  },
  { value: 'mov',  label: 'MOV'  }, { value: 'flv',  label: 'FLV'  },
  { value: 'wmv',  label: 'WMV'  }, { value: 'mpeg', label: 'MPEG' },
]
const QUALITIES = [
  { value: 'lossless', label: 'Lossless', desc: 'Zero quality loss' },
  { value: 'high',     label: 'High',     desc: 'Visually lossless' },
  { value: 'medium',   label: 'Medium',   desc: 'Best balance' },
  { value: 'low',      label: 'Low',      desc: 'Smallest file' },
]
const RESOLUTIONS = [
  { value: '',      label: 'Original' }, { value: '360p',  label: '360p' },
  { value: '480p',  label: '480p' },     { value: '720p',  label: '720p' },
  { value: '1080p', label: '1080p' },    { value: '1440p', label: '1440p' },
  { value: '4k',    label: '4K' },
]

// ─── Helpers ──────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ─── Sub-components ───────────────────────────────────────────

function DropZone({ onFile, disabled }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }, [disabled, onFile])

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`${styles.dropZone} ${dragging ? styles.dropZoneDragging : ''} ${disabled ? styles.dropZoneDisabled : ''}`}
    >
      <input ref={inputRef} type="file" accept="video/*,.mpeg" style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <div className={styles.dropZoneIcon}>⬡</div>
      <div className={styles.dropZoneTitle}>Drop video here</div>
      <div className={styles.dropZoneSubtitle}>MP4, MKV, WebM, AVI, MOV, FLV, WMV, MPEG · up to 2 GB</div>
    </div>
  )
}

function ProgressBar({ value }) {
  return (
    <div className={styles.progressBarTrack}>
      <div className={styles.progressBarFill} style={{ width: `${value}%` }} />
    </div>
  )
}

function Chip({ label, selected, onClick }) {
  return (
    <button onClick={onClick} className={`${styles.chip} ${selected ? styles.chipActive : ''}`}>
      {label}
    </button>
  )
}

function Slider({ label, value, min, max, step, onChange, unit = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className={styles.sliderWrapper}>
      <div className={styles.sliderHeader}>
        <label className={styles.sliderLabel}>{label}</label>
        <span className={styles.sliderValue}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className={styles.sliderInput}
        style={{ background: `linear-gradient(to right, #e8ff47 0%, #e8ff47 ${pct}%, #2a2a2a ${pct}%, #2a2a2a 100%)` }}
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className={styles.toggleLabel}>
      <div className={`${styles.toggleTrack} ${checked ? styles.toggleTrackOn : styles.toggleTrackOff}`}>
        <div className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
      </div>
      <span className={`${styles.toggleText} ${checked ? styles.toggleTextOn : styles.toggleTextOff}`}>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ display: 'none' }} />
    </label>
  )
}

function StatBox({ label, value, accent = false }) {
  return (
    <div className={accent ? styles.statBoxAccent : styles.statBox}>
      <div className={styles.statLabel}>{label}</div>
      <div className={accent ? styles.statValueAccent : styles.statValue}>{value}</div>
    </div>
  )
}

// ─── VideoPlayer with YouTube-style Thumbnail Hover ───────────
function VideoPlayer({ videoUrl, thumbnails, duration, interval }) {
  const videoRef      = useRef(null)
  const wrapperRef    = useRef(null)

  // Hover preview state
  const [hoverVisible,  setHoverVisible]  = useState(false)
  const [hoverX,        setHoverX]        = useState(0)
  const [hoverThumb,    setHoverThumb]    = useState(null)
  const [hoverTimeText, setHoverTimeText] = useState('')

  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3333'

  // Find correct thumbnail for a given time
  const getThumbForTime = useCallback((timeSec) => {
    if (!thumbnails || thumbnails.length === 0) return null
    const frameIndex = Math.min(
      Math.floor(timeSec / interval),
      thumbnails.length - 1
    )
    return thumbnails[Math.max(0, frameIndex)]
  }, [thumbnails, interval])

  const handleMouseMove = useCallback((e) => {
    if (!videoRef.current || !duration) return
    const rect = videoRef.current.getBoundingClientRect()
    const mouseX  = e.clientX - rect.left
    const percent = Math.max(0, Math.min(mouseX / rect.width, 1))
    const timeSec = percent * duration

    const thumb = getThumbForTime(timeSec)
    if (!thumb) return

    // Keep preview within bounds (preview width = 160px)
    const clampedX = Math.max(0, Math.min(mouseX - 80, rect.width - 160))

    setHoverX(clampedX)
    setHoverThumb(thumb)
    setHoverTimeText(formatTime(timeSec))
    setHoverVisible(true)
  }, [duration, getThumbForTime])

  const handleMouseLeave = useCallback(() => {
    setHoverVisible(false)
  }, [])

  if (!videoUrl) return null

  return (
    <div className={styles.videoWrapper} ref={wrapperRef}>
      {/* ── Actual Video ── */}
      <video
        ref={videoRef}
        src={`${BACKEND_URL}${videoUrl}`}
        controls
        className={styles.videoPlayer}
      />

      {/* ── Hover Detection Overlay (over bottom controls area) ── */}
      {thumbnails?.length > 0 && (
        <div
          className={styles.hoverDetector}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* ── Thumbnail Hover Preview ── */}
      {hoverVisible && hoverThumb && (
        <div
          className={styles.hoverPreview}
          style={{ left: `${hoverX}px` }}
        >
          <img
            src={`${BACKEND_URL}${hoverThumb.imagePath}`}
            alt={hoverThumb.timeLabel}
            className={styles.hoverPreviewImg}
          />
          <div className={styles.hoverTimeLabel}>{hoverTimeText}</div>
        </div>
      )}
    </div>
  )
}

// ─── Thumbnail Processing Status ─────────────────────────────
function ThumbnailStatus({ loading, error, thumbCount, thumbProgress }) {
  if (!loading && !error && thumbCount === 0) return null

  return (
    <div className={styles.thumbStatusWrapper}>
      {loading && (
        <>
          <div className={styles.thumbStatusHeader}>
            <span className={styles.thumbStatusLabel}>
              🎞️ Generating thumbnails… {thumbProgress < 100 ? `(${thumbProgress}%)` : 'Processing…'}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill}
              style={{ width: thumbProgress < 100 ? `${thumbProgress}%` : '100%', opacity: thumbProgress === 100 ? 0.6 : 1 }}
            />
          </div>
        </>
      )}
      {error && (
        <div className={styles.thumbError}>⚠ Thumbnail generation failed: {error}</div>
      )}
      {!loading && !error && thumbCount > 0 && (
        <div className={styles.thumbSuccess}>✓ {thumbCount} thumbnails ready · Hover over video progress bar to preview</div>
      )}
    </div>
  )
}

// ─── Main VideoUploadPage ─────────────────────────────────────
const VideoUploadPage = () => {
  const dispatch = useDispatch()
  const { state, upload, convert, reset, downloadUrl } = useVideoProcessor()

  // Thumbnail Redux state
  const thumbnails    = useSelector(selectThumbnails)
  const thumbVideoUrl = useSelector(selectThumbVideoUrl)
  const thumbDuration = useSelector(selectThumbDuration)
  const thumbInterval = useSelector(selectThumbInterval)
  const thumbLoading  = useSelector(selectThumbLoading)
  const thumbError    = useSelector(selectThumbError)
  const thumbProgress = useSelector(selectThumbProgress)
  const thumbCount    = useSelector(selectThumbCount)

  // Conversion settings
  const [format,     setFormat]     = useState('mp4')
  const [quality,    setQuality]    = useState('medium')
  const [resolution, setResolution] = useState('')
  const [brightness, setBrightness] = useState(0)
  const [contrast,   setContrast]   = useState(1)
  const [saturation, setSaturation] = useState(1)
  const [gamma,      setGamma]      = useState(1)
  const [sharpen,    setSharpen]    = useState(0)
  const [denoise,    setDenoise]    = useState(0)
  const [blur,       setBlur]       = useState(0)
  const [vignette,   setVignette]   = useState(0)
  const [colorTemp,  setColorTemp]  = useState(0)
  const [vibrance,   setVibrance]   = useState(1)
  const [rotate,     setRotate]     = useState(0)
  const [flipH,      setFlipH]      = useState(false)
  const [flipV,      setFlipV]      = useState(false)
  const [blackWhite, setBlackWhite] = useState(false)
  const [sepia,      setSepia]      = useState(false)
  const [negative,   setNegative]   = useState(false)
  const [tab,        setTab]        = useState('basic')

  const isProcessing     = state.stage === 'uploading' || state.stage === 'converting'
  const isDisabled       = isProcessing || state.stage === 'idle' || state.stage === 'uploading'
  const isConfigDisabled = state.stage === 'idle' || state.stage === 'uploading'

  // ── When file is dropped: run both conversion upload + thumbnail upload ──
  const handleFile = useCallback((file) => {
    upload(file)                              // existing conversion flow
    dispatch(processThumbnails(file))        // thumbnail generation
  }, [upload, dispatch])

  // ── Reset both flows ──
  const handleReset = useCallback(() => {
    reset()
    dispatch(resetThumbnails())
  }, [reset, dispatch])

  function handleConvert() {
    const filters = {}
    if (brightness !== 0)  filters.brightness = brightness
    if (contrast !== 1)    filters.contrast   = contrast
    if (saturation !== 1)  filters.saturation = saturation
    if (gamma !== 1)       filters.gamma      = gamma
    if (sharpen > 0)       filters.sharpen    = sharpen
    if (denoise > 0)       filters.denoise    = denoise
    if (blur > 0)          filters.blur       = blur
    if (vignette > 0)      filters.vignette   = vignette
    if (colorTemp !== 0)   filters.colorTemp  = colorTemp
    if (vibrance !== 1)    filters.vibrance   = vibrance
    if (rotate !== 0)      filters.rotate     = rotate
    if (flipH)             filters.flipH      = true
    if (flipV)             filters.flipV      = true
    if (blackWhite)        filters.blackWhite = true
    if (sepia)             filters.sepia      = true
    if (negative)          filters.negative   = true

    convert({
      outputFormat: format,
      quality,
      resolution:   resolution || undefined,
      filters:      Object.keys(filters).length > 0 ? filters : undefined,
    })
  }

  return (
    <div className={styles.pageWrapper}>

      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>▶</div>
          <span className={styles.headerTitle}>VIDFORGE PRO</span>
        </div>
        <div className={styles.headerBadge}>ADVANCED FILTERS</div>
      </header>

      <main className={styles.main}>

        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>
            <span className={styles.heroTitleWhite}>Video</span><br />
            <span className={styles.heroTitleAccent}>Converter</span>
          </h1>
          <p className={styles.heroSubtitle}>Professional video conversion with 15+ advanced filters</p>
        </div>

        {/* ── Step 1: Upload ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={`${styles.stepBadge} ${state.stage !== 'idle' ? styles.stepBadgeActive : styles.stepBadgeInactive}`}>1</div>
            <span className={styles.stepLabel}>UPLOAD</span>
          </div>

          {(state.stage === 'idle' || state.stage === 'uploading') ? (
            <div>
              <DropZone onFile={handleFile} disabled={isProcessing} />
              {state.stage === 'uploading' && (
                <div className={styles.uploadProgressWrapper}>
                  <div className={styles.uploadProgressHeader}>
                    <span className={styles.uploadProgressLabel}>Uploading for conversion…</span>
                    <span className={styles.uploadProgressValue}>{state.uploadProgress}%</span>
                  </div>
                  <ProgressBar value={state.uploadProgress} />
                </div>
              )}
            </div>
          ) : (
            <div>
              {/* ── File Card ── */}
              <div className={styles.fileCard}>
                <div className={styles.fileCardLeft}>
                  <div className={styles.fileCardIcon}>🎬</div>
                  <div>
                    <div className={styles.fileCardName}>{state.uploadResult?.originalName}</div>
                    <div className={styles.fileCardMeta}>{formatBytes(state.uploadResult?.size ?? 0)} · Uploaded ✓</div>
                  </div>
                </div>
                <button onClick={handleReset} className={styles.removeBtn}>Remove</button>
              </div>

              {/* ── Thumbnail Status ── */}
              <ThumbnailStatus
                loading={thumbLoading}
                error={thumbError}
                thumbCount={thumbCount}
                thumbProgress={thumbProgress}
              />

              {/* ── Video Player with Hover Preview ── */}
              {thumbVideoUrl && (
                <VideoPlayer
                  videoUrl={thumbVideoUrl}
                  thumbnails={thumbnails}
                  duration={thumbDuration}
                  interval={thumbInterval}
                />
              )}
            </div>
          )}
        </section>

        {/* ── Step 2: Configure ── */}
        <section className={isConfigDisabled ? styles.sectionDisabled : styles.sectionEnabled}>
          <div className={styles.sectionHeaderConfigure}>
            <div className={`${styles.stepBadge} ${state.stage === 'done' ? styles.stepBadgeActive : styles.stepBadgeInactive}`}>2</div>
            <span className={styles.stepLabel}>CONFIGURE</span>
          </div>

          <div className={styles.tabSwitcher}>
            <button onClick={() => setTab('basic')} className={`${styles.tabBtn} ${tab === 'basic' ? styles.tabBtnActive : styles.tabBtnInactive}`}>BASIC</button>
            <button onClick={() => setTab('advanced')} className={`${styles.tabBtn} ${tab === 'advanced' ? styles.tabBtnActive : styles.tabBtnInactive}`}>ADVANCED</button>
          </div>

          {tab === 'basic' && (
            <div>
              <div>
                <label className={styles.fieldLabel}>Format</label>
                <div className={styles.chipGroup}>
                  {FORMATS.map(f => <Chip key={f.value} label={f.label} selected={format === f.value} onClick={() => setFormat(f.value)} />)}
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Quality</label>
                <div className={styles.qualityGrid}>
                  {QUALITIES.map(q => (
                    <button key={q.value} onClick={() => setQuality(q.value)} className={`${styles.qualityCard} ${quality === q.value ? styles.qualityCardActive : ''}`}>
                      <div className={styles.qualityCardTitle}>{q.label}</div>
                      <div className={quality === q.value ? styles.qualityCardDescActive : styles.qualityCardDesc}>{q.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={styles.fieldLabel}>Resolution</label>
                <div className={styles.chipGroup}>
                  {RESOLUTIONS.map(r => <Chip key={r.value} label={r.label} selected={resolution === r.value} onClick={() => setResolution(r.value)} />)}
                </div>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div className={styles.advancedScroll}>
              <div className={styles.filterGroup}>
                <h3 className={`${styles.filterGroupTitle} ${styles.filterGroupTitleColor}`}>Color</h3>
                <Slider label="Brightness" value={brightness} min={-1}   max={1}   step={0.01} onChange={setBrightness} />
                <Slider label="Contrast"   value={contrast}   min={0}    max={3}   step={0.01} onChange={setContrast}   unit="x" />
                <Slider label="Saturation" value={saturation} min={0}    max={3}   step={0.01} onChange={setSaturation} unit="x" />
                <Slider label="Gamma"      value={gamma}      min={0.1}  max={3}   step={0.01} onChange={setGamma} />
                <Slider label="Color Temp" value={colorTemp}  min={-100} max={100} step={1}    onChange={setColorTemp} />
                <Slider label="Vibrance"   value={vibrance}   min={0}    max={2}   step={0.01} onChange={setVibrance}   unit="x" />
              </div>
              <div className={styles.filterGroup}>
                <h3 className={`${styles.filterGroupTitle} ${styles.filterGroupTitleEffects}`}>Effects</h3>
                <Slider label="Sharpen"  value={sharpen}  min={0} max={10} step={1}    onChange={setSharpen} />
                <Slider label="Denoise"  value={denoise}  min={0} max={10} step={1}    onChange={setDenoise} />
                <Slider label="Blur"     value={blur}     min={0} max={10} step={1}    onChange={setBlur} />
                <Slider label="Vignette" value={vignette} min={0} max={1}  step={0.01} onChange={setVignette} />
              </div>
              <div className={styles.filterGroup}>
                <h3 className={`${styles.filterGroupTitle} ${styles.filterGroupTitleTransform}`}>Transform</h3>
                <Slider label="Rotate" value={rotate} min={0} max={270} step={90} onChange={setRotate} unit="°" />
                <Toggle label="Flip Horizontal" checked={flipH} onChange={setFlipH} />
                <Toggle label="Flip Vertical"   checked={flipV} onChange={setFlipV} />
              </div>
              <div className={styles.filterGroup}>
                <h3 className={`${styles.filterGroupTitle} ${styles.filterGroupTitleStyle}`}>Style</h3>
                <Toggle label="Black & White" checked={blackWhite} onChange={setBlackWhite} />
                <Toggle label="Sepia Tone"    checked={sepia}      onChange={setSepia} />
                <Toggle label="Negative"      checked={negative}   onChange={setNegative} />
              </div>
            </div>
          )}
        </section>

        {/* ── Step 3: Convert ── */}
        <section className={styles.section}>
          {state.stage === 'error' && (
            <div className={styles.errorBanner}>
              <span>⚠</span><span>{state.error}</span>
            </div>
          )}
          {state.stage === 'converting' && (
            <div className={styles.convertingCard}>
              <div className={styles.convertingHeader}>
                <span className={styles.convertingLabel}>Converting with filters…</span>
                <span className={styles.convertingSpinner}>⟳</span>
              </div>
              <div className={styles.loaderTrack}>
                <div className={styles.loaderBar} />
              </div>
            </div>
          )}
          {state.stage !== 'done' && (
            <button onClick={handleConvert} disabled={isDisabled}
              className={`${styles.convertBtn} ${isDisabled ? styles.convertBtnDisabled : styles.convertBtnActive}`}>
              {state.stage === 'converting' ? 'CONVERTING…' : 'CONVERT VIDEO'}
            </button>
          )}
        </section>

        {/* ── Result ── */}
        {state.stage === 'done' && state.convertResult && (
          <section className={styles.resultCard}>
            <div className={styles.resultHeader}>
              <div className={styles.resultCheckBadge}>✓</div>
              <span className={styles.resultTitle}>COMPLETE</span>
            </div>
            <div className={styles.statBoxRow}>
              <StatBox label="Original"  value={`${state.convertResult.originalSizeMB} MB`} />
              <StatBox label="Converted" value={`${state.convertResult.convertedSizeMB} MB`} />
              <StatBox label="Saved"     value={`${state.convertResult.savedMB} MB`} accent />
              <StatBox label="Reduction" value={state.convertResult.compressionRate} accent />
            </div>
            {state.convertResult.filtersApplied?.length > 0 && (
              <div className={styles.filtersAppliedCard}>
                <div className={styles.filtersAppliedLabel}>Filters Applied</div>
                <div className={styles.filtersAppliedList}>
                  {state.convertResult.filtersApplied.map((f, i) => (
                    <span key={i} className={styles.filterTag}>{f}</span>
                  ))}
                </div>
              </div>
            )}
            <a href={downloadUrl ?? '#'} download={state.convertResult.convertedFile} className={styles.downloadBtn}>
              ↓ DOWNLOAD {state.convertResult.outputFormat.toUpperCase()}
            </a>
            <button onClick={handleReset} className={styles.resetBtn}>Process another video</button>
          </section>
        )}
      </main>
    </div>
  )
}

export default VideoUploadPage
// src/features/videoConvert/components/ConfigurationPanel.jsx

import React from 'react'
import Chip from './Chip'
import Slider from './Slider'
import Toggle from './Toggle'

const FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' },
  { value: 'avi', label: 'AVI' },
  { value: 'mov', label: 'MOV' },
  { value: 'flv', label: 'FLV' },
  { value: 'wmv', label: 'WMV' },
  { value: 'mpeg', label: 'MPEG' },
]

const QUALITIES = [
  { value: 'lossless', label: 'Lossless', desc: 'Zero quality loss' },
  { value: 'high', label: 'High', desc: 'Visually lossless' },
  { value: 'medium', label: 'Medium', desc: 'Best balance' },
  { value: 'low', label: 'Low', desc: 'Smallest file' },
]

const RESOLUTIONS = [
  { value: '', label: 'Original' },
  { value: '360p', label: '360p' },
  { value: '480p', label: '480p' },
  { value: '720p', label: '720p' },
  { value: '1080p', label: '1080p' },
  { value: '1440p', label: '1440p' },
  { value: '4k', label: '4K' },
]

const ConfigurationPanel = ({
  format,
  setFormat,
  quality,
  setQuality,
  resolution,
  setResolution,
  filters,
  setFilters,
  activeTab,
  setActiveTab,
  disabled,
}) => {
  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="configuration-panel">
      {/* Tab Switcher */}
      <div className="tab-switcher">
        <button
          onClick={() => setActiveTab('basic')}
          className={`tab-button ${activeTab === 'basic' ? 'active' : ''}`}
          disabled={disabled}
        >
          BASIC
        </button>
        <button
          onClick={() => setActiveTab('advanced')}
          className={`tab-button ${activeTab === 'advanced' ? 'active' : ''}`}
          disabled={disabled}
        >
          ADVANCED
        </button>
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="tab-content">
          {/* Format */}
          <div className="config-group">
            <label className="config-label">FORMAT</label>
            <div className="chip-grid">
              {FORMATS.map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  selected={format === f.value}
                  onClick={() => !disabled && setFormat(f.value)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="config-group">
            <label className="config-label">QUALITY</label>
            <div className="quality-grid">
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  onClick={() => !disabled && setQuality(q.value)}
                  disabled={disabled}
                  className={`quality-button ${quality === q.value ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                >
                  <div className="quality-label">{q.label}</div>
                  <div className="quality-desc">{q.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resolution */}
          <div className="config-group">
            <label className="config-label">RESOLUTION</label>
            <div className="chip-grid">
              {RESOLUTIONS.map((r) => (
                <Chip
                  key={r.value}
                  label={r.label}
                  selected={resolution === r.value}
                  onClick={() => !disabled && setResolution(r.value)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Tab */}
      {activeTab === 'advanced' && (
        <div className="tab-content advanced-content">
          {/* Color */}
          <div className="filter-group color-group">
            <h3 className="filter-group-title">COLOR</h3>
            <Slider
              label="Brightness"
              value={filters.brightness}
              min={-1}
              max={1}
              step={0.01}
              onChange={(v) => updateFilter('brightness', v)}
              disabled={disabled}
            />
            <Slider
              label="Contrast"
              value={filters.contrast}
              min={0}
              max={3}
              step={0.01}
              onChange={(v) => updateFilter('contrast', v)}
              unit="x"
              disabled={disabled}
            />
            <Slider
              label="Saturation"
              value={filters.saturation}
              min={0}
              max={3}
              step={0.01}
              onChange={(v) => updateFilter('saturation', v)}
              unit="x"
              disabled={disabled}
            />
            <Slider
              label="Gamma"
              value={filters.gamma}
              min={0.1}
              max={3}
              step={0.01}
              onChange={(v) => updateFilter('gamma', v)}
              disabled={disabled}
            />
            <Slider
              label="Color Temp"
              value={filters.colorTemp}
              min={-100}
              max={100}
              step={1}
              onChange={(v) => updateFilter('colorTemp', v)}
              disabled={disabled}
            />
            <Slider
              label="Vibrance"
              value={filters.vibrance}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => updateFilter('vibrance', v)}
              unit="x"
              disabled={disabled}
            />
          </div>

          {/* Effects */}
          <div className="filter-group effects-group">
            <h3 className="filter-group-title">EFFECTS</h3>
            <Slider
              label="Sharpen"
              value={filters.sharpen}
              min={0}
              max={10}
              step={1}
              onChange={(v) => updateFilter('sharpen', v)}
              disabled={disabled}
            />
            <Slider
              label="Denoise"
              value={filters.denoise}
              min={0}
              max={10}
              step={1}
              onChange={(v) => updateFilter('denoise', v)}
              disabled={disabled}
            />
            <Slider
              label="Blur"
              value={filters.blur}
              min={0}
              max={10}
              step={1}
              onChange={(v) => updateFilter('blur', v)}
              disabled={disabled}
            />
            <Slider
              label="Vignette"
              value={filters.vignette}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => updateFilter('vignette', v)}
              disabled={disabled}
            />
          </div>

          {/* Transform */}
          <div className="filter-group transform-group">
            <h3 className="filter-group-title">TRANSFORM</h3>
            <Slider
              label="Rotate"
              value={filters.rotate}
              min={0}
              max={270}
              step={90}
              onChange={(v) => updateFilter('rotate', v)}
              unit="°"
              disabled={disabled}
            />
            <Toggle
              label="Flip Horizontal"
              checked={filters.flipH}
              onChange={(v) => updateFilter('flipH', v)}
              disabled={disabled}
            />
            <Toggle
              label="Flip Vertical"
              checked={filters.flipV}
              onChange={(v) => updateFilter('flipV', v)}
              disabled={disabled}
            />
          </div>

          {/* Style */}
          <div className="filter-group style-group">
            <h3 className="filter-group-title">STYLE</h3>
            <Toggle
              label="Black & White"
              checked={filters.blackWhite}
              onChange={(v) => updateFilter('blackWhite', v)}
              disabled={disabled}
            />
            <Toggle
              label="Sepia Tone"
              checked={filters.sepia}
              onChange={(v) => updateFilter('sepia', v)}
              disabled={disabled}
            />
            <Toggle
              label="Negative"
              checked={filters.negative}
              onChange={(v) => updateFilter('negative', v)}
              disabled={disabled}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ConfigurationPanel
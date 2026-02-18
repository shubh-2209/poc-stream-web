// src/features/videoConvert/components/ConversionResult.jsx

import React from 'react'
import StatBox from './StatBox'

const ConversionResult = ({ result, onDownload, onReset, downloadStatus }) => {
  return (
    <section className="conversion-result">
      <div className="result-header">
        <div className="result-badge">✓</div>
        <span className="result-title">COMPLETE</span>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <StatBox label="Original" value={`${result.originalSizeMB} MB`} />
        <StatBox label="Converted" value={`${result.convertedSizeMB} MB`} />
        <StatBox label="Saved" value={`${result.savedMB} MB`} accent />
        <StatBox label="Reduction" value={result.compressionRate} accent />
      </div>

      {/* Applied Filters */}
      {result.filtersApplied && result.filtersApplied.length > 0 && (
        <div className="filters-applied-card">
          <div className="filters-applied-label">Filters Applied</div>
          <div className="filters-applied-list">
            {result.filtersApplied.map((f, i) => (
              <span key={i} className="filter-tag">
                {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <button
        onClick={onDownload}
        disabled={downloadStatus === 'loading'}
        className="btn-download"
      >
        {downloadStatus === 'loading'
          ? 'DOWNLOADING...'
          : `↓ DOWNLOAD ${result.outputFormat.toUpperCase()}`}
      </button>

      <button onClick={onReset} className="btn-reset">
        Process another video
      </button>
    </section>
  )
}

export default ConversionResult
// src/features/videoConvert/components/DropZone.jsx

import React, { useState, useRef, useCallback } from 'react'

const DropZone = ({ onFile, disabled }) => {
  const [dragging, setDragging] = useState(false)
  const [title, setTitle] = useState('')
  const inputRef = useRef(null)

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file) {
        onFile(file, title || undefined)
        setTitle('')
      }
    },
    [disabled, onFile, title]
  )

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onFile(file, title || undefined)
      setTitle('')
    }
  }

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  return (
    <div className="dropzone-wrapper">
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        onDragOver={(e) => {
          e.preventDefault()
          if (!disabled) setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="video/*,.mpeg"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={disabled}
        />
        <div className="dropzone-icon">⬡</div>
        <div className="dropzone-title">Drop video here</div>
        <div className="dropzone-subtitle">
          MP4, MKV, WebM, AVI, MOV, FLV, WMV, MPEG · up to 2 GB
        </div>
      </div>

      <div className="dropzone-input-group">
        <input
          type="text"
          placeholder="Video title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="dropzone-title-input"
          disabled={disabled}
        />
      </div>
    </div>
  )
}

export default DropZone;
// src/features/videoConvert/components/ProgressBar.jsx

import React from 'react'

const ProgressBar = ({ value }) => {
  return (
    <div className="progress-bar-container">
      <div className="progress-bar-fill" style={{ width: `${value}%` }} />
    </div>
  )
}

export default ProgressBar
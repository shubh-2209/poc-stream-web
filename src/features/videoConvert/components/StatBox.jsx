// src/features/videoConvert/components/StatBox.jsx

import React from 'react'

const StatBox = ({ label, value, accent = false }) => {
  return (
    <div className={`stat-box ${accent ? 'accent' : ''}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  )
}

export default StatBox
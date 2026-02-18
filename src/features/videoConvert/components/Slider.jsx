// src/features/videoConvert/components/Slider.jsx

import React from 'react'

const Slider = ({ label, value, min, max, step, onChange, unit = '', disabled }) => {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <label className="slider-label">{label}</label>
        <span className="slider-value">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="slider-input"
        style={{
          background: `linear-gradient(to right, #e8ff47 0%, #e8ff47 ${percentage}%, #2a2a2a ${percentage}%, #2a2a2a 100%)`,
        }}
      />
    </div>
  )
}

export default Slider
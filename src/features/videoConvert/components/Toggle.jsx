// src/features/videoConvert/components/Toggle.jsx

import React from 'react'

const Toggle = ({ label, checked, onChange, disabled }) => {
  return (
    <label className={`toggle-wrapper ${disabled ? 'disabled' : ''}`}>
      <div className={`toggle-switch ${checked ? 'checked' : ''}`}>
        <div className="toggle-thumb" />
      </div>
      <span className="toggle-label">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        style={{ display: 'none' }}
      />
    </label>
  )
}

export default Toggle
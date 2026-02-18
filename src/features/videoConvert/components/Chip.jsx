// src/features/videoConvert/components/Chip.jsx

import React from 'react'

const Chip = ({ label, selected, onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`chip ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
    >
      {label}
    </button>
  )
}

export default Chip
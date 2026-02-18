// src/features/videoConvert/components/ErrorAlert.jsx

import React from 'react'

const ErrorAlert = ({ message }) => {
  return (
    <div className="error-alert">
      <span className="error-icon">⚠</span>
      <span className="error-message">{message}</span>
    </div>
  )
}

export default ErrorAlert
import React from "react";
import "../styles/FilterSlider.css";

const FilterSlider = ({
  label,
  name,
  value,
  min,
  max,
  unit,
  onChange,
  onReset,
}) => {
  const handleInputChange = (e) => {
    onChange(parseFloat(e.target.value));
  };

  const handleTextInputChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val >= min && val <= max) {
      onChange(val);
    }
  };

  return (
    <div className="filter-slider">
      <div className="slider-header">
        <label>{label}</label>
        <button className="reset-btn" onClick={onReset} title="Reset to default">
          ↻
        </button>
      </div>

      <div className="slider-input-wrapper">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          className="slider-input"
        />
        <input
          type="number"
          min={min}
          max={max}
          value={Math.round(value)}
          onChange={handleTextInputChange}
          className="number-input"
        />
        <span className="unit-label">{unit}</span>
      </div>
    </div>
  );
};

export default FilterSlider;
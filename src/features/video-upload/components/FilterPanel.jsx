import React from "react";
import FilterSlider from "./FilterSlider";
import "../styles/FilterPanel.css";

const FilterPanel = ({ filters, onFilterChange }) => {
  const filterConfigs = [
    {
      name: "brightness",
      label: "Brightness",
      min: 0,
      max: 200,
      default: 100,
      unit: "%",
    },
    {
      name: "contrast",
      label: "Contrast",
      min: 0,
      max: 200,
      default: 100,
      unit: "%",
    },
    {
      name: "saturation",
      label: "Saturation",
      min: 0,
      max: 200,
      default: 100,
      unit: "%",
    },
    {
      name: "hue",
      label: "Hue Rotation",
      min: 0,
      max: 360,
      default: 0,
      unit: "°",
    },
    {
      name: "blur",
      label: "Blur",
      min: 0,
      max: 20,
      default: 0,
      unit: "px",
    },
    {
      name: "sharpen",
      label: "Sharpness",
      min: 0,
      max: 200,
      default: 100,
      unit: "%",
    },
    {
      name: "opacity",
      label: "Opacity",
      min: 0,
      max: 100,
      default: 100,
      unit: "%",
    },
  ];

  const handleFilterChange = (filterName, value) => {
    onFilterChange({
      ...filters,
      [filterName]: value,
    });
  };

  const handleResetAll = () => {
    const resetFilters = {};
    filterConfigs.forEach((config) => {
      resetFilters[config.name] = config.default;
    });
    onFilterChange(resetFilters);
  };

  const handleResetFilter = (filterName) => {
    const config = filterConfigs.find((c) => c.name === filterName);
    if (config) {
      handleFilterChange(filterName, config.default);
    }
  };

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        <button className="reset-all-btn" onClick={handleResetAll}>
          Reset All
        </button>
      </div>

      <div className="filters-list">
        {filterConfigs.map((config) => (
          <FilterSlider
            key={config.name}
            label={config.label}
            name={config.name}
            value={filters[config.name]}
            min={config.min}
            max={config.max}
            unit={config.unit}
            onChange={(value) => handleFilterChange(config.name, value)}
            onReset={() => handleResetFilter(config.name)}
          />
        ))}
      </div>

      <div className="filter-presets">
        <h4>Quick Presets</h4>
        <div className="presets-grid">
          <button
            className="preset-btn"
            onClick={() =>
              onFilterChange({
                ...filters,
                brightness: 120,
                contrast: 110,
                saturation: 130,
              })
            }
          >
            Vivid
          </button>
          <button
            className="preset-btn"
            onClick={() =>
              onFilterChange({
                ...filters,
                saturation: 0,
                contrast: 110,
                brightness: 95,
              })
            }
          >
            B&W
          </button>
          <button
            className="preset-btn"
            onClick={() =>
              onFilterChange({
                ...filters,
                brightness: 90,
                saturation: 80,
                contrast: 95,
              })
            }
          >
            Vintage
          </button>
          <button
            className="preset-btn"
            onClick={() =>
              onFilterChange({
                ...filters,
                brightness: 110,
                contrast: 120,
                saturation: 100,
              })
            }
          >
            Cinema
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
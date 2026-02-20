import React from "react";
import "../styles/StepIndicator.css";

const StepIndicator = ({ currentStep, totalSteps }) => {
  const steps = [
    { number: 1, title: "Select Video" },
    { number: 2, title: "Preview" },
    { number: 3, title: "Edit" },
    { number: 4, title: "Review" },
    { number: 5, title: "Upload" },
  ];

  return (
    <div className="step-indicator">
      <div className="steps-container">
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div
              className={`step ${step.number === currentStep ? "active" : ""} ${
                step.number < currentStep ? "completed" : ""
              }`}
            >
              <div className="step-number">
                {step.number < currentStep ? (
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="step-title">{step.title}</div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={`step-connector ${
                  step.number < currentStep ? "completed" : ""
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default StepIndicator;
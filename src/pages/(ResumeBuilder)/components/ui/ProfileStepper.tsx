import React from "react";
import { Check, AlertCircle } from "lucide-react";

interface ProfileStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  validationErrors?: { [key: string]: boolean };
}

export default function ProfileStepper({
  steps,
  currentStep,
  onStepClick,
  validationErrors = {},
}: ProfileStepperProps) {
  const stepKeys = [
    "personal",
    "education",
    "experience",
    "projects",
    "skills",
    "certification",
  ];

  const hasError = (index: number) => {
    return validationErrors[stepKeys[index]] || false;
  };

  return (
    <div className="w-full">
      {/* Desktop/Tablet View */}
      <div className="hidden sm:block px-4 md:px-14 pt-8 pb-6">
        {/* Step Labels */}
        <div className="flex justify-between mb-3">
          {steps.map((step, index) => (
            <div
              key={`label-${index}`}
              className={`text-xs md:text-[13px] font-medium leading-tight ${
                hasError(index)
                  ? "text-red-500"
                  : index === currentStep
                  ? "text-[#1A1A43]"
                  : index < currentStep
                  ? "text-gray-700"
                  : "text-gray-400"
              }`}
              style={{
                width: `${100 / steps.length}%`,
                textAlign: index === 0 ? 'left' : index === steps.length - 1 ? 'right' : 'center',
              }}
            >
              <span className="flex items-center justify-center gap-1">
                {step}
                {hasError(index) && index < currentStep && (
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Line with Circles */}
        <div className="flex items-center">
          {steps.map((_, index) => (
            <React.Fragment key={index}>
              {/* Circle */}
              <button
                onClick={() => onStepClick && onStepClick(index)}
                disabled={!onStepClick}
                className={`flex-shrink-0 transition-all group relative z-10 ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
                aria-label={`Go to step ${index + 1}`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                    hasError(index) && index < currentStep
                      ? "bg-red-500"
                      : index === currentStep
                      ? "bg-orange-400"
                      : index < currentStep
                      ? "bg-orange-400"
                      : "bg-orange-200"
                  }`}
                >
                  {hasError(index) && index < currentStep ? (
                    <AlertCircle className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  ) : index < currentStep ? (
                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                  ) : index === currentStep ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : null}
                </div>
              </button>

              {/* Line between circles */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[3px] bg-orange-200 relative -mx-0">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                      hasError(index) && index < currentStep
                        ? "bg-red-400"
                        : index < currentStep
                        ? "bg-orange-400"
                        : "bg-orange-200"
                    }`}
                    style={{
                      width: index < currentStep ? "100%" : "0%",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-700">
              Step {currentStep + 1} of {steps.length}
            </span>
            {hasError(currentStep) && (
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
            )}
          </div>
          <span
            className={`text-xs font-semibold ${
              hasError(currentStep) ? "text-red-500" : "text-orange-400"
            }`}
          >
            {steps[currentStep]}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-orange-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              hasError(currentStep) ? "bg-red-400" : "bg-orange-400"
            }`}
            style={{
              width: `${((currentStep + 1) / steps.length) * 100}%`,
            }}
          />
        </div>

        {/* Step Dots */}
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => onStepClick && onStepClick(index)}
              disabled={!onStepClick}
              className={`h-1.5 rounded-full transition-all ${
                hasError(index) && index < currentStep
                  ? "bg-red-400 w-1.5"
                  : index === currentStep
                  ? hasError(currentStep)
                    ? "bg-red-400 w-6"
                    : "bg-orange-400 w-6"
                  : index < currentStep
                  ? "bg-orange-400 w-1.5"
                  : "bg-orange-300 w-1.5"
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Error Message for Current Step */}
        {hasError(currentStep) && (
          <div className="mt-3 px-2 py-2 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">
              Please complete all required fields in this step
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
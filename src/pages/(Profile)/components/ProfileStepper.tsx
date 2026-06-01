import React from "react";
import { Check, AlertCircle } from "lucide-react";

interface ProfileStepperProps {
  steps: string[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
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
      <div className="hidden sm:flex items-start px-4 md:px-14 pt-6 pb-10">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {/* Step Item */}
            <div className="flex flex-col items-center flex-1 relative">
              {/* Step Label with Error Indicator */}
              <div
                className={`flex items-center gap-1 text-xs md:text-[13px] font-medium leading-tight mb-2 px-1 absolute -top-6 whitespace-nowrap ${
                  index === 0
                    ? "left-0 text-left"
                    : index === steps.length - 1
                    ? "right-0 text-right"
                    : "left-1/2 -translate-x-1/2 text-center"
                } ${
                  hasError(index)
                    ? "text-red-500"
                    : index === currentStep
                    ? "text-gray-900"
                    : index < currentStep
                    ? "text-gray-700"
                    : "text-gray-500"
                }`}
              >
                <span>{step}</span>
                {hasError(index) && index < currentStep && (
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                )}
              </div>

              <div className="w-full flex items-center">
                {/* Left Line Half */}
                {index > 0 && (
                  <div className="flex-1 h-[2px] bg-orange-200 relative">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                        hasError(index - 1) && index - 1 < currentStep
                          ? "bg-red-400"
                          : index <= currentStep
                          ? "bg-orange-400"
                          : "bg-orange-200"
                      }`}
                      style={{
                        width:
                          index < currentStep
                            ? "100%"
                            : index === currentStep
                            ? "100%"
                            : "0%",
                      }}
                    />
                  </div>
                )}

                {/* Circle */}
                <div
                  className="flex-shrink-0 transition-all group relative"
                  aria-label={`${step}`}
                >
                  <div
                    className={`w-3 h-3 rounded-full flex items-center justify-center transition-all border-2 ${
                      hasError(index) && index < currentStep
                        ? "bg-white border-red-500 text-red-500"
                        : index === currentStep
                        ? "bg-orange-400 border-orange-400 text-white"
                        : index < currentStep
                        ? "bg-white border-orange-400 text-orange-400"
                        : "bg-orange-50 border-orange-200 text-orange-300"
                    }`}
                  >
                    {hasError(index) && index < currentStep ? (
                      <AlertCircle className="w-2 h-2" strokeWidth={3} />
                    ) : (
                      index < currentStep && (
                        <Check className="w-2 h-2" strokeWidth={3} />
                      )
                    )}
                  </div>
                </div>

                {/* Right Line Half */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-orange-200 relative">
                    <div
                      className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                        hasError(index) && index < currentStep
                          ? "bg-red-400"
                          : index < currentStep
                          ? "bg-orange-400"
                          : "bg-orange-100"
                      }`}
                      style={{
                        width: index < currentStep ? "100%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* Mobile View */}
      <div className="sm:hidden px-2">
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
            <div
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                hasError(index) && index < currentStep
                  ? "bg-red-400 w-1.5"
                  : index === currentStep
                  ? hasError(currentStep)
                    ? "bg-red-400 w-6"
                    : "bg-orange-400 w-6"
                  : index < currentStep
                  ? "bg-orange-200 w-1.5"
                  : "bg-orange-300 w-1.5"
              }`}
              aria-label={`Step ${index + 1}`}
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
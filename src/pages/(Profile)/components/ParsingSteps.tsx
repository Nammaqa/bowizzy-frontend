import React, { useState, useEffect } from "react";
import { Check, X, AlertCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import DashNav from "@/components/dashnav/dashnav";

interface ParsingStep {
  id: string;
  label: string;
  completed: boolean;
  failed: boolean;
}

export default function ParsingSteps() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [parsingError, setParsingError] = useState<string | null>(null);

  const [steps, setSteps] = useState<ParsingStep[]>([
    { id: "upload", label: "Uploading Resume", completed: false, failed: false },
    { id: "parse", label: "Parsing Resume File", completed: false, failed: false },
    { id: "title", label: "Extracting Job Title", completed: false, failed: false },
    { id: "summary", label: "Extracting Summary/About", completed: false, failed: false },
    { id: "experience", label: "Extracting Work Experience", completed: false, failed: false },
    { id: "projects", label: "Extracting Projects", completed: false, failed: false },
    { id: "education", label: "Extracting Education", completed: false, failed: false },
    { id: "skills", label: "Extracting Skills & Links", completed: false, failed: false },
    { id: "certifications", label: "Extracting Certifications", completed: false, failed: false },
    { id: "copying", label: "Copying Details to Profile", completed: false, failed: false },
  ]);

  // Simulate parsing execution
  const simulateStepExecution = (stepIndex: number): boolean => {
    // In production, this would be actual API calls
    // For now, simulate 5% failure rate on parse step
    // if (stepIndex === 1 && Math.random() < 0.05) {
    //   return false; // Failed
    // }
    return true; // Success
  };

  useEffect(() => {
    const uploadSuccess = location.state?.uploadSuccess;

    // Step-1: Uploading status
    setSteps(prev =>
      prev.map((s, i) =>
        i === 0
          ? { ...s, completed: uploadSuccess, failed: !uploadSuccess }
          : s
      )
    );

    if (!uploadSuccess) {
      setParsingError(" Resume upload failed — resume not accepted by server.");
      return;
    }

    // Continue previous parsing animation...
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const next = prev + 1;
        if (next < steps.length) {
          setSteps(prevSteps =>
            prevSteps.map((step, i) =>
              i === next ? { ...step, completed: true } : step
            )
          );
          return next;
        } else {
          clearInterval(interval);
          navigate("/profile/form");
        }
        return prev;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = () => {
    // Reset state and try again
    navigate("/profile", { replace: true });
  };

  const handleManualEntry = () => {
    // Navigate directly to form for manual entry
    navigate("/profile/form");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Baloo_2']">
      <DashNav heading="Profile" />

      <div className="flex-1 bg-gray-50 overflow-hidden min-h-0">
        <div className="bg-white rounded-lg m-3 md:m-5 h-[calc(100vh-110px)] flex flex-col overflow-hidden">
          <div className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 md:px-8 flex flex-col justify-center py-6 overflow-y-auto min-h-0 hide-scrollbar">
            <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-900 mb-3 text-center">
              {parsingError ? "Processing Failed" : "Processing Your Resume"}
            </h1>

            <p className="text-xs sm:text-sm text-gray-600 mb-6 md:mb-8 text-center">
              {parsingError
                ? "We encountered an issue while processing your resume."
                : "Please wait while we extract information from your resume..."}
            </p>

            {/* Error Alert */}
            {parsingError && (
              <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-800 mb-1">
                    Parsing Error
                  </h3>
                  <p className="text-xs sm:text-sm text-red-700">
                    {parsingError}
                  </p>
                </div>
              </div>
            )}

            {/* Steps List — 1 column on small screens, 2 columns from sm breakpoint up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mb-6">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-2.5 py-1.5 px-2 sm:px-0 min-w-0"
                >
                  {/* Status Indicator */}
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
                      step.failed
                        ? "bg-red-500 border-red-500"
                        : step.completed
                        ? "bg-green-500 border-green-500"
                        : index === currentStepIndex
                        ? "border-orange-400 animate-pulse"
                        : "border-gray-300"
                    }`}
                  >
                    {step.failed ? (
                      <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                    ) : step.completed ? (
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" strokeWidth={3} />
                    ) : null}
                  </div>

                  {/* Label */}
                  <span
                    className={`text-xs sm:text-sm font-normal transition-colors duration-300 flex-1 truncate ${
                      step.failed
                        ? "text-red-600 font-medium"
                        : index === currentStepIndex
                        ? "text-gray-900 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Loading spinner for current step */}
                  {index === currentStepIndex && !step.completed && !step.failed && (
                    <div className="flex-shrink-0">
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons (shown on error) */}
            {parsingError && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <button
                  onClick={handleRetry}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-orange-300 hover:border-orange-400 text-orange-400 rounded-xl font-medium text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Try Another File
                </button>
                <button
                  onClick={handleManualEntry}
                  style={{
                    background: "linear-gradient(180deg, #FF9D48 0%, #FF8251 100%)",
                  }}
                  className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-xl font-medium text-xs sm:text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Enter Details Manually
                </button>
              </div>
            )}

            {/* Progress Indicator */}
            {!parsingError && (
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-600">
                    Progress: {currentStepIndex + 1} / {steps.length}
                  </span>
                  <span className="text-xs font-medium text-orange-400">
                    {Math.round(((currentStepIndex + 1) / steps.length) * 100)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 transition-all duration-300 rounded-full"
                    style={{
                      width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Check } from "lucide-react";
import { clsx } from "clsx";

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full py-4 px-2">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />

        {/* Active Progress Bar */}
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-300" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={index} className="flex flex-col items-center bg-white px-2">
              <div
                className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                  isActive && "border-blue-600 bg-blue-600 text-white",
                  isCompleted && "border-green-500 bg-green-500 text-white",
                  !isActive && !isCompleted && "border-gray-300 bg-white text-gray-400"
                )}
              >
                {isCompleted ? <Check size={16} /> : <span className="text-sm font-medium">{stepNumber}</span>}
              </div>
              <span className={clsx("text-xs mt-2 font-medium absolute top-8 w-32 text-center", isActive ? "text-blue-600" : "text-gray-500")}>{step}</span>
            </div>
          );
        })}
      </div>
      {/* Spacer for the absolute positioned text */}
      <div className="h-6" />
    </div>
  );
};

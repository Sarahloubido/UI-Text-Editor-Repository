import React from 'react';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';
import { WorkflowStep } from '../types';

interface WorkflowNavigationProps {
  currentStep: WorkflowStep;
  completedSteps: Set<WorkflowStep>;
  onStepChange: (step: WorkflowStep) => void;
}

const steps: { key: WorkflowStep; label: string; description: string }[] = [
  { key: 'import', label: 'Import Prototype', description: 'Load and extract text elements' },
  { key: 'export', label: 'Export Spreadsheet', description: 'Generate CSV/XLSX for editing' },
  { key: 'edit', label: 'Edit Text', description: 'Review and modify content' },
  { key: 'reimport', label: 'Import Changes', description: 'Upload edited spreadsheet' },
  { key: 'publish', label: 'Publish Updates', description: 'Apply changes to prototype' },
];

export const WorkflowNavigation: React.FC<WorkflowNavigationProps> = ({
  currentStep,
  completedSteps,
  onStepChange,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.has(step.key);
            const isCurrent = currentStep === step.key;
            const isClickable = isCompleted || isCurrent;

            return (
              <React.Fragment key={step.key}>
                <button
                  onClick={() => isClickable && onStepChange(step.key)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center space-y-2 transition-all duration-200 ${
                    isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'bg-green-100 border-green-500'
                      : isCurrent
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-slate-50 border-slate-300'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className={`w-5 h-5 ${
                        isCurrent ? 'text-blue-600' : 'text-slate-400'
                      }`} />
                    )}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-slate-600'
                    }`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-500 max-w-24">{step.description}</p>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-slate-300 mx-4" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
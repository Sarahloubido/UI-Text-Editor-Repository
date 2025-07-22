import React from 'react';
import { FileText, Layers } from 'lucide-react';

interface HeaderProps {
  currentStep: string;
  totalSteps: number;
}

export const Header: React.FC<HeaderProps> = ({ currentStep, totalSteps }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">UI Text Editor</h1>
            <p className="text-sm text-slate-600">Technical writing workflow tool</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-slate-600">
          <Layers className="w-4 h-4" />
          <span>Step {currentStep} of {totalSteps}</span>
        </div>
      </div>
    </header>
  );
};
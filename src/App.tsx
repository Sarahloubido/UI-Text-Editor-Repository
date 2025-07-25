import React, { useState } from 'react';
import { Header } from './components/Header';
import { WorkflowNavigation } from './components/WorkflowNavigation';
import { PrototypeImport } from './components/PrototypeImport';
import { SpreadsheetExport } from './components/SpreadsheetExport';
import { SpreadsheetEditor } from './components/SpreadsheetEditor';
import { DiffViewer } from './components/DiffViewer';
import { Prototype, WorkflowStep, TextElement, DiffItem } from './types';
import { CheckCircle, Rocket } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('import');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [editedElements, setEditedElements] = useState<TextElement[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const handleImportComplete = (importedPrototype: Prototype) => {
    setPrototype(importedPrototype);
    setEditedElements(importedPrototype.textElements);
    completeStep('import');
    setCurrentStep('export');
  };

  const handleExportComplete = () => {
    completeStep('export');
    setCurrentStep('edit');
  };

  const handleElementsUpdate = (elements: TextElement[]) => {
    setEditedElements(elements);
    completeStep('edit');
    setCurrentStep('reimport');
  };

  const handleApplyChanges = async (changes: DiffItem[]) => {
    setIsPublishing(true);
    
    // Simulate API call to update prototype
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    completeStep('reimport');
    completeStep('publish');
    setIsPublishing(false);
    setPublishComplete(true);
    setCurrentStep('publish');
  };

  const handleStepChange = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  const getStepNumber = (step: WorkflowStep): number => {
    const steps: WorkflowStep[] = ['import', 'export', 'edit', 'reimport', 'publish'];
    return steps.indexOf(step) + 1;
  };

  if (isPublishing) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header currentStep="5" totalSteps={5} />
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Publishing Changes</h2>
            <p className="text-lg text-slate-600 mb-8">
              Applying text updates to your prototype. This may take a few moments...
            </p>
            <div className="w-full max-w-md mx-auto bg-slate-200 rounded-full h-2 mb-8">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Validating changes</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Updating text elements</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-600 animate-spin"></div>
                <span>Preserving layouts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (publishComplete) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header currentStep="5" totalSteps={5} />
        <div className="max-w-4xl mx-auto p-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-8">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Changes Published Successfully!</h2>
            <p className="text-lg text-slate-600 mb-8">
              Your prototype has been updated with the new text content. All changes have been applied while preserving the original layout and design.
            </p>
            
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Update Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {editedElements.filter(el => el.editedText && el.editedText !== el.originalText).length}
                  </p>
                  <p className="text-sm text-slate-600">Text Elements Updated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{prototype?.textElements.length || 0}</p>
                  <p className="text-sm text-slate-600">Total Elements Processed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-600">100%</p>
                  <p className="text-sm text-slate-600">Layout Preservation</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {
                  setPublishComplete(false);
                  setCompletedSteps(new Set());
                  setCurrentStep('import');
                  setPrototype(null);
                  setEditedElements([]);
                }}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Start New Project
              </button>
              
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Rocket className="w-4 h-4 mr-2" />
                View Updated Prototype
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header currentStep={getStepNumber(currentStep).toString()} totalSteps={5} />
      <WorkflowNavigation 
        currentStep={currentStep} 
        completedSteps={completedSteps}
        onStepChange={handleStepChange}
      />
      
      <main className="py-8">
        {currentStep === 'import' && (
          <PrototypeImport onImportComplete={handleImportComplete} />
        )}
        
        {currentStep === 'export' && prototype && (
          <SpreadsheetExport 
            prototype={prototype} 
            onExportComplete={handleExportComplete}
          />
        )}
        
        {currentStep === 'edit' && (
          <SpreadsheetEditor 
            elements={editedElements}
            onElementsUpdate={handleElementsUpdate}
          />
        )}
        
        {currentStep === 'reimport' && prototype && (
          <DiffViewer 
            originalElements={prototype.textElements}
            editedElements={editedElements}
            onApplyChanges={handleApplyChanges}
          />
        )}
      </main>
    </div>
  );
}

export default App;
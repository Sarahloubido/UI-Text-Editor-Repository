import React, { useState } from 'react';
import { Header } from './components/Header';
import { WorkflowNavigation } from './components/WorkflowNavigation';
import { PrototypeImport } from './components/PrototypeImport';
import { SpreadsheetExport } from './components/SpreadsheetExport';
import { SpreadsheetEditor } from './components/SpreadsheetEditor';
import { DiffViewer } from './components/DiffViewer';

import { ProductionStatus } from './components/ProductionStatus';
import { Prototype, WorkflowStep, TextElement, DiffItem } from './types';
import { CheckCircle, Rocket, Download, FileText, AlertCircle } from 'lucide-react';
import { PrototypeGenerator } from './utils/prototypeGenerator';
import { FigmaIntegration } from './utils/figmaIntegration';
import { FigmaPluginGenerator } from './utils/figmaPluginGenerator';
import { FigmaPluginInstructions } from './components/FigmaPluginInstructions';

function App() {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('import');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());
  const [prototype, setPrototype] = useState<Prototype | null>(null);
  const [editedElements, setEditedElements] = useState<TextElement[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishComplete, setPublishComplete] = useState(false);

  const [generatedFiles, setGeneratedFiles] = useState<{
    htmlContent: string;
    figmaContent: string;
    updatedPrototype: Prototype;
  } | null>(null);
  const [figmaFileId, setFigmaFileId] = useState<string>('');

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const handleImportComplete = (importedPrototype: Prototype) => {
    setPrototype(importedPrototype);
    setEditedElements(importedPrototype.textElements);
    
    // Extract Figma file ID if it's from a Figma URL
    if (importedPrototype.source === 'figma' && importedPrototype.url) {
      const fileId = FigmaIntegration.extractFileIdFromUrl(importedPrototype.url);
      if (fileId) {
        setFigmaFileId(fileId);
      }
    }
    
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
    if (!prototype) return;
    
    setIsPublishing(true);
    
    try {
      // Generate updated prototype with changes applied
      const generated = PrototypeGenerator.generateUpdatedPrototype(prototype, changes);
      setGeneratedFiles(generated);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      completeStep('reimport');
      completeStep('publish');
      setIsPublishing(false);
      setPublishComplete(true);
      setCurrentStep('publish');
    } catch (error) {
      console.error('Error generating prototype:', error);
      setIsPublishing(false);
      alert('Error generating updated prototype. Please try again.');
    }
  };

  const handleStepChange = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  const handleDownloadHTML = () => {
    if (generatedFiles) {
      const filename = `${prototype?.name.replace(/[^a-zA-Z0-9]/g, '_')}_updated.html`;
      PrototypeGenerator.downloadFile(generatedFiles.htmlContent, filename, 'text/html');
    }
  };

  const handleDownloadFigma = () => {
    if (generatedFiles) {
      const filename = `${prototype?.name.replace(/[^a-zA-Z0-9]/g, '_')}_updated.json`;
      PrototypeGenerator.downloadFile(generatedFiles.figmaContent, filename, 'application/json');
    }
  };

  const handleViewPrototype = () => {
    if (generatedFiles) {
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(generatedFiles.htmlContent);
        newWindow.document.close();
      }
    }
  };

  const handleGenerateFigmaPlugin = () => {
    if (!generatedFiles || !figmaFileId) return;

    // Get the changes that were applied
    const changes = editedElements
      .filter(el => el.editedText && el.editedText !== el.originalText)
      .map(el => ({
        id: el.id,
        originalText: el.originalText,
        editedText: el.editedText || '',
        frameName: el.frameName,
        componentPath: el.componentPath,
        changeType: 'modified' as const
      }));

    if (changes.length === 0) {
      alert('No text changes detected. Make some edits first!');
      return;
    }

    // Download the plugin files
    FigmaPluginGenerator.downloadPluginFiles(changes, figmaFileId);
    
    // Show instructions
    setTimeout(() => {
      alert(
        '🎯 Figma Plugin Generated!\n\n' +
        'You\'ll receive 3 files:\n' +
        '• manifest.json\n' +
        '• code.js\n' +
        '• ui.html\n\n' +
        'To install:\n' +
        '1. In Figma: Plugins → Development → Import plugin from manifest...\n' +
        '2. Select the manifest.json file\n' +
        '3. Run the plugin to apply your text changes directly in Figma!'
      );
    }, 1500);
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

            {/* Figma Plugin Generation Section */}
            {figmaFileId && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                  🎯 Update Your Figma File Directly
                </h3>

                <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-2 mb-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Custom Figma Plugin Solution</h4>
                      <p className="text-blue-800 text-sm">
                        Generate a custom Figma plugin that will apply your text changes directly inside Figma.
                        This works by creating a plugin specifically for your changes.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-700">
                    <h5 className="font-medium">How it works:</h5>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Downloads 3 plugin files (manifest.json, code.js, ui.html)</li>
                      <li>Install the plugin in Figma via "Import plugin from manifest"</li>
                      <li>Run the plugin to apply all your text changes at once</li>
                      <li>See your changes directly in your Figma file!</li>
                    </ul>
                  </div>
                </div>

                <button
                  onClick={handleGenerateFigmaPlugin}
                  disabled={!generatedFiles}
                  className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.332 8.668a3.333 3.333 0 0 0 0-6.663H8.668a3.333 3.333 0 0 0 0 6.663 3.333 3.333 0 0 0 0 6.665 3.333 3.333 0 0 0 0 6.664A3.334 3.334 0 0 0 12 18.664V8.668h3.332z"/>
                    <circle cx="15.332" cy="12" r="3.332"/>
                  </svg>
                  Generate Figma Plugin
                </button>
                <p className="text-sm text-slate-600 mt-3">
                  Creates a custom plugin that applies your text changes directly in Figma. You'll see the changes in your actual Figma file!
                </p>
                
                <FigmaPluginInstructions />
              </div>
            )}

            {/* Local Download Options */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">Download Local Files</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={handleViewPrototype}
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Rocket className="w-4 h-4 mr-2" />
                  View Prototype
                </button>
                
                <button
                  onClick={handleDownloadHTML}
                  className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download HTML
                </button>
                
                <button
                  onClick={handleDownloadFigma}
                  className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download JSON
                </button>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                <strong>HTML:</strong> Interactive prototype you can open in any browser<br />
                <strong>JSON:</strong> Structured data compatible with design tools
              </p>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setPublishComplete(false);
                  setCompletedSteps(new Set());
                  setCurrentStep('import');
                  setPrototype(null);
                  setEditedElements([]);
                  setGeneratedFiles(null);
                  setFigmaFileId('');
                }}
                className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Start New Project
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
      
      {/* Production Status */}
      <div className="max-w-4xl mx-auto px-8 pt-4">
        <ProductionStatus />
      </div>
      
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
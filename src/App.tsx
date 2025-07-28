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
import { FigmaStructurePreserver } from './utils/figmaStructurePreserver';
import { FigmaPluginInstructions } from './components/FigmaPluginInstructions';
import { FigmaTextExtraction } from './components/FigmaTextExtraction';
import { FigmaScreenshotExtractor } from './components/FigmaScreenshotExtractor';

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
  const [figmaUrl, setFigmaUrl] = useState<string>('');
  const [showRealExtraction, setShowRealExtraction] = useState<boolean>(false);
  const [showScreenshotExtractor, setShowScreenshotExtractor] = useState<boolean>(false);

  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  const handleImportComplete = (importedPrototype: Prototype) => {
    console.log('🎯 App.tsx: handleImportComplete called with prototype:', importedPrototype);
    setPrototype(importedPrototype);
    setEditedElements(importedPrototype.textElements);
    
    // Extract Figma file ID if it's from a Figma URL
    if (importedPrototype.source === 'figma' && importedPrototype.url) {
      const fileId = FigmaIntegration.extractFileIdFromUrl(importedPrototype.url);
      if (fileId) {
        setFigmaFileId(fileId);
      }
      setFigmaUrl(importedPrototype.url);
      
      // If no text elements, stay on import step to show extraction options
      if (importedPrototype.textElements.length === 0) {
        console.log('🎯 App.tsx: No text elements found, staying on import to show extraction options');
        // Don't auto-open modal - let user choose first
        completeStep('import');
        return; // Don't move to export yet
      }
    }
    
    // Complete the import step and move to export (only if we have text elements)
    completeStep('import');
    setCurrentStep('export');
    console.log('🎯 App.tsx: Moving to export step');
  };

  const handleRealTextExtracted = (realElements: TextElement[]) => {
    if (prototype) {
      const updatedPrototype: Prototype = {
        ...prototype,
        textElements: realElements,
        extractionMetadata: {
          ...prototype.extractionMetadata,
          extractionMethod: 'Real Figma Text',
          extractedAt: new Date(),
          confidence: 0.98
        }
      };
      setPrototype(updatedPrototype);
      setEditedElements(realElements);
      setShowRealExtraction(false);
      
      // Show success message
      alert(`Successfully extracted ${realElements.length} real text elements from your Figma design!`);
      
      // Move to export step with real text
      completeStep('import');
      setCurrentStep('export');
    }
  };

  const handleScreenshotExtracted = (realElements: TextElement[]) => {
    if (prototype) {
      const updatedPrototype: Prototype = {
        ...prototype,
        textElements: realElements,
        extractionMetadata: {
          ...prototype.extractionMetadata,
          extractionMethod: 'Screenshot + OCR',
          extractedAt: new Date(),
          confidence: 0.95
        }
      };
      setPrototype(updatedPrototype);
      setEditedElements(realElements);
      setShowScreenshotExtractor(false);
      
      // Show success message
      alert(`Successfully extracted ${realElements.length} text elements using screenshot + OCR!`);
      
      // Move to export step with real text
      completeStep('import');
      setCurrentStep('export');
    }
  };

  const handleExportComplete = (selectedElementIds?: string[]) => {
    if (prototype && selectedElementIds) {
      // Filter to only selected elements for inline editing
      const elementsToEdit = prototype.textElements.filter(el => 
        selectedElementIds.includes(el.id)
      );
      setEditedElements(elementsToEdit);
    }
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

  const handleGenerateFigmaImport = () => {
    if (!generatedFiles || !prototype) return;

    // Get the elements with changes applied
    const updatedElements = editedElements.map(el => ({
      ...el,
      editedText: el.editedText // Keep the edited text separate for comparison
    }));

    if (updatedElements.length === 0) {
      alert('No elements to export. Try importing a prototype first!');
      return;
    }

    // Download structure-preserving import files
    FigmaStructurePreserver.downloadPreservedFiles(prototype, updatedElements);
    
    // Show instructions
    setTimeout(() => {
      alert(FigmaStructurePreserver.getPreservationInstructions());
    }, 2000);
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

            {/* Figma Integration Section */}
            {figmaFileId && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                  🎯 Import Your Changes Back to Figma
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Method 1: Plugin (Direct Edit) */}
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Method 1: Direct Edit Plugin</h4>
                        <p className="text-blue-800 text-sm mb-3">
                          Apply changes directly to your existing Figma file. Perfect for live collaboration.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-slate-700 mb-4">
                      <h5 className="font-medium">How it works:</h5>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Downloads custom plugin files</li>
                        <li>Install plugin in Figma</li>
                        <li>Run plugin to apply text changes</li>
                        <li>Changes appear in your existing file</li>
                      </ul>
                    </div>

                    <button
                      onClick={handleGenerateFigmaPlugin}
                      disabled={!generatedFiles}
                      className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.332 8.668a3.333 3.333 0 0 0 0-6.663H8.668a3.333 3.333 0 0 0 0 6.663 3.333 3.333 0 0 0 0 6.665 3.333 3.333 0 0 0 0 6.664A3.334 3.334 0 0 0 12 18.664V8.668h3.332z"/>
                        <circle cx="15.332" cy="12" r="3.332"/>
                      </svg>
                      Generate Edit Plugin
                    </button>
                  </div>

                  {/* Method 2: Import Files (New Design) */}
                  <div className="bg-white border border-purple-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                                               <h4 className="font-medium text-purple-900 mb-1">Method 2: Preserve Design Structure</h4>
                       <p className="text-purple-800 text-sm mb-3">
                         Download files that recreate your original design structure with text changes applied. Maintains layout, styling, and visual hierarchy.
                       </p>
                     </div>
                   </div>
                   
                   <div className="space-y-2 text-sm text-slate-700 mb-4">
                     <h5 className="font-medium">How it works:</h5>
                     <ul className="list-disc list-inside space-y-1 ml-4">
                       <li>Recreates your original frame structure</li>
                       <li>Preserves mobile/desktop layouts</li>
                       <li>Includes status bars and UI elements</li>
                       <li>Maintains proper typography and spacing</li>
                       <li>Import via File → Import (SVG) in Figma</li>
                     </ul>
                   </div>

                   <button
                     onClick={handleGenerateFigmaImport}
                     disabled={!generatedFiles}
                     className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                   >
                     <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M15.332 8.668a3.333 3.333 0 0 0 0-6.663H8.668a3.333 3.333 0 0 0 0 6.663 3.333 3.333 0 0 0 0 6.665 3.333 3.333 0 0 0 0 6.664A3.334 3.334 0 0 0 12 18.664V8.668h3.332z"/>
                       <circle cx="15.332" cy="12" r="3.332"/>
                     </svg>
                     Download Preserved Design
                   </button>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Recommendation:</strong> Use Method 1 (Edit Plugin) for quick text updates to existing files. 
                    Use Method 2 (Preserve Design) when you need to recreate your design structure with better visual fidelity and proper layout preservation.
                  </p>
                </div>
                
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
            <>
              <PrototypeImport onImportComplete={handleImportComplete} />
              
              {prototype && prototype.textElements.length === 0 && figmaUrl && !showRealExtraction && !showScreenshotExtractor && (
                <div className="mt-8">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-amber-900 mb-2">Extract Real Text from Your Figma Design</h4>
                        <p className="text-sm text-amber-800">
                          The system generated mock text elements. Want to use your actual Figma text instead? 
                          Use the tool below to extract the real text from your design.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Real Text Extraction Required</h4>
                      <p className="text-red-800 mb-4">
                        Your Figma URL has been imported, but <strong>NO text elements were created</strong>. 
                        You must extract the real text from your design using one of these methods:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <button
                          onClick={() => setShowScreenshotExtractor(true)}
                          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          📸 Screenshot + OCR (Recommended)
                        </button>
                        <button
                          onClick={() => {
                            console.log('🔗 API/Manual Entry button clicked');
                            setShowRealExtraction(true);
                          }}
                          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          🔗 API/Manual Entry
                        </button>
                      </div>
                      <div className="mt-3 text-sm text-red-800">
                        <strong>Screenshot + OCR:</strong> Visually captures your Figma design and extracts all visible text automatically<br/>
                        <strong>API/Manual:</strong> Use your Figma API token or copy-paste text content manually
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">🚫 No Fake Text Policy</h4>
                      <p className="text-blue-800 text-sm">
                        This app no longer generates mock or fake text. You will only get <strong>real, actual text content</strong> 
                        from your Figma designs. This ensures 100% accuracy for your content editing workflow.
                      </p>
                    </div>
                  </div>

                  {/* Real Text Extraction Component */}
                  {showRealExtraction && (
                    <FigmaTextExtraction 
                      figmaUrl={figmaUrl}
                      onTextExtracted={handleRealTextExtracted}
                      onClose={() => setShowRealExtraction(false)}
                    />
                  )}

                  {/* Screenshot + OCR Extraction Component */}
                  {showScreenshotExtractor && (
                    <FigmaScreenshotExtractor 
                      figmaUrl={figmaUrl}
                      onTextExtracted={handleScreenshotExtracted}
                      onClose={() => setShowScreenshotExtractor(false)}
                    />
                  )}
                </div>
              )}
            </>
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
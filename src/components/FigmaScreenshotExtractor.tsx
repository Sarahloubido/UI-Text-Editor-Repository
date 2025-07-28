import React, { useState, useCallback } from 'react';
import { Camera, Eye, Zap, Download, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { TextElement } from '../types';
import FigmaScreenshotOCR from '../utils/figmaScreenshotOCR';

interface FigmaScreenshotExtractorProps {
  figmaUrl: string;
  onTextExtracted: (elements: TextElement[]) => void;
  onClose: () => void;
}

type ExtractionStep = 'instructions' | 'capturing' | 'processing' | 'results' | 'error';

export const FigmaScreenshotExtractor: React.FC<FigmaScreenshotExtractorProps> = ({
  figmaUrl,
  onTextExtracted,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<ExtractionStep>('instructions');
  const [extractedElements, setExtractedElements] = useState<TextElement[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');

  const ocrExtractor = FigmaScreenshotOCR.getInstance();

  const handleStartExtraction = useCallback(async () => {
    try {
      setCurrentStep('capturing');
      setProcessingStatus('Requesting screen capture permission...');

      // Start the extraction process
      setCurrentStep('processing');
      setProcessingStatus('Capturing screenshot...');

      const elements = await ocrExtractor.extractTextFromDesign(figmaUrl);
      
      setExtractedElements(elements);
      setCurrentStep('results');
      
    } catch (error) {
      console.error('Extraction failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      setCurrentStep('error');
    }
  }, [figmaUrl, ocrExtractor]);

  const handleUseExtractedText = useCallback(() => {
    onTextExtracted(extractedElements);
    onClose();
  }, [extractedElements, onTextExtracted, onClose]);

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Camera className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Extract Real Text from Your Figma Design
        </h3>
        <p className="text-slate-600">
          We'll capture a screenshot of your Figma design and use OCR to extract the actual text content.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <Eye className="w-4 h-4 mr-2" />
          How it works:
        </h4>
        <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
          <li>We'll ask for permission to capture your screen</li>
          <li>Select the browser tab/window with your Figma design</li>
          <li>Our OCR technology will analyze the screenshot</li>
          <li>We'll extract all visible text with position data</li>
          <li>You'll get real text content from your design!</li>
        </ol>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Before you start:
        </h4>
        <ul className="list-disc list-inside text-amber-800 space-y-1 text-sm">
          <li><strong>Open your Figma design</strong> in a separate tab/window</li>
          <li><strong>Make sure text is visible</strong> and not too small</li>
          <li><strong>Zoom appropriately</strong> for best OCR results</li>
          <li><strong>Remove overlays</strong> or popups that might hide text</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleStartExtraction}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Camera className="w-4 h-4 mr-2" />
          Start Text Extraction
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCapturing = () => (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <Camera className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Select Your Figma Design</h3>
      <p className="text-slate-600">
        A screen capture dialog should have appeared. Please select the browser tab or window containing your Figma design.
      </p>
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
        <strong>Tip:</strong> Make sure your Figma design is fully visible and at a good zoom level for text recognition.
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Processing Your Design</h3>
      <p className="text-slate-600">{processingStatus}</p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <div className="font-medium text-blue-900">OCR Analysis in Progress</div>
            <div className="text-sm text-blue-700">Extracting text from your design screenshot...</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">
          Text Extraction Complete!
        </h3>
        <p className="text-slate-600">
          Found {extractedElements.length} text elements in your design.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">Extracted Text Preview:</h4>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {extractedElements.slice(0, 10).map((element, index) => (
            <div key={index} className="bg-white border border-green-200 rounded px-3 py-2">
              <div className="font-medium text-green-900">{element.originalText}</div>
              <div className="text-xs text-green-700">
                {element.componentType} • {element.frameName} • {(element.extractionMetadata.confidence * 100).toFixed(1)}% confidence
              </div>
            </div>
          ))}
          {extractedElements.length > 10 && (
            <div className="text-center text-sm text-green-700 font-medium">
              ... and {extractedElements.length - 10} more elements
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">What happens next:</h4>
        <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
          <li>These real text elements will replace the mock data</li>
          <li>You can export them to CSV for editing</li>
          <li>Edit the text and re-import your changes</li>
          <li>Generate updated design files with your edits</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleUseExtractedText}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Use This Text ({extractedElements.length} elements)
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Extraction Failed</h3>
      <p className="text-slate-600">{errorMessage}</p>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-red-900 mb-2">Common issues and solutions:</h4>
        <ul className="list-disc list-inside text-red-800 space-y-1 text-sm">
          <li><strong>Permission denied:</strong> Make sure to allow screen capture when prompted</li>
          <li><strong>No text found:</strong> Ensure your Figma design is visible and zoomed appropriately</li>
          <li><strong>OCR failed:</strong> Try refreshing the page and ensuring good text visibility</li>
          <li><strong>Technical error:</strong> Your browser may not support the required APIs</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleStartExtraction}
          className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Camera className="w-4 h-4 mr-2" />
          Try Again
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {currentStep === 'instructions' && renderInstructions()}
          {currentStep === 'capturing' && renderCapturing()}
          {currentStep === 'processing' && renderProcessing()}
          {currentStep === 'results' && renderResults()}
          {currentStep === 'error' && renderError()}
        </div>
      </div>
    </div>
  );
};

export default FigmaScreenshotExtractor;
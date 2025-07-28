import React, { useState } from 'react';
import { Plus, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { TextElement } from '../types';

interface SimpleTextEntryProps {
  figmaUrl: string;
  onTextExtracted: (elements: TextElement[]) => void;
  onClose: () => void;
}

export const SimpleTextEntry: React.FC<SimpleTextEntryProps> = ({
  figmaUrl,
  onTextExtracted,
  onClose
}) => {
  const [textItems, setTextItems] = useState<string[]>(['']);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add a new text input field
  const addTextItem = () => {
    setTextItems([...textItems, '']);
  };

  // Remove a text input field
  const removeTextItem = (index: number) => {
    if (textItems.length > 1) {
      const newItems = textItems.filter((_, i) => i !== index);
      setTextItems(newItems);
    }
  };

  // Update text in a specific field
  const updateTextItem = (index: number, value: string) => {
    const newItems = [...textItems];
    newItems[index] = value;
    setTextItems(newItems);
  };

  // Convert text items to TextElement objects
  const handleCreateElements = () => {
    const validTexts = textItems.filter(text => text.trim().length > 0);
    
    if (validTexts.length === 0) {
      alert('Please enter at least one text item');
      return;
    }

    setIsProcessing(true);

    // Create simple, clean TextElement objects
    const elements: TextElement[] = validTexts.map((text, index) => {
      const trimmedText = text.trim();
      
      // Smart component type detection
      const componentType = determineComponentType(trimmedText);
      const isInteractive = componentType === 'button' || componentType === 'link' || componentType === 'navigation';
      
      return {
        id: `manual_${index + 1}`,
        originalText: trimmedText,
        frameName: `Frame ${Math.ceil((index + 1) / 5)}`, // Group into frames of 5
        componentPath: `Manual Entry > ${componentType}`,
        boundingBox: {
          x: (index % 3) * 200, // Simple grid layout
          y: Math.floor(index / 3) * 60,
          width: 180,
          height: 40
        },
        contextNotes: `Manually entered text item ${index + 1}`,
        componentType,
        hierarchy: `Figma Design > Frame ${Math.ceil((index + 1) / 5)} > ${componentType}`,
        isInteractive,
        screenSection: index < 3 ? 'header' : index >= validTexts.length - 2 ? 'footer' : 'main',
        priority: componentType === 'heading' || componentType === 'button' ? 'high' : 'medium',
        fontSize: componentType === 'heading' ? 24 : componentType === 'button' ? 16 : 14,
        fontFamily: 'Inter',
        fontWeight: componentType === 'heading' || componentType === 'button' ? '600' : '400',
        extractionMetadata: {
          source: 'manual' as const,
          confidence: 1.0, // User manually entered, so 100% confidence
          extractedAt: new Date(),
          extractionMethod: 'Manual Entry'
        }
      };
    });

    // Simulate processing for smooth UX
    setTimeout(() => {
      setIsProcessing(false);
      onTextExtracted(elements);
      onClose();
    }, 800);
  };

  // Smart component type detection based on text content
  const determineComponentType = (text: string): TextElement['componentType'] => {
    const lowerText = text.toLowerCase();
    
    // Button patterns
    if (lowerText.includes('click') || 
        lowerText.includes('submit') || 
        lowerText.includes('save') || 
        lowerText.includes('cancel') || 
        lowerText.includes('continue') ||
        lowerText.includes('next') ||
        lowerText.includes('back') ||
        lowerText.match(/^(ok|yes|no|apply|reset)$/)) {
      return 'button';
    }
    
    // Navigation patterns
    if (lowerText.includes('home') || 
        lowerText.includes('menu') || 
        lowerText.includes('nav') ||
        lowerText.includes('about') ||
        lowerText.includes('contact') ||
        lowerText.includes('help') ||
        lowerText.match(/^(dashboard|profile|settings|logout)$/)) {
      return 'navigation';
    }
    
    // Heading patterns
    if (text.length < 50 && (
        text === text.toUpperCase() || 
        /^[A-Z]/.test(text) && text.split(' ').length <= 4 ||
        lowerText.includes('title') ||
        lowerText.includes('welcome')
      )) {
      return 'heading';
    }
    
    // Label patterns
    if (text.includes(':') || 
        lowerText.includes('name') ||
        lowerText.includes('email') ||
        lowerText.includes('password') ||
        lowerText.includes('address') ||
        text.length < 20) {
      return 'label';
    }
    
    // Link patterns
    if (lowerText.includes('learn more') ||
        lowerText.includes('read more') ||
        lowerText.includes('see more') ||
        lowerText.includes('click here') ||
        text.startsWith('http')) {
      return 'link';
    }
    
    // Default to content
    return 'content';
  };

  // Auto-populate with common UI text examples
  const useExamples = () => {
    setTextItems([
      'Welcome to Dashboard',
      'Home',
      'Profile',
      'Settings',
      'Create New Project',
      'Recent Activity',
      'Your Projects',
      'Save Changes',
      'Cancel',
      'Learn More'
    ]);
  };

  const validTextCount = textItems.filter(text => text.trim().length > 0).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter Your Text Content</h3>
            <p className="text-slate-600">
              Simply type or paste the text from your Figma design. Add one text item per field.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Buttons:</strong> "Save", "Cancel", "Submit" → Detected automatically</li>
                  <li>• <strong>Navigation:</strong> "Home", "Profile", "Settings" → Smart categorization</li>
                  <li>• <strong>Headings:</strong> "Welcome", "Dashboard" → Proper styling applied</li>
                  <li>• <strong>Labels:</strong> "Email:", "Name:" → Form field detection</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900">Text Items ({validTextCount})</h4>
              <div className="flex space-x-2">
                <button
                  onClick={useExamples}
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Use Examples
                </button>
                <button
                  onClick={addTextItem}
                  className="flex items-center text-sm px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {textItems.map((text, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <span className="text-sm text-slate-500 w-8">{index + 1}.</span>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => updateTextItem(index, e.target.value)}
                    placeholder="Enter text (e.g., Welcome, Home, Save, etc.)"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {textItems.length > 1 && (
                    <button
                      onClick={() => removeTextItem(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {validTextCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <h4 className="font-medium text-green-900">Ready to Create</h4>
                  <p className="text-sm text-green-800">
                    {validTextCount} text item{validTextCount !== 1 ? 's' : ''} will be converted to editable elements
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleCreateElements}
              disabled={validTextCount === 0 || isProcessing}
              className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isProcessing ? 'Creating Elements...' : `Create ${validTextCount} Text Element${validTextCount !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTextEntry;
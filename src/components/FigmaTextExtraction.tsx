import React, { useState } from 'react';
import { Copy, Upload, Download, ExternalLink, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { TextElement } from '../types';

interface FigmaTextExtractionProps {
  onTextExtracted: (elements: TextElement[]) => void;
  figmaUrl: string;
  onClose: () => void;
}

export const FigmaTextExtraction: React.FC<FigmaTextExtractionProps> = ({
  onTextExtracted,
  figmaUrl,
  onClose
}) => {
  const [method, setMethod] = useState<'paste' | 'api' | 'manual'>('paste');
  const [pastedData, setPastedData] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedCount, setExtractedCount] = useState(0);

  // Extract Figma file ID from URL
  const extractFileId = (url: string): string | null => {
    const match = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Method 1: Copy-paste from Figma
  const handlePasteMethod = async () => {
    if (!pastedData.trim()) {
      alert('Please paste the text content from your Figma file first.');
      return;
    }

    setIsProcessing(true);
    try {
      const elements = parseTextFromPaste(pastedData, figmaUrl);
      setExtractedCount(elements.length);
      onTextExtracted(elements);
    } catch (error) {
      console.error('Error parsing pasted data:', error);
      alert('Error parsing the pasted content. Please try again or use a different method.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Method 2: API with token
  const handleApiMethod = async () => {
    const fileId = extractFileId(figmaUrl);
    if (!fileId || !apiToken.trim()) {
      alert('Please provide a valid Figma URL and API token.');
      return;
    }

    setIsProcessing(true);
    try {
      const elements = await extractViaAPI(fileId, apiToken);
      setExtractedCount(elements.length);
      onTextExtracted(elements);
    } catch (error) {
      console.error('Error with API extraction:', error);
      alert('Error accessing Figma API. Please check your token and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Parse text from copy-pasted Figma content
  const parseTextFromPaste = (content: string, url: string): TextElement[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const elements: TextElement[] = [];
    let elementIndex = 0;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine && trimmedLine.length > 0) {
        // Determine component type based on text characteristics
        const componentType = determineComponentType(trimmedLine, index);
        const screenSection = determineScreenSection(trimmedLine, index, lines.length);
        
        elements.push({
          id: `real_${elementIndex++}`,
          originalText: trimmedLine,
          frameName: extractFrameName(url),
          componentPath: `${extractFrameName(url)}/${componentType}`,
          boundingBox: {
            x: 20 + (index % 3) * 120,
            y: 60 + Math.floor(index / 3) * 40,
            width: Math.min(300, trimmedLine.length * 8 + 20),
            height: componentType === 'heading' ? 32 : 24
          },
          contextNotes: `Real text from Figma - Line ${index + 1}`,
          componentType,
          hierarchy: `${extractFrameName(url)} > ${componentType}`,
          isInteractive: ['button', 'link', 'navigation'].includes(componentType),
          screenSection,
          priority: componentType === 'heading' ? 'high' : 'medium',
          fontSize: componentType === 'heading' ? 24 : 16,
          fontFamily: 'Inter',
          fontWeight: componentType === 'heading' ? '600' : '400',
          extractionMetadata: {
            source: 'manual' as const,
            confidence: 0.95,
            extractedAt: new Date(),
            extractionMethod: 'Copy-Paste from Figma'
          }
        });
      }
    });

    return elements;
  };

  // Extract via Figma API
  const extractViaAPI = async (fileId: string, token: string): Promise<TextElement[]> => {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': token
      }
    });

    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return parseFigmaAPIData(data, figmaUrl);
  };

  // Parse Figma API response
  const parseFigmaAPIData = (figmaData: any, url: string): TextElement[] => {
    const textElements: TextElement[] = [];
    let elementIndex = 0;

    const traverseNode = (node: any, frameName: string = '', hierarchy: string[] = []) => {
      if (node.type === 'TEXT' && node.characters) {
        const bounds = node.absoluteBoundingBox || { x: 0, y: 0, width: 100, height: 20 };
        const textStyle = node.style || {};
        
        textElements.push({
          id: `api_${elementIndex++}`,
          originalText: node.characters,
          frameName: frameName || node.name || 'Figma Frame',
          componentPath: [...hierarchy, node.name || 'Text'].join(' > '),
          boundingBox: bounds,
          contextNotes: `Real text from Figma API - ${node.name || 'Text Node'}`,
          componentType: determineComponentType(node.characters, elementIndex),
          hierarchy: [...hierarchy, node.name || 'Text'].join(' > '),
          isInteractive: node.name?.toLowerCase().includes('button') || false,
          screenSection: determineScreenSection(node.characters, elementIndex, 10),
          priority: bounds.height > 30 ? 'high' : 'medium',
          fontSize: textStyle.fontSize || 16,
          fontFamily: textStyle.fontFamily || 'Inter',
          fontWeight: textStyle.fontWeight?.toString() || '400',
          extractionMetadata: {
            source: 'api' as const,
            confidence: 1.0,
            extractedAt: new Date(),
            extractionMethod: 'Figma API'
          }
        });
      }

      if (node.children) {
        const currentFrameName = node.type === 'FRAME' ? node.name : frameName;
        node.children.forEach((child: any) => {
          traverseNode(child, currentFrameName, [...hierarchy, node.name || node.type]);
        });
      }
    };

    if (figmaData.document) {
      traverseNode(figmaData.document);
    }

    return textElements;
  };

  // Helper functions
  const determineComponentType = (text: string, index: number): TextElement['componentType'] => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('button') || lowerText.includes('click') || lowerText.includes('submit')) return 'button';
    if (index === 0 || text.length < 20) return 'heading';
    if (lowerText.includes('nav') || lowerText.includes('menu') || lowerText.includes('home')) return 'navigation';
    if (lowerText.includes('label') || lowerText.includes(':')) return 'label';
    if (lowerText.includes('link') || lowerText.includes('read more')) return 'link';
    return 'content';
  };

  const determineScreenSection = (text: string, index: number, total: number): TextElement['screenSection'] => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('header') || index < 3) return 'header';
    if (lowerText.includes('footer') || index > total - 3) return 'footer';
    if (lowerText.includes('nav') || lowerText.includes('menu')) return 'navigation';
    return 'main';
  };

  const extractFrameName = (url: string): string => {
    const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
    if (match) {
      return decodeURIComponent(match[1]).replace(/-/g, ' ').replace(/_/g, ' ');
    }
    return 'Figma Design';
  };

  const copyInstructions = () => {
    const instructions = `
How to copy text from Figma:

1. Open your Figma file: ${figmaUrl}
2. Select all text elements (Cmd/Ctrl + A or manually select)
3. Copy the selection (Cmd/Ctrl + C)
4. Paste the content in the text box below
5. Click "Extract Real Text"

The app will automatically parse all the text and organize it for editing.
    `;
    navigator.clipboard.writeText(instructions.trim());
    alert('Instructions copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="w-6 h-6 text-blue-600 mr-3" />
              <h3 className="text-xl font-semibold text-slate-900">Extract Real Text from Figma</h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>

      <div className="mb-6">
        <p className="text-slate-600 mb-4">
          Choose how you want to extract the actual text from your Figma file:
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Method 1: Copy-Paste */}
          <button
            onClick={() => setMethod('paste')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === 'paste' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Copy className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="font-medium text-slate-900 mb-1">Copy & Paste</h4>
            <p className="text-sm text-slate-600">Copy text directly from Figma</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                ✓ Easy & Fast
              </span>
            </div>
          </button>

          {/* Method 2: API Token */}
          <button
            onClick={() => setMethod('api')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === 'api' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <ExternalLink className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="font-medium text-slate-900 mb-1">Figma API</h4>
            <p className="text-sm text-slate-600">Use your personal access token</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                ✓ Most Accurate
              </span>
            </div>
          </button>

          {/* Method 3: Manual Entry */}
          <button
            onClick={() => setMethod('manual')}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              method === 'manual' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <Upload className="w-5 h-5 text-blue-600 mb-2" />
            <h4 className="font-medium text-slate-900 mb-1">Manual Entry</h4>
            <p className="text-sm text-slate-600">Type or paste text manually</p>
            <div className="mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                ⚡ Quick Start
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Method 1: Copy-Paste Interface */}
      {method === 'paste' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">How to copy text from Figma:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                  <li>Open your Figma file in a new tab</li>
                  <li>Select all text elements (Cmd/Ctrl + A)</li>
                  <li>Copy the selection (Cmd/Ctrl + C)</li>
                  <li>Paste the content below</li>
                </ol>
                <button
                  onClick={copyInstructions}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Copy these instructions
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Paste your Figma text content here:
            </label>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder="Paste all the text from your Figma design here... Each line will become a text element that you can edit."
              className="w-full h-40 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-2 text-sm text-slate-500">
              {pastedData.split('\n').filter(line => line.trim()).length} text elements detected
            </p>
          </div>

          <button
            onClick={handlePasteMethod}
            disabled={!pastedData.trim() || isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? 'Processing...' : 'Extract Real Text'}
          </button>
        </div>
      )}

      {/* Method 2: API Interface */}
      {method === 'api' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">Get your Figma personal access token:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-amber-800">
                  <li>Go to Figma → Settings → Personal access tokens</li>
                  <li>Click "Create a new personal access token"</li>
                  <li>Give it a name and copy the token</li>
                  <li>Paste it below (it stays in your browser)</li>
                </ol>
                <a
                  href="https://www.figma.com/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-sm text-amber-600 hover:text-amber-700 underline"
                >
                  Open Figma Settings <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Figma Personal Access Token:
            </label>
            <input
              type="password"
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="figd_..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Your token is stored locally and never sent to our servers
            </p>
          </div>

          <button
            onClick={handleApiMethod}
            disabled={!apiToken.trim() || isProcessing}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? 'Extracting from API...' : 'Extract via Figma API'}
          </button>
        </div>
      )}

      {/* Method 3: Manual Interface */}
      {method === 'manual' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-900 mb-2">Quick manual entry:</h4>
                <p className="text-sm text-green-800">
                  Type each piece of text on a new line. Perfect for smaller designs or quick tests.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Enter your text content (one per line):
            </label>
            <textarea
              value={pastedData}
              onChange={(e) => setPastedData(e.target.value)}
              placeholder={`Welcome to our app
Get started now
Sign up
Login
About us
Contact`}
              className="w-full h-32 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handlePasteMethod}
            disabled={!pastedData.trim() || isProcessing}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isProcessing ? 'Processing...' : 'Create Text Elements'}
          </button>
        </div>
      )}

      {/* Success Message */}
      {extractedCount > 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900">Success!</h4>
              <p className="text-sm text-green-800">
                Extracted {extractedCount} real text elements from your Figma design. 
                You can now edit them and export back to Figma.
              </p>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};
import React, { useState, useCallback } from 'react';
import { Upload, ExternalLink, FileImage, Layers, Download } from 'lucide-react';
import { Prototype, TextElement } from '../types';
import { PrototypeTextExtractor } from '../utils/textExtractor';
import { UserGuide } from './UserGuide';

interface PrototypeImportProps {
  onImportComplete: (prototype: Prototype) => void;
}

export const PrototypeImport: React.FC<PrototypeImportProps> = ({ onImportComplete }) => {
  const [importMethod, setImportMethod] = useState<'file' | 'url' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [url, setUrl] = useState('');
  const [extractor] = useState(() => new PrototypeTextExtractor());
  const [hasImported, setHasImported] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    
    try {
      const extractedData = await extractor.extractFromFile(file);
      console.log('Extracted', extractedData.textElements.length, 'text elements from', file.name);
      
      const prototype: Prototype = {
        id: `proto_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        source: 'bolt',
        textElements: extractedData.textElements,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      setIsProcessing(false);
      onImportComplete(prototype);
    } catch (error) {
      console.error('Error extracting from file:', error);
      setIsProcessing(false);
      
      // Show user-friendly error message
      alert(`Unable to process this file. Please try a different file format or check that the file isn't corrupted.`);
    }
  }, [extractor, onImportComplete]);

  // COMPLETELY DIRECT URL import - bypasses ALL extraction code
  const handleUrlImport = useCallback(async () => {
    if (!url.trim()) return;
    if (isProcessing || hasImported) {
      console.log('🛑 PREVENTED: Already processing or imported');
      return;
    }

    console.log('🟢 COMPLETELY DIRECT import - NO extraction chains:', url);
    setHasImported(true);
    setIsProcessing(true);
    
    try {
      // Wait a tiny bit to show processing state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('🟢 Step 1: Starting direct import process');
      
      // Extract just the file name for display
      let fileName = 'Figma Design';
      try {
        const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
        if (match) {
          fileName = decodeURIComponent(match[1])
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }
        console.log('🟢 Step 2: Extracted file name:', fileName);
      } catch (e) {
        console.log('🟡 Could not parse file name, using default:', e);
        fileName = 'Figma Design';
      }

      console.log('🟢 Step 3: URL imported successfully - NO TEXT ELEMENTS CREATED');

      // NO fake text elements - only real extraction allowed
      const textElements: TextElement[] = [];
      
      console.log('🟢 Step 4: Zero text elements - real extraction required');
      console.log('🟢 Step 5: User must use Screenshot+OCR or API extraction');
      
      const source = url.includes('figma.com') ? 'figma' : url.includes('cursor.') ? 'cursor' : 'bolt';
      console.log('🟢 Step 6: Determined source as:', source);
      
      const prototype: Prototype = {
        id: `proto_${Date.now()}`,
        name: fileName,
        source: source as 'bolt' | 'figma' | 'cursor',
        url,
        textElements,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      console.log('🟢 Step 7: Created prototype:', {
        id: prototype.id,
        name: prototype.name,
        source: prototype.source,
        elementCount: prototype.textElements.length
      });

      console.log('🟢 Step 8: Calling onImportComplete...');
      setIsProcessing(false);
      onImportComplete(prototype);
      console.log('🟢 Step 9: SUCCESS - Import completed successfully!');
      
    } catch (error) {
      console.error('🔴 DETAILED ERROR in direct import:', error);
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setIsProcessing(false);
      setHasImported(false); // Reset on error so user can try again
      alert(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [url, onImportComplete, isProcessing, hasImported]);



  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">Processing Prototype</h2>
          <p className="text-slate-600 mb-6">Extracting text elements and analyzing components...</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Import Prototype</h2>
        <p className="text-lg text-slate-600">
          Load your prototype from Bolt, Figma, or Cursor to extract text elements
        </p>
      </div>

      <UserGuide />

      <div className="grid md:grid-cols-2 gap-8">
        {/* File Upload Method */}
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          importMethod === 'file' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }`}
        onClick={() => setImportMethod('file')}>
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
              <Upload className="w-8 h-8 text-slate-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload File</h3>
          <p className="text-slate-600 mb-4">Upload prototype files from your computer</p>
          
          {importMethod === 'file' && (
            <div className="mt-6">
              <input
                type="file"
                accept=".fig,.figma,.bolt,.cursor,.zip,.json,.html,.htm,.png,.jpg,.jpeg,.txt,.js,.jsx,.ts,.tsx,.css,.scss,.less"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </label>
            </div>
          )}
        </div>

        {/* URL Import Method */}
        <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer ${
          importMethod === 'url' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
        }`}
        onClick={() => setImportMethod('url')}>
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full">
              <ExternalLink className="w-8 h-8 text-slate-600" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Import from URL</h3>
          <p className="text-slate-600 mb-4">Import directly from Figma, Cursor, or Bolt URLs</p>
          
          {importMethod === 'url' && (
            <div className="mt-6 space-y-4">
              <input
                type="url"
                placeholder="https://figma.com/file/... or https://bolt.new/... or any URL"
                value={url}
                onChange={(e) => {
                  const newUrl = e.target.value;
                  setUrl(newUrl);
                  // Only reset if URL actually changed to a different value
                  if (newUrl !== url) {
                    setHasImported(false);
                  }
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={handleUrlImport}
                disabled={!url.trim() || isProcessing || hasImported}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 mr-2" />
                {hasImported ? 'Import Complete' : 'Import from URL'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Supported Formats */}
      <div className="mt-12 text-center">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Supported Sources</h4>
        <div className="flex justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <FileImage className="w-5 h-5 text-blue-600" />
            <span className="text-slate-600">Figma, Images, HTML, React/JS</span>
          </div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-green-600" />
            <span className="text-slate-600">Bolt, JSON, Code Files</span>
          </div>
          <div className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5 text-purple-600" />
            <span className="text-slate-600">Live URLs, Cursor Projects</span>
          </div>
        </div>
      </div>
    </div>
  );
};
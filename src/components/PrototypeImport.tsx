import React, { useState, useCallback } from 'react';
import { Upload, ExternalLink } from 'lucide-react';
import { Prototype, TextElement } from '../types';
import { PrototypeTextExtractor } from '../utils/textExtractor';

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
      const textElements = await extractor.extractFromFile(file);
      
      const prototype: Prototype = {
        id: `proto_${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        source: 'bolt',
        textElements,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      onImportComplete(prototype);
    } catch (error) {
      alert(`Failed to process file: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsProcessing(false);
    }
  }, [extractor, onImportComplete]);

  const handleUrlImport = useCallback(async () => {
    if (!url.trim()) return;
    if (isProcessing || hasImported) return;

    setHasImported(true);
    setIsProcessing(true);
    
    try {
      // Extract file name
      let fileName = 'Imported Prototype';
      try {
        const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
        if (match) {
          fileName = decodeURIComponent(match[1])
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
        }
      } catch (e) {
        // Use default
      }

      // Extract text elements
      const textElements = await extractor.extractFromURL(url);
      
      const source = url.includes('figma.com') ? 'figma' : url.includes('cursor.') ? 'cursor' : 'bolt';
      
      const prototype: Prototype = {
        id: `proto_${Date.now()}`,
        name: fileName,
        source: source as 'bolt' | 'figma' | 'cursor',
        url,
        textElements,
        createdAt: new Date(),
        lastUpdated: new Date()
      };

      setIsProcessing(false);
      onImportComplete(prototype);
      
    } catch (error) {
      setIsProcessing(false);
      setHasImported(false);
      alert(`Import failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }, [url, onImportComplete, isProcessing, hasImported, extractor]);

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg text-slate-700">Processing your prototype...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Import Your Prototype</h2>
          <p className="text-lg text-slate-600">
            Load your prototype from Bolt, Figma, or Cursor to extract text elements
          </p>
        </div>

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
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
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
            <p className="text-slate-600 mb-4">Import from Figma, Bolt, or Cursor URLs</p>
            
            {importMethod === 'url' && (
              <div className="mt-6 space-y-4">
                <input
                  type="url"
                  placeholder="https://figma.com/file/... or https://bolt.new/... or any URL"
                  value={url}
                  onChange={(e) => {
                    const newUrl = e.target.value;
                    setUrl(newUrl);
                    if (newUrl !== url) {
                      setHasImported(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleUrlImport}
                  disabled={!url.trim() || isProcessing || hasImported}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {hasImported ? 'Import Complete' : 'Import from URL'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { X, Download, Copy, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface CSVDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvContent: string;
  fileName: string;
  onFigmaExport?: () => void;
}

export const CSVDownloadModal: React.FC<CSVDownloadModalProps> = ({
  isOpen,
  onClose,
  csvContent,
  fileName,
  onFigmaExport
}) => {
  const [status, setStatus] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const showStatus = (message: string, isError = false) => {
    setStatus({ message, isError });
    if (!isError) {
      setTimeout(() => setStatus(null), 3000);
    }
  };

  const handleDownload = () => {
    try {
      if (!csvContent || csvContent.length < 10) {
        showStatus('Error: No CSV content to download', true);
        return;
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      showStatus('Download started! Check your Downloads folder.');
    } catch (error) {
      console.error('Download error:', error);
      showStatus('Download failed. Try copying the content instead.', true);
    }
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(csvContent);
        showStatus('CSV content copied to clipboard! Paste into Excel, Google Sheets, or a text editor.');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = csvContent;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showStatus('CSV content copied to clipboard!');
      }
    } catch (error) {
      showStatus('Copy failed. Please manually select and copy the text below.', true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">📊 CSV Export Ready</h2>
            <p className="text-sm text-slate-600 mt-1">Your text elements are ready to download</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Figma Import Option */}
          {onFigmaExport && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h3 className="font-medium text-purple-900 mb-2 flex items-center">
                🎯 Import Directly into Figma
              </h3>
              <p className="text-purple-800 text-sm mb-3">
                Get Figma-compatible files (JSON, SVG, CSV) that you can import directly into Figma with proper positioning and formatting.
              </p>
              <button
                onClick={onFigmaExport}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.332 8.668a3.333 3.333 0 0 0 0-6.663H8.668a3.333 3.333 0 0 0 0 6.663 3.333 3.333 0 0 0 0 6.665 3.333 3.333 0 0 0 0 6.664A3.334 3.334 0 0 0 12 18.664V8.668h3.332z"/>
                  <circle cx="15.332" cy="12" r="3.332"/>
                </svg>
                Download Figma Import Files
              </button>
            </div>
          )}

          {/* Standard CSV Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2">📋 Standard CSV Export:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
              <li><strong>Click "Download CSV File"</strong> below (most reliable method)</li>
              <li><strong>OR</strong> Click "Copy to Clipboard" and paste into Excel/Google Sheets</li>
              <li><strong>OR</strong> Right-click the text area below and copy manually</li>
              <li>Save the file with a <strong>.csv</strong> extension</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <button
              onClick={handleDownload}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV File
            </button>
            
            <button
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy to Clipboard
            </button>
          </div>

          {/* Status Message */}
          {status && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg mb-4 ${
              status.isError 
                ? 'bg-red-50 text-red-800 border border-red-200' 
                : 'bg-green-50 text-green-800 border border-green-200'
            }`}>
              {status.isError ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              )}
              <span className="text-sm">{status.message}</span>
            </div>
          )}

          {/* CSV Content Preview */}
          <div className="space-y-3">
            <h3 className="font-medium text-slate-900">CSV Content Preview:</h3>
            <textarea
              value={csvContent}
              readOnly
              className="w-full h-64 font-mono text-xs border border-slate-300 rounded-lg p-3 bg-slate-50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="CSV content will appear here..."
            />
            <p className="text-xs text-slate-500">
              Content length: {csvContent.length} characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
import React from 'react';
import { AlertCircle, ExternalLink, Key, Download } from 'lucide-react';

export const ImportInstructions: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Real Data Extraction Setup
          </h3>
          
          <div className="space-y-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">🎨 For Figma Files:</h4>
              <ul className="space-y-1 ml-4">
                <li>• Get a Figma access token from your <a href="https://www.figma.com/developers/api#access-tokens" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Figma account settings</a></li>
                <li>• Set environment variable: <code className="bg-blue-100 px-1 rounded">REACT_APP_FIGMA_ACCESS_TOKEN=your_token</code></li>
                <li>• Or export your Figma file as HTML/SVG and upload the file instead</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">⚡ For Bolt.new Projects:</h4>
              <ul className="space-y-1 ml-4">
                <li>• The tool will attempt to fetch content directly from the URL</li>
                <li>• If blocked by CORS, try downloading the project and uploading the HTML files</li>
                <li>• Look for "Download" or "Export" options in your Bolt project</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">🔧 Alternative Methods:</h4>
              <ul className="space-y-1 ml-4">
                <li>• <strong>HTML Export:</strong> Download/export your prototype as HTML and upload the file</li>
                <li>• <strong>Screenshots:</strong> Upload PNG/JPG images for OCR text extraction</li>
                <li>• <strong>Code Files:</strong> Upload React/HTML files directly</li>
              </ul>
            </div>
            
            <div className="bg-blue-100 rounded p-3 mt-4">
              <p className="font-medium">💡 Pro Tip:</p>
              <p>For the most accurate results, export your prototype as HTML or upload the source code files. This gives much better text extraction than trying to scrape live URLs.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
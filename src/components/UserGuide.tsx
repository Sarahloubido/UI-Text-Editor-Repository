import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Download, Upload, Edit } from 'lucide-react';

export const UserGuide: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-blue-600 mr-2" />
          ) : (
            <ChevronRight className="w-4 h-4 text-blue-600 mr-2" />
          )}
          <h3 className="text-lg font-semibold text-blue-900">How to Use This Tool</h3>
        </div>
        <span className="text-sm text-blue-600">Click to {isExpanded ? 'hide' : 'show'} guide</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                  1
                </div>
                <ExternalLink className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Import Design</h4>
              <p className="text-sm text-blue-700">
                Paste your Figma URL or upload a file. The system will extract all text elements from your design.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <p><strong>Figma URLs like:</strong></p>
                <p>figma.com/file/abc123/Design-Name</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                  2
                </div>
                <Download className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Export CSV</h4>
              <p className="text-sm text-blue-700">
                Review extracted text elements and download them as a CSV spreadsheet for editing.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <p><strong>CSV includes:</strong></p>
                <p>• Original text • Component info • Context</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                  3
                </div>
                <Edit className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Edit Content</h4>
              <p className="text-sm text-blue-700">
                Edit the CSV file in Excel, Google Sheets, or any spreadsheet app. Update the "edited_text" column.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <p><strong>Tips:</strong></p>
                <p>• Keep IDs unchanged • Edit text only</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-2">
                  4
                </div>
                <Upload className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-semibold text-blue-900 mb-2">Re-import & Apply</h4>
              <p className="text-sm text-blue-700">
                Upload your edited CSV to see changes, then apply them back to your prototype.
              </p>
              <div className="mt-2 text-xs text-blue-600">
                <p><strong>Result:</strong></p>
                <p>Updated design with new text</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <p><strong>For Figma URLs:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Make sure the file is publicly viewable</li>
                  <li>Works with design, prototype, and file URLs</li>
                  <li>System analyzes URL to determine content type</li>
                </ul>
              </div>
              <div>
                <p><strong>For File Uploads:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Supports HTML, images, JSON, and more</li>
                  <li>Extracts text from various formats</li>
                  <li>Works with exported Figma files</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> This tool currently generates realistic mock data based on your Figma URL structure. 
              For production use, connect your Figma API token for real text extraction.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
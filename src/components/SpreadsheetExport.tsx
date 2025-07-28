import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, Eye, Search, Edit, FileDown } from 'lucide-react';
import { Prototype, TextElement } from '../types';
import { CSVParser } from '../utils/csvParser';
import { CSVDownloadModal } from './CSVDownloadModal';
import { ScreenshotGenerator } from '../utils/screenshotGenerator';

interface SpreadsheetExportProps {
  prototype: Prototype;
  onExportComplete: (selectedElementIds?: string[]) => void;
}

export const SpreadsheetExport: React.FC<SpreadsheetExportProps> = ({ 
  prototype, 
  onExportComplete 
}) => {
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx'>('csv');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedElements, setSelectedElements] = useState<Set<string>>(
    new Set(prototype.textElements.map(el => el.id))
  );
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [editMode, setEditMode] = useState<'download' | 'inline'>('download');
  const [elementPreviews, setElementPreviews] = useState<{ [key: string]: string }>({});
  const [previewsLoaded, setPreviewsLoaded] = useState(false);

  const filteredElements = prototype.textElements.filter(element =>
    element.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.frameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.componentPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate previews for elements
  useEffect(() => {
    const generatePreviews = async () => {
      console.log('Generating visual previews for text elements...');
      const designType = prototype.name.toLowerCase().includes('mobile') ? 'mobile' : 'web';
      const previews = ScreenshotGenerator.generateBatchPreviews(prototype.textElements, designType);
      setElementPreviews(previews);
      setPreviewsLoaded(true);
      console.log(`Generated ${Object.keys(previews).length} element previews`);
    };

    generatePreviews();
  }, [prototype.textElements, prototype.name]);

  const generateCSV = () => {
    const selectedTextElements = prototype.textElements.filter(el => 
      selectedElements.has(el.id)
    );
    
    if (selectedTextElements.length === 0) {
      console.warn('No elements selected for export');
      return '';
    }
    
    const csvData = selectedTextElements.map(element => ({
      id: String(element.id || ''),
      original_text: String(element.originalText || ''),
      edited_text: '', // Empty for writers to fill
      frame_name: String(element.frameName || ''),
      component_path: String(element.componentPath || ''),
      component_type: String(element.componentType || 'unknown'),
      screen_section: String(element.screenSection || 'unknown'),
      hierarchy: String(element.hierarchy || ''),
      priority: String(element.priority || 'medium'),
      is_interactive: element.isInteractive ? 'Yes' : 'No',
      font_size: String(element.fontSize || ''),
      font_weight: String(element.fontWeight || ''),
      nearby_elements: String(element.nearbyElements?.join('; ') || ''),
      element_role: String(element.elementRole || ''),
      extraction_confidence: String(element.extractionMetadata?.confidence || ''),
      extraction_source: String(element.extractionMetadata?.source || ''),
      context_notes: String(element.contextNotes || ''),
      image: String(element.image || '')
    }));

    return CSVParser.stringify(csvData);
  };

  const handleExport = () => {
    if (editMode === 'download') {
      const content = generateCSV();
      console.log('CSV generated, length:', content.length);
      
      if (!content || content.length < 50) {
        alert('Error: No CSV content generated. Please try importing your prototype again.');
        return;
      }

      // Set the CSV content and show the modal
      setCsvContent(content);
      setShowCSVModal(true);
    } else {
      // Inline editing mode - proceed directly to editing with selected elements
      const selectedElementIds = Array.from(selectedElements);
      onExportComplete(selectedElementIds);
    }
  };

  const handleModalClose = () => {
    setShowCSVModal(false);
    onExportComplete(); // For download mode, no specific elements
  };



  const toggleElementSelection = (elementId: string) => {
    const newSelection = new Set(selectedElements);
    if (newSelection.has(elementId)) {
      newSelection.delete(elementId);
    } else {
      newSelection.add(elementId);
    }
    setSelectedElements(newSelection);
  };

  const toggleAllElements = () => {
    if (selectedElements.size === filteredElements.length) {
      setSelectedElements(new Set());
    } else {
      setSelectedElements(new Set(filteredElements.map(el => el.id)));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Export Spreadsheet</h2>
        <p className="text-lg text-slate-600 mb-2">
          Found <strong>{prototype.textElements.length} text elements</strong> from <span className="font-semibold">{prototype.name}</span>
        </p>
        <p className="text-slate-600 mb-6">
          Review and select the text elements you want to export for your writing team. After editing and re-uploading the CSV, you'll get Figma import files at the final step.
        </p>
        
        {/* Edit Mode Selection */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Choose Your Editing Method</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              editMode === 'download' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`} onClick={() => setEditMode('download')}>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="download"
                  name="editMode"
                  value="download"
                  checked={editMode === 'download'}
                  onChange={() => setEditMode('download')}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileDown className="w-5 h-5 text-blue-600" />
                    <label htmlFor="download" className="font-medium text-slate-900">Download & Edit Externally</label>
                  </div>
                  <p className="text-sm text-slate-600">
                    Perfect for large amounts of text or collaborative editing. Download CSV to edit in Excel, Google Sheets, or any spreadsheet application.
                  </p>
                  <div className="mt-2 text-xs text-green-700">
                    ✓ Best for bulk editing • ✓ Team collaboration • ✓ Advanced spreadsheet features
                  </div>
                </div>
              </div>
            </div>

            <div className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              editMode === 'inline' 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-slate-200 hover:border-slate-300'
            }`} onClick={() => setEditMode('inline')}>
              <div className="flex items-start space-x-3">
                <input
                  type="radio"
                  id="inline"
                  name="editMode"
                  value="inline"
                  checked={editMode === 'inline'}
                  onChange={() => setEditMode('inline')}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Edit className="w-5 h-5 text-blue-600" />
                    <label htmlFor="inline" className="font-medium text-slate-900">Edit Directly in App</label>
                  </div>
                  <p className="text-sm text-slate-600">
                    Perfect for quick edits or smaller amounts of text. Edit directly in the browser with visual context and immediate feedback.
                  </p>
                  <div className="mt-2 text-xs text-green-700">
                    ✓ Quick & easy • ✓ Visual context • ✓ Immediate preview
                  </div>
                </div>
              </div>
            </div>
          </div>

          {editMode === 'download' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">Export Format</h4>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="csv"
                    name="format"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="text-blue-600"
                  />
                  <label htmlFor="csv" className="text-sm font-medium text-slate-700">CSV (Recommended)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="xlsx"
                    name="format"
                    value="xlsx"
                    checked={exportFormat === 'xlsx'}
                    onChange={() => setExportFormat('xlsx')}
                    className="text-blue-600"
                  />
                  <label htmlFor="xlsx" className="text-sm font-medium text-slate-700">XLSX</label>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <button
              onClick={handleExport}
              disabled={selectedElements.size === 0}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {editMode === 'download' ? (
                <>
                  <FileDown className="w-5 h-5 mr-2" />
                  Download CSV ({selectedElements.size} Elements)
                </>
              ) : (
                <>
                  <Edit className="w-5 h-5 mr-2" />
                  Start Editing ({selectedElements.size} Elements)
                </>
              )}
            </button>
          </div>
          
          {editMode === 'download' && (
            <div className="mt-3 text-center text-xs text-slate-500">
              <p>💡 The CSV will open in a modal with download and copy options</p>
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search text elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={toggleAllElements}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {selectedElements.size === filteredElements.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
        </div>
      </div>

      {/* Text Elements Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedElements.size === filteredElements.length}
                    onChange={toggleAllElements}
                    className="text-blue-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Visual Context</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Text Content</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Component Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredElements.map((element) => (
                <tr key={element.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedElements.has(element.id)}
                      onChange={() => toggleElementSelection(element.id)}
                      className="text-blue-600"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-24 h-16 rounded overflow-hidden bg-slate-100 border border-slate-200">
                      {previewsLoaded && elementPreviews[element.id] ? (
                        <img
                          src={elementPreviews[element.id]}
                          alt={`Visual context for "${element.originalText}"`}
                          className="w-full h-full object-cover"
                          title={`${element.componentType} in ${element.frameName} (${element.screenSection})`}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <div className="text-xs text-slate-500 text-center p-1">
                            <div className="font-medium">{element.componentType}</div>
                            <div className="text-[10px]">{element.screenSection}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="max-w-xs">
                      <p className="text-sm font-medium text-slate-900 line-clamp-2">
                        {element.originalText}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ID: {element.id} • {element.originalText.length} chars
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-slate-900">{element.frameName}</p>
                      <p className="text-xs text-slate-500">
                        {element.screenSection} • {element.boundingBox.width}×{element.boundingBox.height}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          element.componentType === 'button' ? 'bg-blue-100 text-blue-800' :
                          element.componentType === 'heading' ? 'bg-purple-100 text-purple-800' :
                          element.componentType === 'navigation' ? 'bg-green-100 text-green-800' :
                          element.componentType === 'content' ? 'bg-gray-100 text-gray-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {element.componentType}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          element.priority === 'high' ? 'bg-red-100 text-red-800' :
                          element.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {element.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono max-w-xs truncate">
                        {element.componentPath}
                      </p>
                      {element.fontSize && (
                        <p className="text-xs text-slate-500">
                          {element.fontFamily || 'Inter'} {element.fontSize}px
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredElements.length === 0 && (
        <div className="text-center py-12">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600">No text elements match your search criteria</p>
        </div>
      )}

      {/* Export Preview */}
      <div className="mt-8 p-6 bg-slate-50 rounded-lg">
        <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <Eye className="w-5 h-5 mr-2" />
          Export Preview
        </h4>
        <p className="text-sm text-slate-600 mb-4">
          Your spreadsheet will include these columns for writers to edit:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <strong>id:</strong> Unique identifier
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>original_text:</strong> Current text
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>edited_text:</strong> Empty (for writers)
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>frame_name:</strong> Screen/page name
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>component_path:</strong> UI hierarchy
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>context_notes:</strong> Additional info
          </div>
          <div className="bg-white p-3 rounded border">
            <strong>image:</strong> Screenshot URL
          </div>
        </div>
      </div>

      {/* CSV Download Modal */}
      <CSVDownloadModal
        isOpen={showCSVModal}
        onClose={handleModalClose}
        csvContent={csvContent}
        fileName={`${prototype.name.replace(/[^a-zA-Z0-9]/g, '_')}_text_elements.csv`}
      />
    </div>
  );
};
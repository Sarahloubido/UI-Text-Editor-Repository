import React, { useState } from 'react';
import { Download, FileSpreadsheet, Eye, Search } from 'lucide-react';
import { Prototype, TextElement } from '../types';
import { CSVParser } from '../utils/csvParser';
import { CSVDownloadModal } from './CSVDownloadModal';
import { FigmaImportGenerator } from '../utils/figmaImportGenerator';

interface SpreadsheetExportProps {
  prototype: Prototype;
  onExportComplete: () => void;
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

  const filteredElements = prototype.textElements.filter(element =>
    element.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.frameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.componentPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const content = generateCSV();
    console.log('CSV generated, length:', content.length);
    
    if (!content || content.length < 50) {
      alert('Error: No CSV content generated. Please try importing your prototype again.');
      return;
    }

    // Set the CSV content and show the modal
    setCsvContent(content);
    setShowCSVModal(true);
  };

  const handleModalClose = () => {
    setShowCSVModal(false);
    onExportComplete();
  };

  const handleFigmaExport = () => {
    const selectedTextElements = prototype.textElements.filter(el => 
      selectedElements.has(el.id)
    );
    
    if (selectedTextElements.length === 0) {
      alert('No elements selected for export');
      return;
    }

    // Download Figma-compatible files
    FigmaImportGenerator.downloadFigmaFiles(prototype, selectedTextElements);
    
    // Show instructions
    setTimeout(() => {
      alert(FigmaImportGenerator.getFigmaImportInstructions());
    }, 2000);
    
    // Close modal and complete export
    setShowCSVModal(false);
    onExportComplete();
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
          Review and select the text elements you want to export for your writing team
        </p>
        
        {/* Export Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
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
                <label htmlFor="csv" className="text-sm font-medium text-slate-700">CSV</label>
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
            
            <button
              onClick={handleExport}
              disabled={selectedElements.size === 0}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 mr-2" />
              Export {selectedElements.size} Elements
            </button>
          </div>
          
          <div className="mt-2 text-xs text-slate-500">
            <p>💡 The CSV content will be shown in a modal with download and copy options</p>
          </div>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Preview</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Text Content</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Component Path</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Notes</th>
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
                    {element.image && (
                      <div className="w-20 h-16 rounded overflow-hidden bg-slate-100 border border-slate-200">
                        <img
                          src={element.image}
                          alt={`Preview of ${element.originalText}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
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
                    <p className="text-sm text-slate-600">{element.frameName}</p>
                    <p className="text-xs text-slate-500">
                      {element.boundingBox.width}×{element.boundingBox.height}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-600 font-mono text-xs max-w-xs truncate">
                      {element.componentPath}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-slate-600 max-w-xs line-clamp-2">
                      {element.contextNotes}
                    </p>
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
        onFigmaExport={handleFigmaExport}
      />
    </div>
  );
};
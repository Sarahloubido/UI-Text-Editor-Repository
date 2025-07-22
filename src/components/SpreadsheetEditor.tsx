import React, { useState, useEffect } from 'react';
import { Edit3, Save, Eye, EyeOff, Upload, Download } from 'lucide-react';
import { TextElement } from '../types';
import { CSVParser } from '../utils/csvParser';

interface SpreadsheetEditorProps {
  elements: TextElement[];
  onElementsUpdate: (elements: TextElement[]) => void;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ 
  elements, 
  onElementsUpdate 
}) => {
  const [editingElements, setEditingElements] = useState<TextElement[]>(elements);
  const [showImages, setShowImages] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setEditingElements(elements);
  }, [elements]);

  const filteredElements = editingElements.filter(element =>
    element.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.frameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.componentPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTextChange = (elementId: string, newText: string) => {
    const updatedElements = editingElements.map(element =>
      element.id === elementId
        ? { ...element, editedText: newText, lastModified: new Date() }
        : element
    );
    setEditingElements(updatedElements);
    setHasChanges(true);
  };

  const handleSave = () => {
    onElementsUpdate(editingElements);
    setHasChanges(false);
  };

  const handleImportSpreadsheet = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      try {
        const csvData = CSVParser.parse(text);
        
        const updatedElements = editingElements.map(element => {
          const matchingRow = csvData.find(row => row.id === element.id);
          if (matchingRow && matchingRow.edited_text) {
            return {
              ...element,
              editedText: matchingRow.edited_text,
              lastModified: new Date()
            };
          }
          return element;
        });
      
        setEditingElements(updatedElements);
        setHasChanges(true);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        alert('Error parsing CSV file. Please check the format and try again.');
      }
    };
    reader.readAsText(file);
  };

  const exportCurrentState = () => {
    const csvData = editingElements.map(element => ({
      id: element.id,
      original_text: element.originalText,
      edited_text: element.editedText || '',
      frame_name: element.frameName,
      component_path: element.componentPath,
      component_type: element.componentType || 'unknown',
      screen_section: element.screenSection || 'unknown',
      hierarchy: element.hierarchy || '',
      priority: element.priority || 'medium',
      is_interactive: element.isInteractive ? 'Yes' : 'No',
      font_size: element.fontSize || '',
      font_weight: element.fontWeight || '',
      nearby_elements: element.nearbyElements?.join('; ') || '',
      element_role: element.elementRole || '',
      extraction_confidence: element.extractionMetadata?.confidence || '',
      extraction_source: element.extractionMetadata?.source || '',
      context_notes: element.contextNotes || '',
      image: element.image || ''
    }));

    const csvContent = CSVParser.stringify(csvData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'edited_text_elements.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const changedElementsCount = editingElements.filter(el => el.editedText && el.editedText !== el.originalText).length;

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Edit Text Content</h2>
        <p className="text-lg text-slate-600 mb-6">
          Review and edit text elements. Changes are highlighted and tracked.
        </p>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={() => setShowImages(!showImages)}
                className="inline-flex items-center px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {showImages ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showImages ? 'Hide Images' : 'Show Images'}
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="file"
                accept=".csv"
                onChange={handleImportSpreadsheet}
                className="hidden"
                id="import-spreadsheet"
              />
              <label
                htmlFor="import-spreadsheet"
                className="inline-flex items-center px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </label>
              
              <button
                onClick={exportCurrentState}
                className="inline-flex items-center px-3 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Current
              </button>
              
              {hasChanges && (
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes ({changedElementsCount})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">ID</th>
                {showImages && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Preview</th>
                )}
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Original Text</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Edited Text</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Context</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredElements.map((element) => {
                const hasChanges = element.editedText && element.editedText !== element.originalText;
                const isEmpty = !element.editedText;
                
                return (
                  <tr key={element.id} className={`hover:bg-slate-50 transition-colors ${
                    hasChanges ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                  }`}>
                    <td className="px-4 py-4">
                      <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono">
                        {element.id}
                      </code>
                    </td>
                    {showImages && (
                      <td className="px-4 py-4">
                        {element.image && (
                          <div className="w-24 h-20 rounded overflow-hidden bg-slate-100 border border-slate-200">
                            <img
                              src={element.image}
                              alt={`Preview of ${element.originalText}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="max-w-xs">
                        <p className="text-sm text-slate-900 line-clamp-3">
                          {element.originalText}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {element.originalText.length} characters
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <textarea
                          value={element.editedText || ''}
                          onChange={(e) => handleTextChange(element.id, e.target.value)}
                          placeholder="Enter edited text..."
                          className={`w-full min-w-64 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            hasChanges 
                              ? 'border-yellow-300 bg-yellow-50' 
                              : isEmpty 
                              ? 'border-slate-300 bg-slate-50' 
                              : 'border-green-300 bg-green-50'
                          }`}
                          rows={3}
                        />
                        <Edit3 className="absolute top-2 right-2 w-4 h-4 text-slate-400" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-slate-600">{element.frameName}</p>
                          {element.componentType && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              element.componentType === 'button' ? 'bg-blue-100 text-blue-700' :
                              element.componentType === 'heading' ? 'bg-purple-100 text-purple-700' :
                              element.componentType === 'navigation' ? 'bg-green-100 text-green-700' :
                              element.componentType === 'form' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {element.componentType}
                            </span>
                          )}
                          {element.priority && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              element.priority === 'high' ? 'bg-red-100 text-red-700' :
                              element.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {element.priority}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-slate-500 font-mono truncate">{element.componentPath}</p>
                        
                        {element.hierarchy && (
                          <p className="text-xs text-slate-400 truncate" title={element.hierarchy}>
                            📍 {element.hierarchy}
                          </p>
                        )}
                        
                        {element.screenSection && (
                          <p className="text-xs text-slate-500">
                            📱 {element.screenSection} 
                            {element.isInteractive && (
                              <span className="text-blue-600 ml-1">⚡ interactive</span>
                            )}
                          </p>
                        )}
                        
                        {element.nearbyElements && element.nearbyElements.length > 0 && (
                          <p className="text-xs text-slate-400 truncate" title={element.nearbyElements.join(', ')}>
                            👥 Near: {element.nearbyElements.slice(0, 2).join(', ')}
                            {element.nearbyElements.length > 2 && '...'}
                          </p>
                        )}
                        
                        {element.fontSize && (
                          <p className="text-xs text-slate-400">
                            🎨 {element.fontSize}px
                            {element.fontWeight && ` ${element.fontWeight}`}
                          </p>
                        )}
                        
                        {element.contextNotes && (
                          <p className="text-xs text-slate-500 mt-1 italic">{element.contextNotes}</p>
                        )}
                        
                        {element.extractionMetadata && (
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            📊 {element.extractionMetadata.source} 
                            <span className={`inline-block w-2 h-2 rounded-full ${
                              (element.extractionMetadata.confidence || 0) > 0.8 ? 'bg-green-400' :
                              (element.extractionMetadata.confidence || 0) > 0.6 ? 'bg-yellow-400' :
                              'bg-red-400'
                            }`} title={`Confidence: ${((element.extractionMetadata.confidence || 0) * 100).toFixed(0)}%`}></span>
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        hasChanges
                          ? 'bg-yellow-100 text-yellow-800'
                          : isEmpty
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {hasChanges ? 'Modified' : isEmpty ? 'Empty' : 'Ready'}
                      </span>
                      {element.lastModified && (
                        <p className="text-xs text-slate-500 mt-1">
                          {element.lastModified.toLocaleTimeString()}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredElements.length === 0 && (
        <div className="text-center py-12">
          <Edit3 className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600">No text elements match your search criteria</p>
        </div>
      )}

      {/* Summary */}
      <div className="mt-8 bg-slate-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Edit Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-2xl font-bold text-slate-900">{editingElements.length}</p>
            <p className="text-sm text-slate-600">Total Elements</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{changedElementsCount}</p>
            <p className="text-sm text-slate-600">Modified Elements</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-2xl font-bold text-slate-400">
              {editingElements.filter(el => !el.editedText).length}
            </p>
            <p className="text-sm text-slate-600">Pending Elements</p>
          </div>
        </div>
      </div>
    </div>
  );
};
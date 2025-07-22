import React, { useState } from 'react';
import { Check, X, ArrowRight, Eye, FileText, Upload } from 'lucide-react';
import { DiffItem, TextElement } from '../types';

interface DiffViewerProps {
  originalElements: TextElement[];
  editedElements: TextElement[];
  onApplyChanges: (changes: DiffItem[]) => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  originalElements,
  editedElements,
  onApplyChanges
}) => {
  const [selectedChanges, setSelectedChanges] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'all' | 'modified' | 'unchanged'>('all');

  // Generate diff items
  const diffItems: DiffItem[] = originalElements.map(original => {
    const edited = editedElements.find(e => e.id === original.id);
    const editedText = edited?.editedText || '';
    
    return {
      id: original.id,
      originalText: original.originalText,
      editedText,
      frameName: original.frameName,
      componentPath: original.componentPath,
      changeType: editedText && editedText !== original.originalText ? 'modified' : 'unchanged'
    };
  });

  const modifiedItems = diffItems.filter(item => item.changeType === 'modified');
  const unchangedItems = diffItems.filter(item => item.changeType === 'unchanged');

  const filteredItems = viewMode === 'all' 
    ? diffItems 
    : viewMode === 'modified' 
    ? modifiedItems 
    : unchangedItems;

  const toggleChangeSelection = (itemId: string) => {
    const newSelection = new Set(selectedChanges);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedChanges(newSelection);
  };

  const selectAllModified = () => {
    setSelectedChanges(new Set(modifiedItems.map(item => item.id)));
  };

  const handleApplyChanges = () => {
    const changesToApply = diffItems.filter(item => 
      selectedChanges.has(item.id) && item.changeType === 'modified'
    );
    onApplyChanges(changesToApply);
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Review Changes</h2>
        <p className="text-lg text-slate-600 mb-6">
          Compare original and edited text before applying changes to your prototype
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-blue-900">{diffItems.length}</p>
                <p className="text-sm text-blue-600">Total Elements</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-green-900">{modifiedItems.length}</p>
                <p className="text-sm text-green-600">Modified Elements</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="flex items-center">
              <X className="w-8 h-8 text-slate-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{unchangedItems.length}</p>
                <p className="text-sm text-slate-600">Unchanged Elements</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              {/* View Mode Filter */}
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-slate-700">View:</label>
                <select
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as 'all' | 'modified' | 'unchanged')}
                  className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="all">All Elements ({diffItems.length})</option>
                  <option value="modified">Modified Only ({modifiedItems.length})</option>
                  <option value="unchanged">Unchanged Only ({unchangedItems.length})</option>
                </select>
              </div>
              
              <button
                onClick={selectAllModified}
                className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Select All Modified
              </button>
            </div>
            
            <button
              onClick={handleApplyChanges}
              disabled={selectedChanges.size === 0}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4 mr-2" />
              Apply {selectedChanges.size} Changes
            </button>
          </div>
        </div>
      </div>

      {/* Diff Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedChanges.size === modifiedItems.length && modifiedItems.length > 0}
                    onChange={selectAllModified}
                    className="text-blue-600"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Original Text</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Edited Text</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredItems.map((item) => {
                const isModified = item.changeType === 'modified';
                const isSelected = selectedChanges.has(item.id);
                
                return (
                  <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${
                    isModified ? 'bg-green-50 border-l-4 border-green-400' : ''
                  }`}>
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleChangeSelection(item.id)}
                        disabled={!isModified}
                        className="text-blue-600 disabled:opacity-30"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isModified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isModified ? 'Modified' : 'Unchanged'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-sm">
                        <p className={`text-sm p-2 rounded ${
                          isModified ? 'bg-red-50 text-red-900 line-through' : 'text-slate-900'
                        }`}>
                          {item.originalText}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-sm">
                        {isModified ? (
                          <div className="flex items-start space-x-2">
                            <ArrowRight className="w-4 h-4 text-slate-400 mt-1 flex-shrink-0" />
                            <p className="text-sm bg-green-50 text-green-900 p-2 rounded">
                              {item.editedText}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500 italic">No changes</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-slate-900">{item.frameName}</p>
                        <p className="text-xs text-slate-500 font-mono truncate max-w-xs">
                          {item.componentPath}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">ID: {item.id}</p>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Eye className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <p className="text-slate-600">No items to display for the current filter</p>
        </div>
      )}

      {/* Help Text */}
      {modifiedItems.length === 0 && (
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <FileText className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="text-lg font-medium text-blue-900 mb-2">No Changes Detected</h4>
              <p className="text-blue-700">
                It looks like no text modifications were made in your spreadsheet. Make sure to:
              </p>
              <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                <li>Fill in the "edited_text" column in your spreadsheet</li>
                <li>Make sure your changes are saved in the CSV file</li>
                <li>Re-import the updated spreadsheet in the previous step</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { Download, FileSpreadsheet, Eye, Search, Image, Archive } from 'lucide-react';
import { Prototype, TextElement } from '../types';
import { CSVParser } from '../utils/csvParser';

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

  const filteredElements = prototype.textElements.filter(element =>
    element.originalText.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.frameName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.componentPath.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateCSV = () => {
    console.log('=== CSV Generation Debug ===');
    console.log('prototype.textElements:', prototype.textElements);
    console.log('selectedElements Set:', selectedElements);
    
    const selectedTextElements = prototype.textElements.filter(el => 
      selectedElements.has(el.id)
    );
    
    console.log('Filtered selected elements:', selectedTextElements);
    console.log('Generating CSV for', selectedTextElements.length, 'elements');
    
    if (selectedTextElements.length === 0) {
      console.warn('No elements selected for CSV generation');
      console.log('Available element IDs:', prototype.textElements.map(el => el.id));
      console.log('Selected IDs:', Array.from(selectedElements));
      return '';
    }
    
    const csvData = selectedTextElements.map((element, index) => {
      // Ensure each element has a screenshot
      const screenshot = element.image || generateElementScreenshot(element, index);
      
      return {
        id: element.id,
        original_text: element.originalText,
        edited_text: '', // Empty for writers to fill
        frame_name: element.frameName,
        component_path: element.componentPath,
        component_type: element.componentType || 'unknown',
        screen_section: element.screenSection || 'unknown',
        hierarchy: element.hierarchy || '',
        priority: element.priority || 'medium',
        is_interactive: element.isInteractive ? 'Yes' : 'No',
        font_size: element.fontSize?.toString() || '',
        font_weight: element.fontWeight || '',
        nearby_elements: element.nearbyElements?.join('; ') || '',
        element_role: element.elementRole || '',
        extraction_confidence: element.extractionMetadata?.confidence?.toString() || '',
        extraction_source: element.extractionMetadata?.source || '',
        bounding_box: `${element.boundingBox.x},${element.boundingBox.y},${element.boundingBox.width},${element.boundingBox.height}`,
        context_notes: element.contextNotes || '',
        screenshot_url: screenshot.substring(0, 50) + '...', // Truncate for CSV readability
        screenshot_filename: `${element.id}_screenshot.png`
      };
    });

    try {
      const csvString = CSVParser.stringify(csvData);
      console.log('CSV generated successfully, length:', csvString.length);
      return csvString;
    } catch (error) {
      console.error('Error generating CSV:', error);
      return '';
    }
  };

  // Generate a screenshot for elements that don't have one
  const generateElementScreenshot = (element: TextElement, index: number): string => {
    try {
      console.log(`Generating screenshot for element ${element.id}:`, element);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('Could not get canvas context');
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent pixel
      }
      
      const width = Math.max(300, (element.boundingBox?.width || 200) + 40);
      const height = Math.max(150, (element.boundingBox?.height || 50) + 80);
      
      canvas.width = width;
      canvas.height = height;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Component type indicator
    const typeColor = element.componentType === 'button' ? '#3b82f6' :
                     element.componentType === 'heading' ? '#8b5cf6' :
                     element.componentType === 'navigation' ? '#10b981' :
                     element.componentType === 'form' ? '#f59e0b' :
                     '#6b7280';
    
    ctx.fillStyle = typeColor;
    ctx.fillRect(10, 10, 280, 6);
    
    // Frame name
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(element.frameName, 10, 35);
    
    // Component type badge
    ctx.fillStyle = typeColor;
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillText(element.componentType || 'unknown', 10, 55);
    
    // Text content (wrapped)
    ctx.fillStyle = '#374151';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
    const words = element.originalText.split(' ');
    let line = '';
    let y = 80;
    const maxWidth = canvas.width - 20;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, 10, y);
        line = word + ' ';
        y += 20;
      } else {
        line = testLine;
      }
      
      if (y > canvas.height - 20) break; // Don't overflow
    }
    ctx.fillText(line, 10, y);
    
      // Priority indicator
      if (element.priority) {
        const priorityColor = element.priority === 'high' ? '#ef4444' :
                             element.priority === 'medium' ? '#f59e0b' : '#6b7280';
        ctx.fillStyle = priorityColor;
        ctx.fillRect(canvas.width - 30, 10, 20, 6);
      }
      
      const dataUrl = canvas.toDataURL('image/png');
      console.log(`Screenshot generated for ${element.id}, length: ${dataUrl.length}`);
      return dataUrl;
      
    } catch (error) {
      console.error(`Error generating screenshot for element ${element.id}:`, error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 transparent pixel fallback
    }
  };

  const handleExport = () => {
    console.log('=== CSV Export Debug Info ===');
    console.log('Selected elements count:', selectedElements.size);
    console.log('Total elements count:', prototype.textElements.length);
    console.log('Prototype name:', prototype.name);
    
    try {
      // First, ensure we have selected elements
      if (selectedElements.size === 0) {
        console.log('No elements selected, selecting all elements...');
        const allElementIds = new Set(prototype.textElements.map(el => el.id));
        setSelectedElements(allElementIds);
        
        // Give React time to update state and try again
        setTimeout(() => {
          handleExport();
        }, 100);
        return;
      }
      
      const csvContent = generateCSV();
      console.log('CSV content generated, length:', csvContent.length);
      console.log('CSV preview (first 200 chars):', csvContent.substring(0, 200));
      
      if (!csvContent || csvContent.trim() === '') {
        console.error('Empty CSV content generated');
        alert('No data to export. The prototype may not have any text elements.');
        return;
      }
      
      // Try multiple download methods for better browser compatibility
      
      // Method 1: Standard blob download
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        console.log('Blob created, size:', blob.size, 'type:', blob.type);
        
        // Check if browser supports createObjectURL
        if (window.URL && window.URL.createObjectURL) {
          const url = URL.createObjectURL(blob);
          console.log('Object URL created:', url.substring(0, 50) + '...');
          
          const link = document.createElement('a');
          const filename = `${prototype.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_text_elements.csv`;
          console.log('Download filename:', filename);
          
          link.href = url;
          link.download = filename;
          link.style.display = 'none';
          
          document.body.appendChild(link);
          console.log('Link added to DOM, triggering click...');
          
          link.click();
          console.log('Link clicked');
          
          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            console.log('Cleanup completed');
          }, 100);
          
          alert('CSV download should have started! Check your downloads folder.');
          onExportComplete();
          return;
        }
      } catch (blobError) {
        console.error('Blob download method failed:', blobError);
      }
      
      // Method 2: Data URI fallback
      try {
        console.log('Trying data URI method...');
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const link = document.createElement('a');
        const filename = `${prototype.name.replace(/[^a-zA-Z0-9\s]/g, '_')}_text_elements.csv`;
        
        link.href = dataUri;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('Data URI download triggered');
        alert('CSV download initiated using fallback method!');
        onExportComplete();
        return;
      } catch (dataUriError) {
        console.error('Data URI download method failed:', dataUriError);
      }
      
      // Method 3: Copy to clipboard as last resort
      try {
        console.log('Trying clipboard method...');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(csvContent).then(() => {
            alert('Download failed, but CSV data has been copied to your clipboard. You can paste it into a text editor and save as .csv');
            onExportComplete();
          });
          return;
        }
      } catch (clipboardError) {
        console.error('Clipboard method failed:', clipboardError);
      }
      
      // If all methods fail, show the data in a new window
      console.log('All download methods failed, opening in new window...');
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write('<pre>' + csvContent + '</pre>');
        newWindow.document.title = 'CSV Data - Copy and Save';
        alert('Download failed. The CSV data is displayed in a new window. Please copy it and save as a .csv file.');
      } else {
        alert('Download failed and popup was blocked. Please check your browser settings and try again.');
      }
      
    } catch (error) {
      console.error('Export error details:', error);
      console.error('Error stack:', error.stack);
      alert(`Failed to export CSV: ${error.message}. Please try refreshing the page and trying again.`);
    }
  };

  const handleScreenshotsDownload = () => {
    try {
      const selectedTextElements = prototype.textElements.filter(el => 
        selectedElements.has(el.id)
      );
      
      selectedTextElements.forEach((element, index) => {
        const screenshot = element.image || generateElementScreenshot(element, index);
        
        // Convert data URL to blob
        const byteCharacters = atob(screenshot.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });
        
        // Download individual screenshot
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `${element.id}_${element.componentType}_screenshot.png`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      });
      
      alert(`Downloaded ${selectedTextElements.length} screenshots successfully!`);
    } catch (error) {
      console.error('Screenshots download error:', error);
      alert('Failed to download screenshots. Please try again.');
    }
  };

  const handleExportWithScreenshots = async () => {
    try {
      // First download the CSV
      handleExport();
      
      // Then download screenshots after a short delay
      setTimeout(() => {
        handleScreenshotsDownload();
      }, 1000);
    } catch (error) {
      console.error('Export with screenshots error:', error);
      alert('Failed to export with screenshots. Please try again.');
    }
  };

  // Simple test function to debug CSV generation
  const testCSVGeneration = () => {
    console.log('=== Testing CSV Generation ===');
    try {
      // Select all elements for testing
      const allElementIds = new Set(prototype.textElements.map(el => el.id));
      setSelectedElements(allElementIds);
      
      setTimeout(() => {
        console.log('Selected elements after setting:', selectedElements.size);
        const testCSV = generateCSV();
        console.log('Test CSV generated:', testCSV ? 'SUCCESS' : 'FAILED');
        console.log('CSV length:', testCSV.length);
        if (testCSV) {
          const lines = testCSV.split('\n');
          console.log('CSV has', lines.length, 'lines');
          console.log('Header:', lines[0]);
          if (lines[1]) console.log('First row:', lines[1]);
        }
      }, 100);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
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
        <p className="text-lg text-slate-600 mb-6">
          Review and export text elements from <span className="font-semibold">{prototype.name}</span>
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
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV ({selectedElements.size || 'All'})
              </button>
              
              <button
                onClick={handleScreenshotsDownload}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Image className="w-4 h-4 mr-2" />
                Screenshots ({selectedElements.size || 'All'})
              </button>
              
              <button
                onClick={handleExportWithScreenshots}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Archive className="w-4 h-4 mr-2" />
                CSV + Screenshots
              </button>
            </div>
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
    </div>
  );
};
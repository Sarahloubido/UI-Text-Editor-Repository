import React, { useState } from 'react';
import { PrototypeTextExtractor } from '../utils/textExtractor';
import { CSVParser } from '../utils/csvParser';
import { DownloadTroubleshooter } from './DownloadTroubleshooter';

export const DebugTest: React.FC = () => {
  const [results, setResults] = useState<string>('');
  const [extractor] = useState(() => new PrototypeTextExtractor());

  const testBasicCSV = () => {
    const testData = [
      {
        id: 'test1',
        original_text: 'Hello World',
        edited_text: '',
        frame_name: 'Main Page',
        component_path: 'Header/Title'
      }
    ];
    
    const csv = CSVParser.stringify(testData);
    setResults(prev => prev + '\n=== CSV Test ===\n' + csv);
    console.log('CSV Test:', csv);
  };

  const testHTMLExtraction = async () => {
    const testHTML = `
      <html>
        <body>
          <h1>Welcome to the App</h1>
          <p>This is a test paragraph.</p>
          <button>Click Me</button>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </body>
      </html>
    `;
    
    const blob = new Blob([testHTML], { type: 'text/html' });
    const file = new File([blob], 'test.html', { type: 'text/html' });
    
    try {
      console.log('Testing HTML extraction...');
      const extractedData = await extractor.extractFromFile(file);
      console.log('Extraction result:', extractedData);
      
      setResults(prev => prev + '\n=== HTML Extraction Test ===\n' + 
        `Found ${extractedData.textElements.length} text elements:\n` +
        extractedData.textElements.map(el => `- ${el.originalText}`).join('\n')
      );
    } catch (error) {
      console.error('Extraction error:', error);
      setResults(prev => prev + '\n=== HTML Extraction Error ===\n' + error);
    }
  };

  const testDirectExtraction = () => {
    const testHTML = `
      <html>
        <body>
          <h1>Welcome to the App</h1>
          <p>This is a test paragraph.</p>
          <button>Click Me</button>
          <nav>
            <a href="/">Home</a>
            <a href="/about">About</a>
          </nav>
        </body>
      </html>
    `;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(testHTML, 'text/html');
    
    const elements = doc.querySelectorAll('h1, p, button, a');
    const extractedTexts: string[] = [];
    
    elements.forEach(element => {
      const text = element.textContent?.trim();
      if (text && text.length > 0) {
        extractedTexts.push(`${element.tagName}: "${text}"`);
      }
    });
    
    setResults(prev => prev + '\n=== Direct DOM Extraction ===\n' + 
      extractedTexts.join('\n')
    );
  };

  const downloadTestCSV = async () => {
    const testData = [
      {
        id: 'elem_1',
        original_text: 'Welcome to the App',
        edited_text: '',
        frame_name: 'Test Page',
        component_path: 'Header/Title',
        component_type: 'heading',
        screen_section: 'header',
        hierarchy: 'Test Page > Header > Title',
        priority: 'high',
        is_interactive: 'No',
        font_size: '24',
        font_weight: 'bold',
        nearby_elements: '',
        element_role: '',
        extraction_confidence: '0.9',
        extraction_source: 'html',
        context_notes: 'Main page title',
        image: ''
      }
    ];
    
    const csv = CSVParser.stringify(testData);
    
    try {
      // Enhanced download with multiple fallbacks
      console.log('Testing download with enhanced method...');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'debug-test.csv';
      
      // Add to document and force click
      document.body.appendChild(link);
      link.click();
      
      // Clean up after short delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      setResults(prev => prev + '\n=== CSV Download Test ===\nDownload initiated successfully!');
      console.log('Download test completed successfully');
      
    } catch (error) {
      console.error('Download test failed:', error);
      
      try {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(csv);
        setResults(prev => prev + '\n=== CSV Download Test ===\nDownload failed, but CSV copied to clipboard!');
      } catch (clipboardError) {
        setResults(prev => prev + '\n=== CSV Download Test ===\nDownload failed: ' + error.message);
      }
    }
  };

  const clearResults = () => setResults('');

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="text-2xl font-bold mb-6">Debug Export Functionality</h2>
      
      <DownloadTroubleshooter />
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={testBasicCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test CSV Generation
        </button>
        
        <button
          onClick={testHTMLExtraction}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test HTML Extraction
        </button>
        
        <button
          onClick={testDirectExtraction}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          Test Direct DOM
        </button>
        
        <button
          onClick={downloadTestCSV}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Test CSV Download
        </button>
      </div>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>
      
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Test Results:</h3>
        <pre className="whitespace-pre-wrap text-sm">{results || 'Click a test button to see results...'}</pre>
      </div>
    </div>
  );
};
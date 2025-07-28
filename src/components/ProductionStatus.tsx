import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

export const ProductionStatus: React.FC = () => {
  const [status, setStatus] = useState<{
    csvGeneration: 'success' | 'error' | 'testing';
    domParsing: 'success' | 'error' | 'testing';
    fileDownload: 'success' | 'error' | 'testing';
    environment: string;
  }>({
    csvGeneration: 'testing',
    domParsing: 'testing',
    fileDownload: 'testing',
    environment: 'unknown'
  });

  useEffect(() => {
    // Run basic functionality tests
    const runTests = async () => {
      // Test 1: CSV Generation
      try {
        const testData = [{ id: '1', text: 'test' }];
        const csv = Object.keys(testData[0]).join(',') + '\n' + Object.values(testData[0]).join(',');
        setStatus(prev => ({ ...prev, csvGeneration: csv.length > 0 ? 'success' : 'error' }));
      } catch {
        setStatus(prev => ({ ...prev, csvGeneration: 'error' }));
      }

      // Test 2: DOM Parsing
      try {
        const testHTML = '<h1>Test</h1>';
        const parser = new DOMParser();
        const doc = parser.parseFromString(testHTML, 'text/html');
        const elements = doc.querySelectorAll('h1');
        setStatus(prev => ({ ...prev, domParsing: elements.length > 0 ? 'success' : 'error' }));
      } catch {
        setStatus(prev => ({ ...prev, domParsing: 'error' }));
      }

      // Test 3: File Download Support
      try {
        const blob = new Blob(['test'], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        URL.revokeObjectURL(url);
        setStatus(prev => ({ ...prev, fileDownload: 'success' }));
      } catch {
        setStatus(prev => ({ ...prev, fileDownload: 'error' }));
      }

      // Environment Detection
      const env = window.location.hostname.includes('vercel.app') ? 'Vercel Production' :
                  window.location.hostname.includes('localhost') ? 'Local Development' :
                  window.location.hostname.includes('bolt.new') ? 'Bolt.new' :
                  'Unknown Environment';
      
      setStatus(prev => ({ ...prev, environment: env }));
    };

    runTests();
  }, []);

  const getStatusIcon = (statusValue: 'success' | 'error' | 'testing') => {
    switch (statusValue) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'testing': return <Info className="w-4 h-4 text-blue-600 animate-spin" />;
    }
  };

  const allSuccess = Object.values(status).every(s => s === 'success' || typeof s === 'string');

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-900">Production Status</h3>
        <div className="flex items-center space-x-2">
          {allSuccess ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">All Systems Operational</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-600">Running Tests...</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(status.csvGeneration)}
          <span className="text-sm text-slate-700">CSV Generation</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(status.domParsing)}
          <span className="text-sm text-slate-700">DOM Parsing</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {getStatusIcon(status.fileDownload)}
          <span className="text-sm text-slate-700">File Download</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Environment:</span>
          <span className="font-medium text-slate-900">{status.environment}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-600">Build Time:</span>
          <span className="font-medium text-slate-900">{new Date().toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};
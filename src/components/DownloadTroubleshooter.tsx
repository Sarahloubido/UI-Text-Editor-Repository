import React, { useState } from 'react';
import { Download, Copy, ExternalLink, AlertTriangle } from 'lucide-react';

export const DownloadTroubleshooter: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTestingDownload, setIsTestingDownload] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testDownloadMethod1 = async () => {
    addResult('🔄 Testing Method 1: Standard blob download...');
    try {
      const testContent = 'id,text,frame\ntest1,Hello World,Main Page\ntest2,Sample Text,Secondary Page';
      const blob = new Blob([testContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-method1.csv';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      addResult('✅ Method 1: Download initiated successfully');
    } catch (error) {
      addResult(`❌ Method 1: Failed - ${error}`);
    }
  };

  const testDownloadMethod2 = async () => {
    addResult('🔄 Testing Method 2: Force click with event...');
    try {
      const testContent = 'id,text,frame\ntest1,Hello World,Main Page\ntest2,Sample Text,Secondary Page';
      const blob = new Blob([testContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = 'test-method2.csv';
      
      // Force event creation
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      
      document.body.appendChild(link);
      link.dispatchEvent(event);
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      addResult('✅ Method 2: Download initiated with forced event');
    } catch (error) {
      addResult(`❌ Method 2: Failed - ${error}`);
    }
  };

  const testClipboardMethod = async () => {
    addResult('🔄 Testing Method 3: Clipboard fallback...');
    try {
      const testContent = 'id,text,frame\ntest1,Hello World,Main Page\ntest2,Sample Text,Secondary Page';
      await navigator.clipboard.writeText(testContent);
      addResult('✅ Method 3: Content copied to clipboard successfully');
    } catch (error) {
      addResult(`❌ Method 3: Clipboard failed - ${error}`);
    }
  };

  const testNewWindowMethod = () => {
    addResult('🔄 Testing Method 4: New window fallback...');
    try {
      const testContent = 'id,text,frame\ntest1,Hello World,Main Page\ntest2,Sample Text,Secondary Page';
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head><title>CSV Export</title></head>
            <body>
              <h2>CSV Export Content</h2>
              <p>Copy the content below and save as .csv file:</p>
              <textarea style="width: 100%; height: 300px; font-family: monospace;">${testContent}</textarea>
              <br><br>
              <button onclick="
                const textarea = document.querySelector('textarea');
                textarea.select();
                document.execCommand('copy');
                alert('Content copied to clipboard!');
              ">Copy to Clipboard</button>
            </body>
          </html>
        `);
        addResult('✅ Method 4: New window opened successfully');
      } else {
        addResult('❌ Method 4: Pop-up blocked or failed');
      }
    } catch (error) {
      addResult(`❌ Method 4: Failed - ${error}`);
    }
  };

  const runAllTests = async () => {
    setIsTestingDownload(true);
    clearResults();
    
    addResult(`🌐 Environment: ${window.location.hostname}`);
    addResult(`🖥️ User Agent: ${navigator.userAgent.split(' ').slice(-2).join(' ')}`);
    addResult(`📱 Platform: ${navigator.platform}`);
    addResult('');
    
    await testDownloadMethod1();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testDownloadMethod2();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testClipboardMethod();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    testNewWindowMethod();
    
    setIsTestingDownload(false);
    addResult('');
    addResult('🏁 All download tests completed!');
  };

  const getEnvironmentInfo = () => {
    const isVercel = window.location.hostname.includes('vercel.app');
    const isBolt = window.location.hostname.includes('bolt.new');
    const isLocalhost = window.location.hostname.includes('localhost');
    
    if (isVercel) return { env: 'Vercel', color: 'text-blue-600', icon: '🌐' };
    if (isBolt) return { env: 'Bolt.new', color: 'text-purple-600', icon: '⚡' };
    if (isLocalhost) return { env: 'Local Dev', color: 'text-green-600', icon: '💻' };
    return { env: 'Unknown', color: 'text-gray-600', icon: '❓' };
  };

  const envInfo = getEnvironmentInfo();

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Download Troubleshooter
        </h3>
        <div className={`flex items-center space-x-2 ${envInfo.color}`}>
          <span>{envInfo.icon}</span>
          <span className="text-sm font-medium">{envInfo.env}</span>
        </div>
      </div>

      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <div className="flex">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Download Issues?</p>
            <p>This tool tests multiple download methods to identify what works in your environment.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <button
          onClick={testDownloadMethod1}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          disabled={isTestingDownload}
        >
          Test Method 1
        </button>
        
        <button
          onClick={testDownloadMethod2}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
          disabled={isTestingDownload}
        >
          Test Method 2
        </button>
        
        <button
          onClick={testClipboardMethod}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
          disabled={isTestingDownload}
        >
          Test Clipboard
        </button>
        
        <button
          onClick={testNewWindowMethod}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm"
          disabled={isTestingDownload}
        >
          Test New Window
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={runAllTests}
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center"
          disabled={isTestingDownload}
        >
          {isTestingDownload ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Testing...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Run All Tests
            </>
          )}
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
        <h4 className="font-medium mb-2">Test Results:</h4>
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-sm">No tests run yet. Click "Run All Tests" to start.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-gray-600">
        <p><strong>Expected behavior:</strong> At least one download method should work. If all fail, use clipboard or new window methods.</p>
      </div>
    </div>
  );
};
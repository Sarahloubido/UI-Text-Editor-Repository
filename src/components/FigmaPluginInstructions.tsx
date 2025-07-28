import React from 'react';
import { ExternalLink, Download, Play, CheckCircle } from 'lucide-react';

export const FigmaPluginInstructions: React.FC = () => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-4">
      <h4 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
        📚 How to Install & Use Your Figma Plugin
      </h4>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            1
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Download Plugin Files</h5>
            <p className="text-blue-800 text-sm">
              Click "Generate Figma Plugin" to download 3 files: <code className="bg-blue-100 px-1 rounded">manifest.json</code>, 
              <code className="bg-blue-100 px-1 rounded">code.js</code>, and <code className="bg-blue-100 px-1 rounded">ui.html</code>
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            2
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Open Figma</h5>
            <p className="text-blue-800 text-sm">
              Go to your Figma file that you imported text from. Make sure you're in the right file!
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            3
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Import Plugin</h5>
            <p className="text-blue-800 text-sm mb-2">
              In Figma, go to: <strong>Plugins → Development → Import plugin from manifest...</strong>
            </p>
            <p className="text-blue-800 text-sm">
              Select the <code className="bg-blue-100 px-1 rounded">manifest.json</code> file you downloaded.
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
            4
          </div>
          <div>
            <h5 className="font-medium text-blue-900 mb-1">Run Plugin</h5>
            <p className="text-blue-800 text-sm">
              The plugin will appear in your Plugins menu. Click it to run and apply all your text changes at once!
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
          <div>
            <h5 className="font-medium text-green-900 mb-1">See Your Changes!</h5>
            <p className="text-green-800 text-sm">
              Your text changes will be applied directly to your Figma file. You'll see the updates immediately in your design!
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white border border-blue-200 rounded-lg">
        <h5 className="font-medium text-slate-900 mb-2">💡 Tips:</h5>
        <ul className="text-sm text-slate-700 space-y-1">
          <li>• Make sure you're in the same Figma file you imported from</li>
          <li>• The plugin will automatically find and update matching text</li>
          <li>• You can run the plugin multiple times if needed</li>
          <li>• Changes are applied permanently to your Figma file</li>
        </ul>
      </div>

      <div className="mt-4 flex items-center space-x-2 text-sm text-blue-700">
        <ExternalLink className="w-4 h-4" />
        <a 
          href="https://help.figma.com/hc/en-us/articles/360042735534-Import-plugins-for-development" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline hover:text-blue-900"
        >
          Figma Plugin Import Documentation
        </a>
      </div>
    </div>
  );
};
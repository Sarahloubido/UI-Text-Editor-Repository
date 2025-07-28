import React, { useState } from 'react';
import { X, Key, ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';
import { FigmaIntegration } from '../utils/figmaIntegration';

interface FigmaAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSubmit: (token: string) => void;
  figmaFileId: string;
}

export const FigmaAuthModal: React.FC<FigmaAuthModalProps> = ({
  isOpen,
  onClose,
  onTokenSubmit,
  figmaFileId
}) => {
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setValidationResult({
        isValid: false,
        message: 'Please enter a Figma token'
      });
      return;
    }

    if (!FigmaIntegration.validateFigmaToken(token)) {
      setValidationResult({
        isValid: false,
        message: 'Invalid token format. Figma tokens start with "figd_"'
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const isConnectionValid = await FigmaIntegration.testConnection(figmaFileId, token);
      
      if (isConnectionValid) {
        setValidationResult({
          isValid: true,
          message: 'Token validated successfully!'
        });
        
        // Wait a moment to show success, then submit
        setTimeout(() => {
          onTokenSubmit(token);
          setToken('');
          setValidationResult(null);
        }, 1000);
      } else {
        setValidationResult({
          isValid: false,
          message: 'Could not access Figma file. Check your token and file permissions.'
        });
      }
    } catch (error) {
      setValidationResult({
        isValid: false,
        message: 'Failed to validate token. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Key className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-slate-900">
              Connect to Figma
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-slate-900 mb-3">
              ⚠️ Figma File Editing Limitations
            </h3>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-2">Important Limitation</h4>
                  <p className="text-amber-800 text-sm mb-2">
                    The Figma REST API is <strong>read-only</strong> and cannot directly edit text in Figma files. 
                    To programmatically edit Figma files, you would need to create a Figma Plugin.
                  </p>
                  <p className="text-amber-800 text-sm">
                    This demo shows how such integration would work, but the actual text updates cannot be applied to your Figma file via the web app.
                  </p>
                </div>
              </div>
            </div>
            <p className="text-slate-600 mb-4">
              You can still use this tool to generate updated HTML/JSON files with your text changes applied.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">How to get your Figma token:</h4>
              <ol className="list-decimal list-inside text-blue-800 space-y-1 text-sm">
                <li>Go to <a href="https://figma.com/settings" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center">Figma Settings <ExternalLink className="w-3 h-3 ml-1" /></a></li>
                <li>Scroll to "Personal Access Tokens"</li>
                <li>Click "Create a new personal access token"</li>
                <li>Name it "Prototype Text Editor"</li>
                <li>Copy the token and paste it below</li>
              </ol>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-800 text-sm">
                    <strong>Security Note:</strong> Your token is only stored temporarily in your browser session 
                    and is never saved to our servers. It's used only to make direct API calls to Figma from your browser.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="figmaToken" className="block text-sm font-medium text-slate-700 mb-2">
                Figma Personal Access Token
              </label>
              <input
                id="figmaToken"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="figd_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                disabled={isValidating}
              />
              <p className="text-xs text-slate-500 mt-1">
                Figma tokens start with "figd_" and are about 40 characters long
              </p>
            </div>

            {validationResult && (
              <div className={`flex items-center space-x-2 p-3 rounded-md ${
                validationResult.isValid 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {validationResult.isValid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">{validationResult.message}</span>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                disabled={isValidating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isValidating || !token.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center space-x-2"
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Validating...</span>
                  </>
                ) : (
                  <span>Connect to Figma</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { Key, Chrome, Building2, ExternalLink, AlertCircle, CheckCircle, Info, Copy } from 'lucide-react';
import FigmaAuthenticator from '../utils/figmaAuth';
import { TextElement } from '../types';

interface FigmaAuthModalProps {
  figmaUrl: string;
  onTextExtracted: (elements: TextElement[]) => void;
  onClose: () => void;
}

type AuthMethod = 'token' | 'oauth' | 'enterprise';
type AuthStep = 'choose' | 'token-input' | 'oauth-flow' | 'enterprise-config' | 'extracting' | 'success' | 'error';

export const FigmaAuthModal: React.FC<FigmaAuthModalProps> = ({
  figmaUrl,
  onTextExtracted,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState<AuthStep>('choose');
  const [selectedMethod, setSelectedMethod] = useState<AuthMethod>('token');
  const [personalToken, setPersonalToken] = useState('');
  const [workspaceId, setWorkspaceId] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedElements, setExtractedElements] = useState<TextElement[]>([]);
  const [authStatus, setAuthStatus] = useState({ isAuthenticated: false, method: null, hasToken: false });

  const authenticator = FigmaAuthenticator.getInstance();

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      await authenticator.restoreAuthentication();
      setAuthStatus(authenticator.getAuthStatus());
    };
    checkAuth();
  }, []);

  const extractFileId = (url: string): string | null => {
    const match = url.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleTokenAuth = async () => {
    if (!personalToken.trim()) {
      setErrorMessage('Please enter your Figma personal access token');
      return;
    }

    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const success = await authenticator.authenticateWithToken(personalToken);
      if (success) {
        setAuthStatus(authenticator.getAuthStatus());
        await extractFigmaText();
      } else {
        setErrorMessage('Invalid token. Please check your Figma personal access token.');
      }
    } catch (error) {
      setErrorMessage('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleOAuthAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const success = await authenticator.authenticateWithOAuth();
      if (success) {
        setAuthStatus(authenticator.getAuthStatus());
        await extractFigmaText();
      } else {
        setErrorMessage('OAuth authentication was cancelled or failed.');
      }
    } catch (error) {
      setErrorMessage('OAuth authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleEnterpriseAuth = async () => {
    setIsAuthenticating(true);
    setErrorMessage('');

    try {
      const success = await authenticator.authenticateWithEnterprise(workspaceId);
      if (success) {
        setAuthStatus(authenticator.getAuthStatus());
        await extractFigmaText();
      } else {
        setErrorMessage('Enterprise authentication failed. Please contact your IT administrator.');
      }
    } catch (error) {
      setErrorMessage('Enterprise authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const extractFigmaText = async () => {
    const fileId = extractFileId(figmaUrl);
    if (!fileId) {
      setErrorMessage('Invalid Figma URL. Please check the URL format.');
      return;
    }

    setCurrentStep('extracting');

    try {
      const elements = await authenticator.extractTextFromFigmaFile(fileId);
      setExtractedElements(elements);
      setCurrentStep('success');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to extract text from Figma');
      setCurrentStep('error');
    }
  };

  const handleUseExtractedText = () => {
    onTextExtracted(extractedElements);
    onClose();
  };

  const copyTokenInstructions = () => {
    const instructions = `
How to get your Figma Personal Access Token:

1. Go to https://www.figma.com/settings
2. Scroll down to "Personal access tokens"
3. Click "Create a new personal access token"
4. Give it a name (e.g., "Text Extraction Tool")
5. Copy the token and paste it here

⚠️ Keep this token secure - treat it like a password!
    `;
    navigator.clipboard.writeText(instructions.trim());
    alert('Instructions copied to clipboard!');
  };

  const renderChooseMethod = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Key className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Authenticate with Figma</h3>
        <p className="text-slate-600">
          Choose how you'd like to connect to Figma to extract real text from your designs.
        </p>
      </div>

      {authStatus.isAuthenticated && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <h4 className="font-medium text-green-900">Already Authenticated</h4>
              <p className="text-sm text-green-800">
                You're logged in via {authStatus.method}. Click "Extract Text" to continue.
              </p>
            </div>
          </div>
          <button
            onClick={extractFigmaText}
            className="mt-3 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            Extract Text Now
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {/* Personal Access Token */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'token' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setSelectedMethod('token')}
        >
          <div className="flex items-start">
            <Key className="w-5 h-5 text-blue-600 mt-1 mr-3" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">Personal Access Token</h4>
              <p className="text-sm text-slate-600 mb-2">
                Use your personal Figma token. Works with any Figma account.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Most Reliable</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Works Everywhere</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">✓ Your Files Only</span>
              </div>
            </div>
          </div>
        </div>

        {/* OAuth 2.0 */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'oauth' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setSelectedMethod('oauth')}
        >
          <div className="flex items-start">
            <Chrome className="w-5 h-5 text-blue-600 mt-1 mr-3" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">Browser Authentication (OAuth)</h4>
              <p className="text-sm text-slate-600 mb-2">
                Sign in through your browser using your existing Figma account.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Secure</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ No Token Needed</span>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">⚠️ Requires Setup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise/Pendo */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            selectedMethod === 'enterprise' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
          }`}
          onClick={() => setSelectedMethod('enterprise')}
        >
          <div className="flex items-start">
            <Building2 className="w-5 h-5 text-blue-600 mt-1 mr-3" />
            <div className="flex-1">
              <h4 className="font-medium text-slate-900 mb-1">Pendo Enterprise Authentication</h4>
              <p className="text-sm text-slate-600 mb-2">
                Use your Pendo network credentials to access Figma files.
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">✓ SSO Integration</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">✓ Team Access</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">✓ Network Files</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => {
            if (selectedMethod === 'token') setCurrentStep('token-input');
            else if (selectedMethod === 'oauth') setCurrentStep('oauth-flow');
            else if (selectedMethod === 'enterprise') setCurrentStep('enterprise-config');
          }}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue with {selectedMethod === 'token' ? 'Token' : selectedMethod === 'oauth' ? 'OAuth' : 'Enterprise'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderTokenInput = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Enter Your Figma Token</h3>
        <p className="text-slate-600">
          Paste your personal access token from Figma to authenticate.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">How to get your token:</h4>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Go to <a href="https://www.figma.com/settings" target="_blank" rel="noopener noreferrer" className="underline">Figma Settings</a></li>
              <li>2. Scroll to "Personal access tokens"</li>
              <li>3. Click "Create a new personal access token"</li>
              <li>4. Copy and paste it below</li>
            </ol>
            <button
              onClick={copyTokenInstructions}
              className="mt-2 flex items-center text-sm text-blue-700 hover:text-blue-900"
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy instructions
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Personal Access Token
        </label>
        <input
          type="password"
          value={personalToken}
          onChange={(e) => setPersonalToken(e.target.value)}
          placeholder="figd_..."
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-slate-500">
          Your token is stored securely in your browser and never shared.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
            <p className="text-red-800">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleTokenAuth}
          disabled={!personalToken.trim() || isAuthenticating}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isAuthenticating ? 'Authenticating...' : 'Authenticate & Extract'}
        </button>
        <button
          onClick={() => setCurrentStep('choose')}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Back
        </button>
      </div>
    </div>
  );

  const renderExtracting = () => (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
        <Key className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-slate-900">Extracting Real Text</h3>
      <p className="text-slate-600">
        Connecting to Figma API and extracting all text elements from your design...
      </p>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="animate-pulse">
          <div className="font-medium text-blue-900">Processing Figma File...</div>
          <div className="text-sm text-blue-700">This may take a few moments for complex designs</div>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Real Text Extracted!</h3>
        <p className="text-slate-600">
          Successfully extracted {extractedElements.length} text elements from your Figma design.
        </p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-900 mb-3">Extracted Text Preview:</h4>
        <div className="max-h-40 overflow-y-auto space-y-2">
          {extractedElements.slice(0, 8).map((element, index) => (
            <div key={index} className="bg-white border border-green-200 rounded px-3 py-2">
              <div className="font-medium text-green-900">{element.originalText}</div>
              <div className="text-xs text-green-700">
                {element.componentType} • {element.frameName} • API Extracted
              </div>
            </div>
          ))}
          {extractedElements.length > 8 && (
            <div className="text-center text-sm text-green-700 font-medium">
              ... and {extractedElements.length - 8} more elements
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleUseExtractedText}
          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          Use This Real Text ({extractedElements.length} elements)
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderError = () => (
    <div className="text-center space-y-4">
      <AlertCircle className="w-16 h-16 text-red-600 mx-auto" />
      <h3 className="text-xl font-semibold text-slate-900">Authentication Failed</h3>
      <p className="text-slate-600">{errorMessage}</p>
      
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-red-900 mb-2">Common solutions:</h4>
        <ul className="list-disc list-inside text-red-800 space-y-1 text-sm">
          <li>Check that your Figma token is valid and not expired</li>
          <li>Ensure the Figma file is accessible to your account</li>
          <li>Verify the Figma URL is correct and public</li>
          <li>Try using a different authentication method</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep('choose')}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Different Method
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {currentStep === 'choose' && renderChooseMethod()}
          {currentStep === 'token-input' && renderTokenInput()}
          {currentStep === 'extracting' && renderExtracting()}
          {currentStep === 'success' && renderSuccess()}
          {currentStep === 'error' && renderError()}
        </div>
      </div>
    </div>
  );
};

export default FigmaAuthModal;
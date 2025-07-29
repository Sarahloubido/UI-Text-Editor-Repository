import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Copy, ExternalLink } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('token');
    const refreshTokenParam = urlParams.get('refresh_token');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError(errorParam);
    } else if (accessToken) {
      setToken(accessToken);
      if (refreshTokenParam) {
        setRefreshToken(refreshTokenParam);
      }
      // Clean URL
      window.history.replaceState({}, document.title, '/dashboard');
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const startFigmaAuth = () => {
    window.location.href = '/api/auth/figma';
  };

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <h2 className="text-2xl font-bold text-slate-900">Authentication Error</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">
              <strong>Error:</strong> {error}
            </p>
          </div>

          <button
            onClick={startFigmaAuth}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (token) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-bold text-slate-900">Authentication Successful!</h2>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 mb-2">
              ✅ Successfully authenticated with Figma
            </p>
            <p className="text-green-600 text-sm">
              You can now use this access token to access Figma files with read permissions.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Access Token
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={token}
                  readOnly
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(token)}
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 mt-1">✓ Copied to clipboard!</p>
              )}
            </div>

            {refreshToken && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Refresh Token
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={refreshToken}
                    readOnly
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(refreshToken)}
                    className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Next Steps</h3>
            <ul className="space-y-2 text-slate-600">
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Use this access token to make authenticated requests to the Figma API</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>Store the refresh token securely to get new access tokens when needed</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-1">•</span>
                <span>The access token grants `file_read` permissions for Figma files</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex space-x-4">
            <a
              href="https://www.figma.com/developers/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Figma API Documentation</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Figma OAuth Integration</h2>
        <p className="text-slate-600 mb-6">
          Connect your Figma account to access file data with read permissions.
        </p>
        
        <button
          onClick={startFigmaAuth}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Connect to Figma
        </button>

        <div className="mt-8 text-left">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">What this does:</h3>
          <ul className="space-y-2 text-slate-600">
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Redirects you to Figma's secure OAuth authorization page</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Requests `file_read` permission to access your Figma files</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-500 mt-1">✓</span>
              <span>Returns an access token you can use with the Figma API</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
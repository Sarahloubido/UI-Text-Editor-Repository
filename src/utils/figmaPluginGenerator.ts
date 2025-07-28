import { DiffItem } from '../types';

export class FigmaPluginGenerator {
  static generatePluginCode(changes: DiffItem[], figmaFileId: string): string {
    const pluginCode = `
// Auto-generated Figma Plugin to apply text changes
// Install this as a Figma Plugin to update your design

// Plugin manifest.json
const manifest = {
  "name": "Text Changes Updater",
  "id": "text-changes-updater",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "capabilities": [],
  "enableProposedApi": false,
  "editorType": ["figma"]
};

// code.js
figma.showUI(__html__, { width: 400, height: 600 });

const textChanges = ${JSON.stringify(changes, null, 2)};

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-changes') {
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const change of textChanges) {
      try {
        // Find text nodes that match the original text
        const textNodes = figma.currentPage.findAll(node => 
          node.type === 'TEXT' && 
          node.characters.trim() === change.originalText.trim()
        ) as TextNode[];

        for (const textNode of textNodes) {
          try {
            // Load the font before making changes
            await figma.loadFontAsync(textNode.fontName);
            
            // Update the text
            textNode.characters = change.editedText;
            updatedCount++;
            
            console.log(\`Updated: "\${change.originalText}" → "\${change.editedText}"\`);
          } catch (fontError) {
            console.error('Font loading error:', fontError);
            errors.push(\`Failed to load font for: "\${change.originalText}"\`);
            errorCount++;
          }
        }
        
        if (textNodes.length === 0) {
          errors.push(\`Text not found: "\${change.originalText}"\`);
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating text:', error);
        errors.push(\`Error updating "\${change.originalText}": \${error.message}\`);
        errorCount++;
      }
    }

    // Send results back to UI
    figma.ui.postMessage({
      type: 'update-complete',
      updatedCount,
      errorCount,
      errors,
      totalChanges: textChanges.length
    });
  }

  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};

// ui.html
const uiHTML = \`
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e1e5e9;
    }
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 5px 0;
    }
    .subtitle {
      font-size: 12px;
      color: #666;
      margin: 0;
    }
    .stats {
      background: #f1f3f4;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 14px;
    }
    .stat-label {
      color: #666;
    }
    .stat-value {
      font-weight: 500;
      color: #1e1e1e;
    }
    .changes-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .change-item {
      padding: 10px;
      border-bottom: 1px solid #f1f3f4;
      font-size: 12px;
    }
    .change-item:last-child {
      border-bottom: none;
    }
    .change-from {
      color: #d73a49;
      margin-bottom: 3px;
    }
    .change-to {
      color: #28a745;
    }
    .button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    .button-primary {
      background: #0d99ff;
      color: white;
    }
    .button-primary:hover {
      background: #0085e6;
    }
    .button-secondary {
      background: #f1f3f4;
      color: #666;
    }
    .button-secondary:hover {
      background: #e1e5e9;
    }
    .result {
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      font-size: 14px;
    }
    .result-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .result-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .error-list {
      margin-top: 10px;
      padding-left: 15px;
    }
    .error-item {
      font-size: 12px;
      margin: 3px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🎯 Apply Text Changes</h1>
      <p class="subtitle">Update your Figma design with edited text content</p>
    </div>

    <div class="stats">
      <div class="stat-row">
        <span class="stat-label">Total Changes:</span>
        <span class="stat-value">\${textChanges.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">File ID:</span>
        <span class="stat-value" style="font-family: monospace; font-size: 11px;">${figmaFileId}</span>
      </div>
    </div>

    <div class="changes-list">
      \${textChanges.map(change => \`
        <div class="change-item">
          <div class="change-from">From: "\${change.originalText}"</div>
          <div class="change-to">To: "\${change.editedText}"</div>
        </div>
      \`).join('')}
    </div>

    <button id="apply-btn" class="button button-primary">
      ✨ Apply All Changes to Figma
    </button>
    
    <button id="close-btn" class="button button-secondary">
      Cancel
    </button>

    <div id="result"></div>
  </div>

  <script>
    const textChanges = ${JSON.stringify(changes, null, 2)};
    
    document.getElementById('apply-btn').onclick = () => {
      document.getElementById('apply-btn').disabled = true;
      document.getElementById('apply-btn').textContent = '⏳ Applying Changes...';
      
      parent.postMessage({
        pluginMessage: { type: 'apply-changes' }
      }, '*');
    };

    document.getElementById('close-btn').onclick = () => {
      parent.postMessage({
        pluginMessage: { type: 'close-plugin' }
      }, '*');
    };

    window.onmessage = (event) => {
      if (event.data.pluginMessage.type === 'update-complete') {
        const result = event.data.pluginMessage;
        const resultDiv = document.getElementById('result');
        
        if (result.errorCount === 0) {
          resultDiv.innerHTML = \`
            <div class="result result-success">
              <strong>✅ Success!</strong><br>
              Updated \${result.updatedCount} text elements in your Figma file.
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div class="result result-error">
              <strong>⚠️ Partial Success</strong><br>
              Updated: \${result.updatedCount} | Failed: \${result.errorCount}<br>
              \${result.errors.length > 0 ? \`
                <div class="error-list">
                  \${result.errors.map(error => \`<div class="error-item">• \${error}</div>\`).join('')}
                </div>
              \` : ''}
            </div>
          \`;
        }
        
        document.getElementById('apply-btn').textContent = '✅ Changes Applied';
        document.getElementById('apply-btn').style.background = '#28a745';
      }
    };
  </script>
</body>
</html>
\`;

// Set the UI HTML
figma.ui.html = uiHTML;
`;

    return pluginCode;
  }

  static generatePluginFiles(changes: DiffItem[], figmaFileId: string): {
    manifest: string;
    code: string;
    ui: string;
  } {
    const manifest = {
      name: "Text Changes Updater",
      id: "text-changes-updater-" + Date.now(),
      api: "1.0.0",
      main: "code.js",
      ui: "ui.html",
      capabilities: [],
      enableProposedApi: false,
      editorType: ["figma"]
    };

    const code = `
figma.showUI(__html__, { width: 400, height: 600 });

const textChanges = ${JSON.stringify(changes, null, 2)};

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-changes') {
    let updatedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const change of textChanges) {
      try {
        // Find text nodes that match the original text
        const textNodes = figma.currentPage.findAll(node => 
          node.type === 'TEXT' && 
          node.characters.trim() === change.originalText.trim()
        );

        for (const textNode of textNodes) {
          try {
            // Load the font before making changes
            if (textNode.fontName !== figma.mixed) {
              await figma.loadFontAsync(textNode.fontName);
            } else {
              // Handle mixed fonts
              const fonts = textNode.getRangeAllFontNames(0, textNode.characters.length);
              await Promise.all(fonts.map(font => figma.loadFontAsync(font)));
            }
            
            // Update the text
            textNode.characters = change.editedText;
            updatedCount++;
            
            console.log(\`Updated: "\${change.originalText}" → "\${change.editedText}"\`);
          } catch (fontError) {
            console.error('Font loading error:', fontError);
            errors.push(\`Failed to load font for: "\${change.originalText}"\`);
            errorCount++;
          }
        }
        
        if (textNodes.length === 0) {
          errors.push(\`Text not found: "\${change.originalText}"\`);
          errorCount++;
        }
      } catch (error) {
        console.error('Error updating text:', error);
        errors.push(\`Error updating "\${change.originalText}": \${error.message}\`);
        errorCount++;
      }
    }

    // Send results back to UI
    figma.ui.postMessage({
      type: 'update-complete',
      updatedCount,
      errorCount,
      errors,
      totalChanges: textChanges.length
    });
  }

  if (msg.type === 'close-plugin') {
    figma.closePlugin();
  }
};
`;

    const ui = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8f9fa;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e1e5e9;
    }
    .title {
      font-size: 18px;
      font-weight: 600;
      color: #1e1e1e;
      margin: 0 0 5px 0;
    }
    .subtitle {
      font-size: 12px;
      color: #666;
      margin: 0;
    }
    .stats {
      background: #f1f3f4;
      border-radius: 6px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .stat-row {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      font-size: 14px;
    }
    .stat-label {
      color: #666;
    }
    .stat-value {
      font-weight: 500;
      color: #1e1e1e;
    }
    .changes-list {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
      margin-bottom: 20px;
    }
    .change-item {
      padding: 10px;
      border-bottom: 1px solid #f1f3f4;
      font-size: 12px;
    }
    .change-item:last-child {
      border-bottom: none;
    }
    .change-from {
      color: #d73a49;
      margin-bottom: 3px;
    }
    .change-to {
      color: #28a745;
    }
    .button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 10px;
      transition: all 0.2s;
    }
    .button-primary {
      background: #0d99ff;
      color: white;
    }
    .button-primary:hover {
      background: #0085e6;
    }
    .button-secondary {
      background: #f1f3f4;
      color: #666;
    }
    .button-secondary:hover {
      background: #e1e5e9;
    }
    .result {
      padding: 15px;
      border-radius: 6px;
      margin-top: 15px;
      font-size: 14px;
    }
    .result-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .result-error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .error-list {
      margin-top: 10px;
      padding-left: 15px;
    }
    .error-item {
      font-size: 12px;
      margin: 3px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">🎯 Apply Text Changes</h1>
      <p class="subtitle">Update your Figma design with edited text content</p>
    </div>

    <div class="stats">
      <div class="stat-row">
        <span class="stat-label">Total Changes:</span>
        <span class="stat-value">${changes.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">File ID:</span>
        <span class="stat-value" style="font-family: monospace; font-size: 11px;">${figmaFileId}</span>
      </div>
    </div>

    <div class="changes-list">
      ${changes.map(change => `
        <div class="change-item">
          <div class="change-from">From: "${change.originalText}"</div>
          <div class="change-to">To: "${change.editedText}"</div>
        </div>
      `).join('')}
    </div>

    <button id="apply-btn" class="button button-primary">
      ✨ Apply All Changes to Figma
    </button>
    
    <button id="close-btn" class="button button-secondary">
      Cancel
    </button>

    <div id="result"></div>
  </div>

  <script>
    document.getElementById('apply-btn').onclick = () => {
      document.getElementById('apply-btn').disabled = true;
      document.getElementById('apply-btn').textContent = '⏳ Applying Changes...';
      
      parent.postMessage({
        pluginMessage: { type: 'apply-changes' }
      }, '*');
    };

    document.getElementById('close-btn').onclick = () => {
      parent.postMessage({
        pluginMessage: { type: 'close-plugin' }
      }, '*');
    };

    window.onmessage = (event) => {
      if (event.data.pluginMessage.type === 'update-complete') {
        const result = event.data.pluginMessage;
        const resultDiv = document.getElementById('result');
        
        if (result.errorCount === 0) {
          resultDiv.innerHTML = \`
            <div class="result result-success">
              <strong>✅ Success!</strong><br>
              Updated \${result.updatedCount} text elements in your Figma file.
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div class="result result-error">
              <strong>⚠️ Partial Success</strong><br>
              Updated: \${result.updatedCount} | Failed: \${result.errorCount}<br>
              \${result.errors.length > 0 ? \`
                <div class="error-list">
                  \${result.errors.map(error => \`<div class="error-item">• \${error}</div>\`).join('')}
                </div>
              \` : ''}
            </div>
          \`;
        }
        
        document.getElementById('apply-btn').textContent = '✅ Changes Applied';
        document.getElementById('apply-btn').style.background = '#28a745';
      }
    };
  </script>
</body>
</html>
`;

    return {
      manifest: JSON.stringify(manifest, null, 2),
      code: code.trim(),
      ui: ui.trim()
    };
  }

  static downloadPluginFiles(changes: DiffItem[], figmaFileId: string): void {
    const files = this.generatePluginFiles(changes, figmaFileId);
    
    // Create a zip-like structure by downloading individual files
    this.downloadFile(files.manifest, 'manifest.json', 'application/json');
    
    setTimeout(() => {
      this.downloadFile(files.code, 'code.js', 'application/javascript');
    }, 500);
    
    setTimeout(() => {
      this.downloadFile(files.ui, 'ui.html', 'text/html');
    }, 1000);
  }

  private static downloadFile(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}
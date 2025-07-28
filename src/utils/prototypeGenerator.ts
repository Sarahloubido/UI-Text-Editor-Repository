import { Prototype, TextElement, DiffItem } from '../types';

export class PrototypeGenerator {
  static generateUpdatedPrototype(
    originalPrototype: Prototype,
    changes: DiffItem[]
  ): { 
    updatedPrototype: Prototype;
    htmlContent: string;
    figmaContent: string;
  } {
    // Apply changes to text elements
    const updatedElements = originalPrototype.textElements.map(element => {
      const change = changes.find(c => c.id === element.id);
      if (change && change.editedText) {
        return {
          ...element,
          originalText: change.editedText, // Update the text
          editedText: change.editedText,
          lastModified: new Date()
        };
      }
      return element;
    });

    const updatedPrototype = {
      ...originalPrototype,
      textElements: updatedElements,
      lastModified: new Date()
    };

    // Generate HTML representation
    const htmlContent = this.generateHTML(updatedPrototype);
    
    // Generate Figma-like JSON representation
    const figmaContent = this.generateFigmaFormat(updatedPrototype);

    return {
      updatedPrototype,
      htmlContent,
      figmaContent
    };
  }

  private static generateHTML(prototype: Prototype): string {
    const elementsByFrame = prototype.textElements.reduce((acc, element) => {
      if (!acc[element.frameName]) {
        acc[element.frameName] = [];
      }
      acc[element.frameName].push(element);
      return acc;
    }, {} as Record<string, TextElement[]>);

    const frameHTML = Object.entries(elementsByFrame).map(([frameName, elements]) => {
      const elementsHTML = elements.map(element => {
        const tag = this.getHTMLTag(element.componentType || 'text');
        const styles = this.getElementStyles(element);
        
        return `    <${tag} class="text-element" data-id="${element.id}" style="${styles}">
      ${element.originalText}
    </${tag}>`;
      }).join('\n');

      return `  <div class="frame" data-frame="${frameName}">
    <h2 class="frame-title">${frameName}</h2>
${elementsHTML}
  </div>`;
    }).join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prototype.name} - Updated Prototype</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f8fafc;
      line-height: 1.6;
    }
    .prototype-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .prototype-header {
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 24px;
    }
    .frame {
      background: white;
      margin: 24px 0;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .frame-title {
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .text-element {
      margin: 12px 0;
      padding: 8px 12px;
      background: #f1f5f9;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
    h1, h2, h3, h4, h5, h6 { color: #1e293b; font-weight: 600; }
    .button-element { 
      background: #3b82f6; 
      color: white; 
      padding: 12px 24px; 
      border-radius: 6px; 
      display: inline-block;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
    .input-element { 
      border: 1px solid #d1d5db; 
      padding: 8px 12px; 
      border-radius: 4px; 
      width: 100%;
      max-width: 300px;
    }
    .updated-badge {
      background: #10b981;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-left: 8px;
    }
  </style>
</head>
<body>
  <div class="prototype-container">
    <div class="prototype-header">
      <h1>${prototype.name}</h1>
      <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
      <p><strong>Total Elements:</strong> ${prototype.textElements.length}</p>
      <p><strong>Source:</strong> ${prototype.source}</p>
    </div>
    
${frameHTML}
  </div>
  
  <script>
    // Add interactivity
    document.querySelectorAll('.text-element').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        console.log('Element clicked:', id);
      });
    });
  </script>
</body>
</html>`;
  }

  private static generateFigmaFormat(prototype: Prototype): string {
    const figmaData = {
      name: prototype.name,
      type: "FRAME",
      children: prototype.textElements.map(element => ({
        id: element.id,
        name: `${element.componentType || 'text'}_${element.id}`,
        type: "TEXT",
        characters: element.originalText,
        style: {
          fontFamily: "Inter",
          fontSize: element.fontSize || 16,
          fontWeight: element.fontWeight || 400,
        },
        fills: [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }],
        frame: element.frameName,
        componentPath: element.componentPath,
        metadata: {
          priority: element.priority,
          isInteractive: element.isInteractive,
          lastModified: element.lastModified?.toISOString() || new Date().toISOString()
        }
      })),
      metadata: {
        source: prototype.source,
        lastModified: new Date().toISOString(),
        totalElements: prototype.textElements.length,
        updatedElements: prototype.textElements.filter(el => el.editedText && el.editedText !== el.originalText).length
      }
    };

    return JSON.stringify(figmaData, null, 2);
  }

  private static getHTMLTag(componentType: string): string {
    const tagMap: Record<string, string> = {
      'heading': 'h2',
      'title': 'h1',
      'subtitle': 'h3',
      'button': 'button',
      'link': 'a',
      'input': 'input',
      'label': 'label',
      'paragraph': 'p',
      'text': 'span'
    };
    
    return tagMap[componentType.toLowerCase()] || 'span';
  }

  private static getElementStyles(element: TextElement): string {
    const styles: string[] = [];
    
    if (element.fontSize) {
      styles.push(`font-size: ${element.fontSize}px`);
    }
    
    if (element.fontWeight) {
      styles.push(`font-weight: ${element.fontWeight}`);
    }
    
    if (element.componentType === 'button') {
      styles.push('cursor: pointer');
    }
    
    return styles.join('; ');
  }

  static downloadFile(content: string, filename: string, type: string = 'text/html') {
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
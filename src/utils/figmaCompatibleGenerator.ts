import { TextElement, Prototype } from '../types';

export class FigmaCompatibleGenerator {
  
  // Generate SVG that Figma can import while preserving layout
  static generateFigmaImportableSVG(prototype: Prototype, updatedElements: TextElement[]): string {
    // Calculate canvas dimensions based on all elements
    const allElements = updatedElements;
    const maxX = Math.max(...allElements.map(el => (el.boundingBox.x || 0) + (el.boundingBox.width || 100)));
    const maxY = Math.max(...allElements.map(el => (el.boundingBox.y || 0) + (el.boundingBox.height || 20)));
    
    const canvasWidth = Math.max(1200, maxX + 100);
    const canvasHeight = Math.max(800, maxY + 100);

    // Group elements by frame
    const frameGroups = this.groupElementsByFrame(allElements);
    
    let svgContent = '';
    let currentY = 50;

    // Generate frames
    Object.entries(frameGroups).forEach(([frameName, elements], frameIndex) => {
      const frameWidth = 800;
      const frameHeight = 600;
      const frameX = 50;
      const frameY = currentY;

      // Frame background
      svgContent += `
        <g id="frame-${frameIndex}" data-figma-type="FRAME">
          <rect x="${frameX}" y="${frameY}" width="${frameWidth}" height="${frameHeight}" 
                fill="#ffffff" stroke="#e0e0e0" stroke-width="2" rx="8"/>
          
          <!-- Frame Title -->
          <text x="${frameX + 20}" y="${frameY + 30}" 
                font-family="Inter, sans-serif" font-size="16" font-weight="600" fill="#1a1a1a">
            ${this.escapeXML(frameName)}
          </text>
      `;

      // Add text elements within frame
      elements.forEach((element, elementIndex) => {
        const x = frameX + 20 + (element.boundingBox.x % (frameWidth - 40));
        const y = frameY + 60 + (element.boundingBox.y % (frameHeight - 80));
        const fontSize = element.fontSize || 16;
        const fontFamily = element.fontFamily || 'Inter';
        const fontWeight = element.fontWeight || '400';
        
        // Use edited text if available, otherwise original
        const displayText = element.editedText || element.originalText;

        // Background for text element based on component type
        const bgColor = this.getComponentBackgroundColor(element.componentType);
        const textColor = this.getComponentTextColor(element.componentType);
        
        svgContent += `
          <g id="element-${element.id}" data-figma-type="TEXT" data-component-type="${element.componentType}">
            <rect x="${x - 8}" y="${y - fontSize - 4}" 
                  width="${Math.max(element.boundingBox.width || 100, displayText.length * 8)}" 
                  height="${fontSize + 12}" 
                  fill="${bgColor}" rx="4" opacity="0.1"/>
            <text x="${x}" y="${y}" 
                  font-family="${fontFamily}, sans-serif" 
                  font-size="${fontSize}" 
                  font-weight="${fontWeight}" 
                  fill="${textColor}"
                  data-original-text="${this.escapeXML(element.originalText)}"
                  data-edited-text="${this.escapeXML(displayText)}">
              ${this.escapeXML(displayText)}
            </text>
          </g>
        `;
      });

      svgContent += `</g>`;
      currentY += frameHeight + 100;
    });

    const fullSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvasWidth}" height="${currentY + 50}" viewBox="0 0 ${canvasWidth} ${currentY + 50}" 
     xmlns="http://www.w3.org/2000/svg"
     data-figma-file="${prototype.name}"
     data-export-timestamp="${new Date().toISOString()}">
  
  <!-- Document Background -->
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  
  <!-- Title -->
  <text x="50" y="30" font-family="Inter, sans-serif" font-size="24" font-weight="700" fill="#1a1a1a">
    ${this.escapeXML(prototype.name)} - Updated Design
  </text>
  
  ${svgContent}
  
  <!-- Footer Info -->
  <text x="50" y="${currentY + 30}" font-family="Inter, sans-serif" font-size="12" fill="#666">
    Generated: ${new Date().toLocaleString()} | Elements: ${updatedElements.length} | Changes Applied
  </text>
</svg>`;

    return fullSVG;
  }

  // Generate Sketch-compatible JSON that can be imported
  static generateSketchJSON(prototype: Prototype, updatedElements: TextElement[]): string {
    const frameGroups = this.groupElementsByFrame(updatedElements);
    
    const sketchDocument = {
      _class: "document",
      do_objectID: this.generateID(),
      exportOptions: {
        _class: "exportOptions",
        exportFormats: [],
        includedLayerIds: [],
        layerOptions: 0,
        shouldTrim: false
      },
      foreignLayerStyles: [],
      foreignSymbols: [],
      foreignTextStyles: [],
      layerStyles: {
        _class: "sharedStyleContainer",
        objects: []
      },
      layerSymbols: {
        _class: "symbolContainer", 
        objects: []
      },
      layerTextStyles: {
        _class: "sharedTextStyleContainer",
        objects: []
      },
      pages: [
        {
          _class: "page",
          do_objectID: this.generateID(),
          booleanOperation: -1,
          exportOptions: {
            _class: "exportOptions",
            exportFormats: [],
            includedLayerIds: [],
            layerOptions: 0,
            shouldTrim: false
          },
          frame: {
            _class: "rect",
            constrainProportions: false,
            height: 5000,
            width: 5000,
            x: 0,
            y: 0
          },
          hasClickThrough: true,
          layers: this.generateSketchLayers(frameGroups),
          name: prototype.name,
          style: {
            _class: "style",
            endMarkerType: 0,
            miterLimit: 10,
            startMarkerType: 0
          }
        }
      ]
    };

    return JSON.stringify(sketchDocument, null, 2);
  }

  // Generate Adobe XD compatible format
  static generateXDFormat(prototype: Prototype, updatedElements: TextElement[]): string {
    const frameGroups = this.groupElementsByFrame(updatedElements);
    
    const xdDocument = {
      version: "1.0.0",
      name: prototype.name,
      timestamp: new Date().toISOString(),
      artboards: Object.entries(frameGroups).map(([frameName, elements], index) => ({
        id: `artboard-${index}`,
        name: frameName,
        x: index * 900,
        y: 0,
        width: 800,
        height: 600,
        backgroundColor: "#ffffff",
        elements: elements.map(element => ({
          id: element.id,
          type: "text",
          text: element.editedText || element.originalText,
          x: element.boundingBox.x || 0,
          y: element.boundingBox.y || 0,
          width: element.boundingBox.width || 100,
          height: element.boundingBox.height || 20,
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || "Inter",
          fontWeight: element.fontWeight || "400",
          color: "#000000",
          componentType: element.componentType,
          originalText: element.originalText
        }))
      }))
    };

    return JSON.stringify(xdDocument, null, 2);
  }

  // Generate Figma-style component system
  static generateFigmaComponents(prototype: Prototype, updatedElements: TextElement[]): string {
    const components = {
      figmaComponents: {
        version: "1.0",
        timestamp: new Date().toISOString(),
        originalFile: prototype.name,
        components: updatedElements.map(element => ({
          id: element.id,
          name: `${element.componentType}/${element.frameName}`,
          type: "TEXT",
          characters: element.editedText || element.originalText,
          originalCharacters: element.originalText,
          style: {
            fontFamily: element.fontFamily || "Inter",
            fontSize: element.fontSize || 16,
            fontWeight: element.fontWeight || "400",
            textAlign: "LEFT",
            color: { r: 0, g: 0, b: 0, a: 1 }
          },
          layout: {
            x: element.boundingBox.x || 0,
            y: element.boundingBox.y || 0,
            width: element.boundingBox.width || 100,
            height: element.boundingBox.height || 20
          },
          metadata: {
            frameName: element.frameName,
            componentPath: element.componentPath,
            screenSection: element.screenSection,
            priority: element.priority,
            componentType: element.componentType
          }
        }))
      }
    };

    return JSON.stringify(components, null, 2);
  }

  // Generate HTML that can be imported into Figma via plugins
  static generateImportableHTML(prototype: Prototype, updatedElements: TextElement[]): string {
    const frameGroups = this.groupElementsByFrame(updatedElements);
    
    let htmlContent = '';
    
    Object.entries(frameGroups).forEach(([frameName, elements]) => {
      htmlContent += `
        <div class="figma-frame" data-frame-name="${frameName}" style="
          width: 800px;
          height: 600px;
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          margin: 50px;
          padding: 20px;
          position: relative;
          font-family: Inter, sans-serif;
        ">
          <h2 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">
            ${frameName}
          </h2>
          
          ${elements.map(element => `
            <div class="figma-text-element" 
                 data-element-id="${element.id}"
                 data-component-type="${element.componentType}"
                 data-original-text="${this.escapeHTML(element.originalText)}"
                 style="
                   position: absolute;
                   left: ${(element.boundingBox.x || 0) % 760}px;
                   top: ${((element.boundingBox.y || 0) % 540) + 40}px;
                   width: ${element.boundingBox.width || 100}px;
                   height: ${element.boundingBox.height || 20}px;
                   font-family: ${element.fontFamily || 'Inter'}, sans-serif;
                   font-size: ${element.fontSize || 16}px;
                   font-weight: ${element.fontWeight || 400};
                   color: ${this.getComponentTextColor(element.componentType)};
                   background-color: ${this.getComponentBackgroundColor(element.componentType)}20;
                   padding: 4px 8px;
                   border-radius: 4px;
                   border: 1px solid ${this.getComponentBackgroundColor(element.componentType)}40;
                 ">
              ${this.escapeHTML(element.editedText || element.originalText)}
            </div>
          `).join('')}
        </div>
      `;
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${prototype.name} - Updated Design</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Inter, sans-serif;
            background: #f5f5f5;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .header h1 {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin: 0;
        }
        .header p {
            font-size: 16px;
            color: #666;
            margin: 10px 0 0 0;
        }
        .figma-frame {
            margin: 0 auto 50px auto;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${prototype.name}</h1>
        <p>Updated Design with Text Changes | Generated: ${new Date().toLocaleString()}</p>
        <p style="font-size: 14px; color: #888;">
            Import this HTML into Figma using "File → Import" or use with HTML import plugins
        </p>
    </div>
    
    ${htmlContent}
    
    <div style="text-align: center; margin-top: 50px; color: #888; font-size: 12px;">
        Total Elements: ${updatedElements.length} | 
        Frames: ${Object.keys(frameGroups).length} |
        Changes Applied: ${updatedElements.filter(el => el.editedText && el.editedText !== el.originalText).length}
    </div>
</body>
</html>`;
  }

  // Download all Figma-compatible formats
  static downloadFigmaCompatibleFiles(prototype: Prototype, updatedElements: TextElement[]): void {
    const safeName = prototype.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    console.log('Generating Figma-compatible files...');
    
    // Generate all formats
    const svgContent = this.generateFigmaImportableSVG(prototype, updatedElements);
    const sketchContent = this.generateSketchJSON(prototype, updatedElements);
    const xdContent = this.generateXDFormat(prototype, updatedElements);
    const componentsContent = this.generateFigmaComponents(prototype, updatedElements);
    const htmlContent = this.generateImportableHTML(prototype, updatedElements);

    // Download files with delays
    this.downloadFile(svgContent, `${safeName}_figma_import.svg`, 'image/svg+xml');
    
    setTimeout(() => {
      this.downloadFile(htmlContent, `${safeName}_figma_frames.html`, 'text/html');
    }, 500);

    setTimeout(() => {
      this.downloadFile(sketchContent, `${safeName}_sketch_compatible.json`, 'application/json');
    }, 1000);

    setTimeout(() => {
      this.downloadFile(xdContent, `${safeName}_xd_format.json`, 'application/json');
    }, 1500);

    setTimeout(() => {
      this.downloadFile(componentsContent, `${safeName}_figma_components.json`, 'application/json');
    }, 2000);
  }

  // Helper methods
  private static groupElementsByFrame(elements: TextElement[]): Record<string, TextElement[]> {
    return elements.reduce((acc, element) => {
      const frameName = element.frameName || 'Default Frame';
      if (!acc[frameName]) {
        acc[frameName] = [];
      }
      acc[frameName].push(element);
      return acc;
    }, {} as Record<string, TextElement[]>);
  }

  private static generateSketchLayers(frameGroups: Record<string, TextElement[]>): any[] {
    return Object.entries(frameGroups).map(([frameName, elements], frameIndex) => ({
      _class: "artboard",
      do_objectID: this.generateID(),
      booleanOperation: -1,
      exportOptions: {
        _class: "exportOptions",
        exportFormats: [],
        includedLayerIds: [],
        layerOptions: 0,
        shouldTrim: false
      },
      frame: {
        _class: "rect",
        constrainProportions: false,
        height: 600,
        width: 800,
        x: frameIndex * 900,
        y: 0
      },
      hasBackgroundColor: true,
      backgroundColor: {
        _class: "color",
        alpha: 1,
        blue: 1,
        green: 1,
        red: 1
      },
      layers: elements.map(element => ({
        _class: "text",
        do_objectID: this.generateID(),
        booleanOperation: -1,
        exportOptions: {
          _class: "exportOptions",
          exportFormats: [],
          includedLayerIds: [],
          layerOptions: 0,
          shouldTrim: false
        },
        frame: {
          _class: "rect",
          constrainProportions: false,
          height: element.boundingBox.height || 20,
          width: element.boundingBox.width || 100,
          x: element.boundingBox.x || 0,
          y: element.boundingBox.y || 0
        },
        attributedString: {
          _class: "attributedString",
          string: element.editedText || element.originalText
        },
        name: `${element.componentType} - ${element.originalText.substring(0, 20)}...`
      })),
      name: frameName
    }));
  }

  private static generateID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private static getComponentBackgroundColor(componentType: string): string {
    switch (componentType) {
      case 'button': return '#3b82f6';
      case 'heading': return '#7c3aed';
      case 'navigation': return '#059669';
      case 'link': return '#0ea5e9';
      case 'content': return '#6b7280';
      default: return '#64748b';
    }
  }

  private static getComponentTextColor(componentType: string): string {
    switch (componentType) {
      case 'button': return '#ffffff';
      case 'heading': return '#1f2937';
      case 'navigation': return '#1f2937';
      case 'link': return '#0ea5e9';
      case 'content': return '#374151';
      default: return '#1f2937';
    }
  }

  private static escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private static escapeHTML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
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

  static getFigmaImportInstructions(): string {
    return `🎯 Figma Import Instructions:

📄 SVG Import (Recommended):
1. In Figma: File → Import
2. Select the .svg file
3. Your frames will appear with updated text
4. Text elements maintain positioning and styling

🌐 HTML Import:
1. Use Figma plugin "HTML to Figma" or "Import from HTML"
2. Import the .html file
3. Frames convert to Figma artboards

📊 Components JSON:
1. Contains structured component data
2. Use with Figma API or custom plugins
3. Preserves all metadata and changes

💡 Best Results:
• SVG import preserves visual layout
• HTML works with import plugins
• All text changes are applied
• Original design structure maintained

🔄 After Import:
• Adjust positioning if needed
• Update colors/styling as desired
• Continue designing normally!`;
  }
}
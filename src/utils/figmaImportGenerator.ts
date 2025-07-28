import { TextElement, Prototype } from '../types';

export class FigmaImportGenerator {
  static generateFigmaCSV(elements: TextElement[]): string {
    // Figma can import CSV with specific column names for text frames
    const csvHeaders = [
      'name',
      'text',
      'x',
      'y',
      'width',
      'height',
      'fontSize',
      'fontFamily',
      'fontWeight',
      'fill',
      'frame'
    ];

    const csvRows = elements.map(element => {
      return [
        `"${element.componentPath || element.id}"`, // name
        `"${element.originalText.replace(/"/g, '""')}"`, // text content
        element.boundingBox.x || 0, // x position
        element.boundingBox.y || 0, // y position
        element.boundingBox.width || 100, // width
        element.boundingBox.height || 20, // height
        element.fontSize || 16, // fontSize
        `"${element.fontFamily || 'Inter'}"`, // fontFamily
        element.fontWeight || 400, // fontWeight
        `"#000000"`, // fill color
        `"${element.frameName}"` // frame name
      ].join(',');
    });

    return [csvHeaders.join(','), ...csvRows].join('\n');
  }

  static generateFigmaJSON(prototype: Prototype): string {
    // Generate Figma-compatible JSON structure
    const figmaData = {
      document: {
        id: "0:0",
        name: prototype.name,
        type: "DOCUMENT",
        children: [
          {
            id: "0:1",
            name: "Page 1",
            type: "CANVAS",
            children: this.createFramesFromElements(prototype.textElements)
          }
        ]
      },
      components: {},
      componentSets: {},
      schemaVersion: 0,
      styles: {},
      name: prototype.name,
      lastModified: new Date().toISOString(),
      thumbnailUrl: "",
      version: "1.0.0"
    };

    return JSON.stringify(figmaData, null, 2);
  }

  private static createFramesFromElements(elements: TextElement[]) {
    // Group elements by frame name
    const frameGroups = elements.reduce((acc, element) => {
      const frameName = element.frameName || 'Default Frame';
      if (!acc[frameName]) {
        acc[frameName] = [];
      }
      acc[frameName].push(element);
      return acc;
    }, {} as Record<string, TextElement[]>);

    return Object.entries(frameGroups).map(([frameName, frameElements], frameIndex) => ({
      id: `1:${frameIndex + 1}`,
      name: frameName,
      type: "FRAME",
      children: frameElements.map((element, elementIndex) => ({
        id: `${frameIndex + 1}:${elementIndex + 1}`,
        name: element.componentPath || `Text ${elementIndex + 1}`,
        type: "TEXT",
        characters: element.originalText,
        absoluteBoundingBox: {
          x: element.boundingBox.x || 0,
          y: element.boundingBox.y || 0,
          width: element.boundingBox.width || 100,
          height: element.boundingBox.height || 20
        },
        style: {
          fontFamily: element.fontFamily || "Inter",
          fontWeight: element.fontWeight || 400,
          fontSize: element.fontSize || 16,
          textAlignHorizontal: "LEFT",
          textAlignVertical: "TOP",
          letterSpacing: 0,
          lineHeightPx: (element.fontSize || 16) * 1.2,
          lineHeightPercent: 120,
          lineHeightUnit: "PIXELS"
        },
        fills: [
          {
            blendMode: "NORMAL",
            type: "SOLID",
            color: {
              r: 0,
              g: 0,
              b: 0,
              a: 1
            }
          }
        ],
        strokes: [],
        strokeWeight: 0,
        strokeAlign: "INSIDE",
        effects: []
      })),
      absoluteBoundingBox: {
        x: 0,
        y: frameIndex * 600,
        width: 800,
        height: 600
      },
      backgroundColor: {
        r: 1,
        g: 1,
        b: 1,
        a: 1
      },
      fills: [
        {
          blendMode: "NORMAL",
          type: "SOLID",
          color: {
            r: 1,
            g: 1,
            b: 1,
            a: 1
          }
        }
      ],
      strokes: [],
      strokeWeight: 0,
      strokeAlign: "INSIDE",
      effects: [],
      clipsContent: false,
      layoutMode: "NONE"
    }));
  }

  static generateFigmaSVG(elements: TextElement[], frameName: string = "Imported Text"): string {
    // Calculate frame dimensions
    const maxWidth = Math.max(...elements.map(el => (el.boundingBox.x || 0) + (el.boundingBox.width || 100))) + 50;
    const maxHeight = Math.max(...elements.map(el => (el.boundingBox.y || 0) + (el.boundingBox.height || 20))) + 50;

    const textElements = elements.map(element => {
      const x = element.boundingBox.x || 0;
      const y = (element.boundingBox.y || 0) + (element.fontSize || 16); // SVG text baseline
      const fontSize = element.fontSize || 16;
      const fontFamily = element.fontFamily || 'Inter, sans-serif';
      const fontWeight = element.fontWeight || 400;

      return `
        <text x="${x}" y="${y}" 
              font-family="${fontFamily}" 
              font-size="${fontSize}" 
              font-weight="${fontWeight}" 
              fill="#000000"
              data-figma-component="${element.componentPath || ''}"
              data-figma-id="${element.id}">
          ${element.originalText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </text>`;
    }).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${maxWidth}" height="${maxHeight}" viewBox="0 0 ${maxWidth} ${maxHeight}" 
     xmlns="http://www.w3.org/2000/svg"
     data-figma-frame="${frameName}">
  <rect width="100%" height="100%" fill="white"/>
  ${textElements}
</svg>`;
  }

  static generateFigmaTextFile(elements: TextElement[]): string {
    // Generate a simple text file that can be copy-pasted into Figma
    return elements.map(element => {
      return `Frame: ${element.frameName}
Component: ${element.componentPath}
Text: ${element.originalText}
Position: ${element.boundingBox.x || 0}, ${element.boundingBox.y || 0}
Size: ${element.boundingBox.width || 100} × ${element.boundingBox.height || 20}
Font: ${element.fontFamily || 'Inter'} ${element.fontSize || 16}px
---`;
    }).join('\n\n');
  }

  static downloadFigmaFiles(prototype: Prototype, selectedElements: TextElement[]): void {
    const safeName = prototype.name.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Download multiple formats for Figma import
    this.downloadFile(
      this.generateFigmaJSON(prototype),
      `${safeName}_figma_import.json`,
      'application/json'
    );

    setTimeout(() => {
      this.downloadFile(
        this.generateFigmaCSV(selectedElements),
        `${safeName}_figma_text.csv`,
        'text/csv'
      );
    }, 500);

    setTimeout(() => {
      this.downloadFile(
        this.generateFigmaSVG(selectedElements, prototype.name),
        `${safeName}_figma_layout.svg`,
        'image/svg+xml'
      );
    }, 1000);

    setTimeout(() => {
      this.downloadFile(
        this.generateFigmaTextFile(selectedElements),
        `${safeName}_figma_text.txt`,
        'text/plain'
      );
    }, 1500);
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
    return `🎯 How to Import into Figma:

📄 JSON Format:
1. In Figma: File → Import
2. Select the .json file
3. Choose "Import as Components" or "Import as Frames"

📊 CSV Format:  
1. In Figma: Plugins → Text from CSV (install if needed)
2. Select the .csv file
3. Map columns to text properties

🎨 SVG Format:
1. In Figma: File → Import
2. Select the .svg file
3. Text will be imported as vector text

📝 TXT Format:
1. Copy content from .txt file
2. Paste directly into Figma
3. Use as reference for manual updates

💡 Tips:
• JSON format preserves structure and styling
• CSV works best with Text from CSV plugin
• SVG maintains positioning and fonts
• TXT is for manual reference`;
  }
}
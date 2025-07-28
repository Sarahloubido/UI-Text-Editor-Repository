import { TextElement } from '../types';

// OCR Library interface (we'll use Tesseract.js)
interface OCRResult {
  data: {
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
    words: Array<{
      text: string;
      confidence: number;
      bbox: {
        x0: number;
        y0: number;
        x1: number;
        y1: number;
      };
    }>;
  };
}

export class FigmaScreenshotOCR {
  private static instance: FigmaScreenshotOCR | null = null;
  private tesseractWorker: any = null;

  static getInstance(): FigmaScreenshotOCR {
    if (!FigmaScreenshotOCR.instance) {
      FigmaScreenshotOCR.instance = new FigmaScreenshotOCR();
    }
    return FigmaScreenshotOCR.instance;
  }

  // Initialize OCR worker
  async initializeOCR(): Promise<void> {
    try {
      // Dynamically import Tesseract.js
      const Tesseract = await import('tesseract.js');
      this.tesseractWorker = await Tesseract.createWorker();
      await this.tesseractWorker.loadLanguage('eng');
      await this.tesseractWorker.initialize('eng');
      console.log('🔍 OCR initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OCR:', error);
      throw new Error('OCR initialization failed');
    }
  }

  // Take screenshot of the current page/iframe
  async captureScreenshot(): Promise<HTMLCanvasElement> {
    try {
      console.log('📸 Starting screenshot capture...');
      
      // Use the Screen Capture API if available
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        return await this.captureUsingDisplayMedia();
      } else {
        // Fallback to html2canvas for same-origin content
        return await this.captureUsingHTML2Canvas();
      }
    } catch (error) {
      console.error('❌ Screenshot capture failed:', error);
      throw new Error('Screenshot capture failed');
    }
  }

  // Primary method: Use Screen Capture API
  private async captureUsingDisplayMedia(): Promise<HTMLCanvasElement> {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        mediaSource: 'browser' as any,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    });

    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
        
        console.log('✅ Screenshot captured using Display Media API');
        resolve(canvas);
      };

      video.onerror = () => {
        reject(new Error('Video failed to load'));
      };
    });
  }

  // Fallback method: Use html2canvas for same-origin content
  private async captureUsingHTML2Canvas(): Promise<HTMLCanvasElement> {
    try {
      const html2canvas = await import('html2canvas');
      console.log('📸 Using html2canvas for screenshot...');
      
      const canvas = await html2canvas.default(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
        width: window.innerWidth,
        height: document.body.scrollHeight
      });
      
      console.log('✅ Screenshot captured using html2canvas');
      return canvas;
    } catch (error) {
      console.error('❌ html2canvas failed:', error);
      throw new Error('html2canvas capture failed');
    }
  }

  // Extract text from screenshot using OCR
  async extractTextFromScreenshot(canvas: HTMLCanvasElement): Promise<OCRResult> {
    if (!this.tesseractWorker) {
      await this.initializeOCR();
    }

    try {
      console.log('🔍 Starting OCR text extraction...');
      
      const result = await this.tesseractWorker.recognize(canvas);
      console.log('✅ OCR extraction completed');
      console.log(`📝 Extracted text: "${result.data.text.substring(0, 100)}..."`);
      
      return result;
    } catch (error) {
      console.error('❌ OCR extraction failed:', error);
      throw new Error('OCR text extraction failed');
    }
  }

  // Convert OCR results to TextElement objects
  convertOCRToTextElements(ocrResult: OCRResult, fileName: string): TextElement[] {
    const textElements: TextElement[] = [];
    const { words } = ocrResult.data;

    words.forEach((word, index) => {
      if (word.text.trim() && word.confidence > 30) { // Filter low-confidence results
        const element: TextElement = {
          id: `ocr_${index}`,
          originalText: word.text.trim(),
          frameName: this.determineFrameFromPosition(word.bbox),
          componentPath: `${fileName}/detected_text`,
          boundingBox: {
            x: word.bbox.x0,
            y: word.bbox.y0,
            width: word.bbox.x1 - word.bbox.x0,
            height: word.bbox.y1 - word.bbox.y0
          },
          contextNotes: `OCR extracted with ${word.confidence.toFixed(1)}% confidence`,
          componentType: this.determineComponentType(word.text),
          hierarchy: `${fileName} > ${this.determineFrameFromPosition(word.bbox)} > detected_text`,
          isInteractive: this.isLikelyInteractive(word.text),
          screenSection: this.determineScreenSection(word.bbox),
          priority: this.determinePriority(word.text, word.bbox),
          fontSize: this.estimateFontSize(word.bbox),
          fontFamily: 'Unknown',
          fontWeight: this.estimateFontWeight(word.text),
          extractionMetadata: {
            source: 'ocr' as const,
            confidence: word.confidence / 100,
            extractedAt: new Date(),
            extractionMethod: 'Screenshot + OCR'
          }
        };

        textElements.push(element);
      }
    });

    return textElements;
  }

  // Helper: Determine frame name from position
  private determineFrameFromPosition(bbox: any): string {
    const centerY = (bbox.y0 + bbox.y1) / 2;
    const viewportHeight = window.innerHeight;

    if (centerY < viewportHeight * 0.15) return 'Header';
    if (centerY > viewportHeight * 0.85) return 'Footer';
    if (centerY < viewportHeight * 0.5) return 'Upper Content';
    return 'Lower Content';
  }

  // Helper: Determine component type from text content
  private determineComponentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (/^(home|about|contact|menu|nav)/i.test(text)) return 'navigation';
    if (/^(click|tap|submit|send|buy|download)/i.test(text)) return 'button';
    if (/^(title|heading|\w+\s*-\s*)/i.test(text)) return 'heading';
    if (text.length > 50) return 'content';
    if (/\$|price|cost|\d+\.\d{2}/.test(text)) return 'price';
    if (/@|email|phone|\d{3}-\d{3}/.test(text)) return 'contact';
    
    return 'text';
  }

  // Helper: Check if text is likely interactive
  private isLikelyInteractive(text: string): boolean {
    const interactivePatterns = [
      /^(click|tap|submit|send|buy|download|login|register|sign)/i,
      /^(home|about|contact|menu|services|products)/i,
      /^(learn more|read more|view all|see more)/i
    ];
    
    return interactivePatterns.some(pattern => pattern.test(text));
  }

  // Helper: Determine screen section
  private determineScreenSection(bbox: any): string {
    const centerY = (bbox.y0 + bbox.y1) / 2;
    const viewportHeight = window.innerHeight;

    if (centerY < viewportHeight * 0.2) return 'header';
    if (centerY > viewportHeight * 0.8) return 'footer';
    return 'main';
  }

  // Helper: Determine priority based on text and position
  private determinePriority(text: string, bbox: any): 'high' | 'medium' | 'low' {
    const centerY = (bbox.y0 + bbox.y1) / 2;
    const viewportHeight = window.innerHeight;
    
    // High priority for headers, buttons, and top content
    if (centerY < viewportHeight * 0.3) return 'high';
    if (this.isLikelyInteractive(text)) return 'high';
    if (text.length < 20) return 'medium';
    
    return 'low';
  }

  // Helper: Estimate font size from bounding box
  private estimateFontSize(bbox: any): number {
    const height = bbox.y1 - bbox.y0;
    // Rough estimation: text height to font size ratio
    return Math.max(12, Math.min(48, height * 0.8));
  }

  // Helper: Estimate font weight from text
  private estimateFontWeight(text: string): string {
    if (/^[A-Z\s]+$/.test(text) || /^\w+\s*-\s*/.test(text)) return '700';
    if (this.isLikelyInteractive(text)) return '600';
    return '400';
  }

  // Main method: Complete screenshot + OCR extraction process
  async extractTextFromDesign(figmaUrl: string): Promise<TextElement[]> {
    try {
      console.log('🚀 Starting screenshot + OCR extraction for:', figmaUrl);
      
      // Extract file name from URL
      const fileName = this.extractFileNameFromUrl(figmaUrl);
      
      // Step 1: Capture screenshot
      const canvas = await this.captureScreenshot();
      
      // Step 2: Extract text using OCR
      const ocrResult = await this.extractTextFromScreenshot(canvas);
      
      // Step 3: Convert to TextElement objects
      const textElements = this.convertOCRToTextElements(ocrResult, fileName);
      
      console.log(`✅ Extracted ${textElements.length} text elements using OCR`);
      return textElements;
      
    } catch (error) {
      console.error('❌ Screenshot + OCR extraction failed:', error);
      throw error;
    }
  }

  // Helper: Extract file name from Figma URL
  private extractFileNameFromUrl(url: string): string {
    try {
      const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
      if (match) {
        return decodeURIComponent(match[1])
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (e) {
      console.warn('Could not parse file name from URL');
    }
    return 'Figma Design';
  }

  // Cleanup OCR worker
  async cleanup(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      console.log('🧹 OCR worker cleaned up');
    }
  }
}

export default FigmaScreenshotOCR;
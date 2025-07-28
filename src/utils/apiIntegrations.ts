import { TextElement } from '../types';

// SIMPLIFIED API - Version 2.0 - No loops, direct mock generation
export class PrototypeAPIManager {
  private static instance: PrototypeAPIManager;
  private processedUrls: Map<string, TextElement[]> = new Map();

  constructor() {
    console.log('🚀 Using SIMPLIFIED PrototypeAPIManager v2.0 - No loops!');
  }

  static getInstance(): PrototypeAPIManager {
    if (!PrototypeAPIManager.instance) {
      PrototypeAPIManager.instance = new PrototypeAPIManager();
    }
    return PrototypeAPIManager.instance;
  }

  // SIMPLE extraction - no loops, no complex processing
  async extractFromURL(url: string): Promise<TextElement[]> {
    console.log('🔥 SIMPLE extraction from URL:', url);
    
    // Check cache first
    if (this.processedUrls.has(url)) {
      console.log('✅ URL already processed, returning cached result');
      return this.processedUrls.get(url) || [];
    }

    try {
      // Generate simple mock data immediately
      const elements = this.generateSimpleMockData(url);
      
      // Cache the result
      this.processedUrls.set(url, elements);
      
      console.log(`✅ Generated ${elements.length} SIMPLE mock elements`);
      return elements;
      
    } catch (error) {
      console.error('❌ Error in simple extraction:', error);
      return [];
    }
  }

  // Simple mock data generation - no complex logic
  private generateSimpleMockData(url: string): TextElement[] {
    const elements: TextElement[] = [];
    
    // Extract file name from URL
    const fileName = this.getFileNameFromUrl(url);
    
    // Determine design type
    const designType = this.getDesignType(url, fileName);
    
    // Generate basic elements
    const basicElements = this.createBasicElements(fileName, designType);
    
    console.log(`🎯 Generated ${basicElements.length} elements for ${designType} design: ${fileName}`);
    
    return basicElements;
  }

  private getFileNameFromUrl(url: string): string {
    try {
      const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
      if (match) {
        return decodeURIComponent(match[1])
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (error) {
      console.log('Could not extract file name from URL');
    }
    return 'Figma Design';
  }

  private getDesignType(url: string, fileName: string): string {
    const combined = (url + fileName).toLowerCase();
    
    if (combined.includes('mobile') || combined.includes('app') || combined.includes('ios') || combined.includes('android')) {
      return 'mobile';
    }
    if (combined.includes('dashboard') || combined.includes('admin')) {
      return 'dashboard';
    }
    if (combined.includes('website') || combined.includes('landing')) {
      return 'website';
    }
    if (combined.includes('ecommerce') || combined.includes('shop')) {
      return 'ecommerce';
    }
    
    return 'app';
  }

  private createBasicElements(fileName: string, designType: string): TextElement[] {
    const elements: TextElement[] = [];
    let id = 0;

    const createElement = (text: string, type: TextElement['componentType'], section: TextElement['screenSection'], frame: string = 'Main Screen') => {
      elements.push({
        id: `simple_${id++}`,
        originalText: text,
        frameName: frame,
        componentPath: `${frame}/${type}`,
        boundingBox: {
          x: 20 + (elements.length % 2) * 180,
          y: 60 + Math.floor(elements.length / 2) * 50,
          width: Math.min(150, text.length * 8 + 20),
          height: type === 'heading' ? 32 : 24
        },
        contextNotes: `Simple mock element from ${fileName}`,
        componentType: type,
        hierarchy: `${fileName} > ${frame} > ${type}`,
        isInteractive: ['button', 'link', 'navigation'].includes(type),
        screenSection: section,
        priority: type === 'heading' ? 'high' : 'medium',
        fontSize: type === 'heading' ? 24 : 16,
        fontFamily: 'Inter',
        fontWeight: type === 'heading' ? '600' : '400',
        extractionMetadata: {
          source: 'api' as const,
          confidence: 0.8,
          extractedAt: new Date(),
          extractionMethod: 'Simple Mock Generation v2.0'
        }
      });
    };

    // Create elements based on design type - MUCH SIMPLER
    if (designType === 'mobile') {
      createElement('9:41', 'content', 'header', 'Status Bar');
      createElement('Back', 'navigation', 'header', 'Navigation');
      createElement(fileName.split(' ')[0] || 'App', 'heading', 'header', 'Navigation');
      createElement('Welcome', 'heading', 'main', 'Main Screen');
      createElement('Get Started', 'button', 'main', 'Main Screen');
      createElement('Home', 'navigation', 'navigation', 'Tab Bar');
      createElement('Settings', 'navigation', 'navigation', 'Tab Bar');
    } else if (designType === 'dashboard') {
      createElement(fileName, 'heading', 'header', 'Header');
      createElement('Dashboard', 'navigation', 'header', 'Header');
      createElement('Analytics', 'navigation', 'header', 'Header');
      createElement('Overview', 'heading', 'main', 'Main Content');
      createElement('Total Users', 'label', 'main', 'Metrics');
      createElement('12,345', 'content', 'main', 'Metrics');
    } else {
      // Generic app
      createElement(fileName, 'heading', 'header', 'Header');
      createElement('Home', 'navigation', 'header', 'Navigation');
      createElement('About', 'navigation', 'header', 'Navigation');
      createElement('Welcome', 'heading', 'main', 'Main Content');
      createElement('Get started', 'content', 'main', 'Main Content');
      createElement('Learn More', 'button', 'main', 'Main Content');
    }

    return elements;
  }
}

// Use singleton to prevent multiple instances
export const prototypeAPIManager = PrototypeAPIManager.getInstance();
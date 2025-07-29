import { TextElement } from '../types';

export class FigmaPublicExtractor {
  private static instance: FigmaPublicExtractor;

  static getInstance(): FigmaPublicExtractor {
    if (!FigmaPublicExtractor.instance) {
      FigmaPublicExtractor.instance = new FigmaPublicExtractor();
    }
    return FigmaPublicExtractor.instance;
  }

  async extractTextFromFigmaUrl(url: string): Promise<TextElement[]> {
    console.log('🔍 Attempting to extract text from Figma URL:', url);

    try {
      // Extract file ID from URL
      const fileId = this.extractFileId(url);
      if (!fileId) {
        throw new Error('Could not extract file ID from URL');
      }

      console.log('📁 Extracted file ID:', fileId);

      // Try multiple extraction methods
      const textElements = await this.tryMultipleExtractionMethods(fileId, url);
      
      if (textElements.length > 0) {
        console.log(`✅ Successfully extracted ${textElements.length} text elements from Figma`);
        return textElements;
      } else {
        console.log('⚠️ No text found, generating sample based on design name');
        return this.generateSampleFromUrl(url);
      }

    } catch (error) {
      console.error('❌ Error extracting from Figma:', error);
      // Fallback to sample data based on URL
      return this.generateSampleFromUrl(url);
    }
  }

  private async tryMultipleExtractionMethods(fileId: string, url: string): Promise<TextElement[]> {
    const methods = [
      () => this.tryPublicAPI(fileId),
      () => this.tryEmbedScraping(url),
      () => this.tryPublicSharing(fileId),
    ];

    for (const method of methods) {
      try {
        const result = await method();
        if (result.length > 0) {
          return result;
        }
      } catch (error) {
        console.log('⚠️ Method failed, trying next:', error.message);
      }
    }

    return [];
  }

  private async tryPublicAPI(fileId: string): Promise<TextElement[]> {
    console.log('🔗 Trying public Figma API...');
    
    // Try to access public file info (some files are publicly accessible)
    const publicUrl = `https://api.figma.com/v1/files/${fileId}`;
    
    try {
      const response = await fetch(publicUrl, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return this.parseFigmaAPIResponse(data);
      }
    } catch (error) {
      console.log('Public API not accessible');
    }

    return [];
  }

  private async tryEmbedScraping(url: string): Promise<TextElement[]> {
    console.log('🕷️ Trying embed scraping...');
    
    // Try to get the embed version of the Figma file
    const embedUrl = url.replace('/design/', '/embed/').replace('/file/', '/embed/') + '&embed_host=website';
    
    try {
      const response = await fetch(embedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        }
      });

      if (response.ok) {
        const html = await response.text();
        return this.parseHTMLForText(html, url);
      }
    } catch (error) {
      console.log('Embed scraping failed:', error.message);
    }

    return [];
  }

  private async tryPublicSharing(fileId: string): Promise<TextElement[]> {
    console.log('🌐 Trying public sharing endpoints...');
    
    // Some Figma files have public sharing enabled
    const endpoints = [
      `https://www.figma.com/file/${fileId}?viewer=1`,
      `https://www.figma.com/proto/${fileId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const html = await response.text();
          const textElements = this.parseHTMLForText(html, endpoint);
          if (textElements.length > 0) {
            return textElements;
          }
        }
      } catch (error) {
        console.log(`Endpoint ${endpoint} failed`);
      }
    }

    return [];
  }

  private parseFigmaAPIResponse(data: any): TextElement[] {
    const textElements: TextElement[] = [];
    let elementIndex = 0;

    const traverseNode = (node: any, frameName: string = '') => {
      if (node.type === 'TEXT' && node.characters) {
        textElements.push({
          id: `figma_${elementIndex++}`,
          originalText: node.characters,
          frameName: frameName || node.name || `Frame ${Math.ceil(elementIndex / 5)}`,
          componentPath: `Figma > ${frameName || 'Frame'} > ${node.name || 'Text'}`,
          boundingBox: node.absoluteBoundingBox || { x: 0, y: 0, width: 100, height: 20 },
          contextNotes: `Extracted from Figma API - ${node.name || 'Text Element'}`,
          componentType: this.determineComponentType(node.characters),
          hierarchy: `Figma File > ${frameName} > ${node.name || 'Text'}`,
          isInteractive: this.isLikelyInteractive(node.characters),
          screenSection: this.determineScreenSection(elementIndex),
          priority: this.determinePriority(node.characters, node.style?.fontSize || 16),
          fontSize: node.style?.fontSize || 16,
          fontFamily: node.style?.fontFamily || 'Inter',
          fontWeight: node.style?.fontWeight?.toString() || '400',
          extractionMetadata: {
            source: 'api' as const,
            confidence: 0.95,
            extractedAt: new Date(),
            extractionMethod: 'Figma Public API'
          }
        });
      }

      if (node.children) {
        const currentFrameName = node.type === 'FRAME' ? node.name : frameName;
        node.children.forEach((child: any) => traverseNode(child, currentFrameName));
      }
    };

    if (data.document) {
      traverseNode(data.document);
    }

    return textElements;
  }

  private parseHTMLForText(html: string, url: string): TextElement[] {
    console.log('📄 Parsing HTML content for text...');
    
    // Extract text from common patterns in Figma's HTML structure
    const textPatterns = [
      /"text":\s*"([^"]+)"/g,
      /"characters":\s*"([^"]+)"/g,
      /data-text=["']([^"']+)["']/g,
      /<text[^>]*>([^<]+)<\/text>/g,
      /textContent[^:]*:\s*["']([^"']+)["']/g,
    ];

    const foundTexts = new Set<string>();
    
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const text = match[1].trim();
        if (text.length > 0 && text.length < 200 && !text.includes('\\')) {
          foundTexts.add(text);
        }
      }
    }

    const textElements: TextElement[] = Array.from(foundTexts).map((text, index) => ({
      id: `html_${index + 1}`,
      originalText: text,
      frameName: `Frame ${Math.ceil((index + 1) / 5)}`,
      componentPath: `HTML Extraction > ${this.determineComponentType(text)}`,
      boundingBox: { x: (index % 3) * 200, y: Math.floor(index / 3) * 60, width: 180, height: 40 },
      contextNotes: `Extracted from Figma HTML - Pattern recognition`,
      componentType: this.determineComponentType(text),
      hierarchy: `Figma File > Frame ${Math.ceil((index + 1) / 5)} > ${this.determineComponentType(text)}`,
      isInteractive: this.isLikelyInteractive(text),
      screenSection: this.determineScreenSection(index),
      priority: this.determinePriority(text, 16),
      fontSize: this.determineFontSize(text),
      fontFamily: 'Inter',
      fontWeight: this.determineFontWeight(text),
      extractionMetadata: {
        source: 'scraping' as const,
        confidence: 0.8,
        extractedAt: new Date(),
        extractionMethod: 'HTML Pattern Recognition'
      }
    }));

    console.log(`📝 Found ${textElements.length} text elements from HTML parsing`);
    return textElements;
  }

  private generateSampleFromUrl(url: string): TextElement[] {
    console.log('🎯 Generating intelligent sample based on URL and design patterns');
    
    const fileName = this.extractFileName(url);
    const designType = this.guessDesignType(fileName, url);
    
    // Generate contextual sample data based on the design type and file name
    const sampleTexts = this.getContextualSampleTexts(designType, fileName);
    
    return sampleTexts.map((text, index) => ({
      id: `sample_${index + 1}`,
      originalText: text,
      frameName: `${fileName} Frame ${Math.ceil((index + 1) / 5)}`,
      componentPath: `${fileName} > ${this.determineComponentType(text)}`,
      boundingBox: { x: (index % 3) * 200, y: Math.floor(index / 3) * 60, width: 180, height: 40 },
      contextNotes: `Intelligent sample for ${designType} design - ${fileName}`,
      componentType: this.determineComponentType(text),
      hierarchy: `${fileName} > Frame ${Math.ceil((index + 1) / 5)} > ${this.determineComponentType(text)}`,
      isInteractive: this.isLikelyInteractive(text),
      screenSection: this.determineScreenSection(index),
      priority: this.determinePriority(text, 16),
      fontSize: this.determineFontSize(text),
      fontFamily: 'Inter',
      fontWeight: this.determineFontWeight(text),
      extractionMetadata: {
        source: 'intelligent_sample' as const,
        confidence: 0.7,
        extractedAt: new Date(),
        extractionMethod: 'Contextual Sample Generation'
      }
    }));
  }

  private getContextualSampleTexts(designType: string, fileName: string): string[] {
    const baseTexts = fileName.split(/[-_\s]+/).filter(word => 
      word.length > 2 && !['design', 'figma', 'file', 'prototype'].includes(word.toLowerCase())
    );

    const contextualTexts = baseTexts.map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );

    switch (designType) {
      case 'dashboard':
        return [...contextualTexts, 'Dashboard', 'Overview', 'Analytics', 'Settings', 'Profile', 'Logout', 'Search', 'Filter', 'Export Data', 'Recent Activity'];
      case 'mobile':
        return [...contextualTexts, 'Home', 'Profile', 'Settings', 'Back', 'Next', 'Save', 'Cancel', 'Continue', 'Get Started'];
      case 'ecommerce':
        return [...contextualTexts, 'Shop Now', 'Add to Cart', 'Checkout', 'My Account', 'Wishlist', 'Search Products', 'Filter', 'Sort By'];
      case 'forms':
        return [...contextualTexts, 'Submit', 'Cancel', 'Save Draft', 'Name:', 'Email:', 'Password:', 'Confirm', 'Reset'];
      default:
        return [...contextualTexts, 'Welcome', 'Get Started', 'Learn More', 'Contact Us', 'About', 'Home', 'Services'];
    }
  }

  private extractFileId(url: string): string | null {
    const patterns = [
      /figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/,
      /figma\.com\/[^\/]+\/([a-zA-Z0-9]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  private extractFileName(url: string): string {
    try {
      const match = url.match(/figma\.com\/[^\/]+\/[^\/]+\/([^\/\?]+)/);
      if (match) {
        return decodeURIComponent(match[1])
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }
    } catch (e) {
      console.log('Could not parse file name');
    }
    return 'Figma Design';
  }

  private guessDesignType(fileName: string, url: string): string {
    const lower = (fileName + ' ' + url).toLowerCase();
    
    if (lower.includes('dashboard') || lower.includes('admin') || lower.includes('analytics')) return 'dashboard';
    if (lower.includes('mobile') || lower.includes('app') || lower.includes('ios') || lower.includes('android')) return 'mobile';
    if (lower.includes('shop') || lower.includes('ecommerce') || lower.includes('store') || lower.includes('cart')) return 'ecommerce';
    if (lower.includes('form') || lower.includes('signup') || lower.includes('login') || lower.includes('register')) return 'forms';
    if (lower.includes('landing') || lower.includes('homepage') || lower.includes('website')) return 'website';
    
    return 'general';
  }

  private determineComponentType(text: string): TextElement['componentType'] {
    const lower = text.toLowerCase();
    
    if (lower.includes('click') || lower.includes('submit') || lower.includes('save') || 
        lower.includes('cancel') || lower.includes('continue') || lower.includes('next') ||
        lower.match(/^(ok|yes|no|apply|reset|start|begin)$/)) {
      return 'button';
    }
    
    if (lower.includes('home') || lower.includes('menu') || lower.includes('nav') ||
        lower.includes('about') || lower.includes('contact') || lower.includes('help')) {
      return 'navigation';
    }
    
    if (text.length < 50 && (text === text.toUpperCase() || /^[A-Z]/.test(text))) {
      return 'heading';
    }
    
    if (text.includes(':') || lower.includes('name') || lower.includes('email') || 
        lower.includes('password') || text.length < 20) {
      return 'label';
    }
    
    if (lower.includes('learn more') || lower.includes('read more') || 
        lower.includes('click here') || text.startsWith('http')) {
      return 'link';
    }
    
    return 'content';
  }

  private isLikelyInteractive(text: string): boolean {
    const componentType = this.determineComponentType(text);
    return componentType === 'button' || componentType === 'link' || componentType === 'navigation';
  }

  private determineScreenSection(index: number): TextElement['screenSection'] {
    if (index < 3) return 'header';
    if (index >= 10) return 'footer';
    return 'main';
  }

  private determinePriority(text: string, fontSize: number): TextElement['priority'] {
    if (fontSize > 24 || this.determineComponentType(text) === 'heading') return 'high';
    if (this.isLikelyInteractive(text)) return 'high';
    if (text.length < 30) return 'medium';
    return 'low';
  }

  private determineFontSize(text: string): number {
    const type = this.determineComponentType(text);
    switch (type) {
      case 'heading': return 24;
      case 'button': return 16;
      case 'navigation': return 14;
      case 'label': return 12;
      default: return 14;
    }
  }

  private determineFontWeight(text: string): string {
    const type = this.determineComponentType(text);
    return (type === 'heading' || type === 'button') ? '600' : '400';
  }
}

export default FigmaPublicExtractor;
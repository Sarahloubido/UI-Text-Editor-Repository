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

  // NO FAKE TEXT GENERATION - Only real extraction allowed
  async extractFromURL(url: string): Promise<TextElement[]> {
    console.log('🚫 NO FAKE TEXT: URL import without text generation:', url);
    
    // NO mock data generation - return empty array
    // Real text must come from Screenshot+OCR or API extraction
    console.log('✅ Returning empty array - real extraction required');
    return [];
  }

  // ALL FAKE TEXT GENERATION METHODS REMOVED
  // Only real extraction via Screenshot+OCR or API is supported
}

// Use singleton to prevent multiple instances
export const prototypeAPIManager = PrototypeAPIManager.getInstance();
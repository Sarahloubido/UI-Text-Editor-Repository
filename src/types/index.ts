export interface TextElement {
  id: string;
  originalText: string;
  editedText?: string;
  frameName: string;
  componentPath: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  contextNotes?: string;
  image?: string;
  lastModified?: Date;
  // Enhanced context information
  componentType: 'button' | 'heading' | 'text' | 'link' | 'label' | 'placeholder' | 'tooltip' | 'menu' | 'form' | 'navigation' | 'content' | 'unknown';
  hierarchy: string; // e.g., "Page > Header > Navigation > Menu Item"
  parentComponent?: string;
  nearbyElements?: string[]; // Text of nearby elements for context
  elementRole?: string; // ARIA role or semantic role
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  isInteractive: boolean;
  screenSection: 'header' | 'footer' | 'sidebar' | 'main' | 'modal' | 'navigation' | 'form' | 'content' | 'unknown';
  priority: 'high' | 'medium' | 'low'; // Based on position, size, and importance
  extractionMetadata: {
    source: 'html' | 'image' | 'code' | 'json' | 'api';
    confidence: number; // 0-1, how confident we are in the extraction
    extractedAt: Date;
    extractionMethod: string;
  };
}

export interface Prototype {
  id: string;
  name: string;
  source: 'bolt' | 'figma' | 'cursor';
  url?: string;
  textElements: TextElement[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface DiffItem {
  id: string;
  originalText: string;
  editedText: string;
  frameName: string;
  componentPath: string;
  changeType: 'modified' | 'unchanged';
}

export type WorkflowStep = 'import' | 'export' | 'edit' | 'reimport' | 'publish';
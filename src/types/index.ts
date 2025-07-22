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
import { TextElement, DiffItem } from '../types';

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  characters?: string;
  children?: FigmaNode[];
}

interface FigmaUpdateRequest {
  nodeId: string;
  characters: string;
}

export class FigmaIntegration {
  private static readonly API_BASE = 'https://api.figma.com/v1';
  
  static async updateFigmaFile(
    fileId: string,
    changes: DiffItem[],
    accessToken: string
  ): Promise<{ success: boolean; updatedNodes: number; errors: string[] }> {
    const errors: string[] = [];
    let updatedNodes = 0;

    try {
      // First, get the current file structure to map text elements to node IDs
      const fileData = await this.getFigmaFile(fileId, accessToken);
      const textNodeMap = this.buildTextNodeMap(fileData);

      // Prepare updates for Figma API
      const updates: FigmaUpdateRequest[] = [];
      
      for (const change of changes) {
        const nodeId = this.findNodeIdForTextElement(change, textNodeMap);
        if (nodeId && change.editedText) {
          updates.push({
            nodeId,
            characters: change.editedText
          });
        } else {
          errors.push(`Could not find Figma node for element: ${change.originalText}`);
        }
      }

      // Apply updates to Figma
      for (const update of updates) {
        try {
          await this.updateTextNode(fileId, update.nodeId, update.characters, accessToken);
          updatedNodes++;
        } catch (error) {
          errors.push(`Failed to update node ${update.nodeId}: ${error}`);
        }
      }

      return {
        success: updatedNodes > 0,
        updatedNodes,
        errors
      };

    } catch (error) {
      return {
        success: false,
        updatedNodes: 0,
        errors: [`Failed to update Figma file: ${error}`]
      };
    }
  }

  private static async getFigmaFile(fileId: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.API_BASE}/files/${fileId}`, {
      headers: {
        'X-Figma-Token': accessToken,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Figma file: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private static async updateTextNode(
    fileId: string, 
    nodeId: string, 
    newText: string, 
    accessToken: string
  ): Promise<void> {
    // Note: The Figma REST API is read-only and cannot directly update text nodes
    // This method simulates what would happen with a plugin-based approach
    throw new Error(
      'Direct Figma file editing via REST API is not supported. ' +
      'The Figma REST API is read-only. To edit Figma files programmatically, ' +
      'you would need to create a Figma Plugin or use Figma\'s Plugin API.'
    );
  }

  private static buildTextNodeMap(figmaData: any): Map<string, { nodeId: string; text: string; path: string }> {
    const textNodes = new Map();
    
    const traverse = (node: any, path: string = '') => {
      if (node.type === 'TEXT' && node.characters) {
        const fullPath = path ? `${path}/${node.name}` : node.name;
        textNodes.set(node.characters.trim().toLowerCase(), {
          nodeId: node.id,
          text: node.characters,
          path: fullPath
        });
      }
      
      if (node.children) {
        const currentPath = path ? `${path}/${node.name}` : node.name;
        node.children.forEach((child: any) => traverse(child, currentPath));
      }
    };

    if (figmaData.document) {
      traverse(figmaData.document);
    }

    return textNodes;
  }

  private static findNodeIdForTextElement(
    change: DiffItem, 
    textNodeMap: Map<string, { nodeId: string; text: string; path: string }>
  ): string | null {
    // Try exact match first
    const exactMatch = textNodeMap.get(change.originalText.trim().toLowerCase());
    if (exactMatch) {
      return exactMatch.nodeId;
    }

    // Try partial matches
    for (const [text, nodeInfo] of textNodeMap.entries()) {
      if (text.includes(change.originalText.trim().toLowerCase()) || 
          change.originalText.trim().toLowerCase().includes(text)) {
        return nodeInfo.nodeId;
      }
    }

    return null;
  }

  static validateFigmaToken(token: string): boolean {
    return token && token.startsWith('figd_') && token.length > 20;
  }

  static extractFileIdFromUrl(url: string): string | null {
    const match = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]{22,128})/);
    return match ? match[1] : null;
  }

  static async testConnection(fileId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': accessToken,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Generate Figma access token instructions
  static getTokenInstructions(): string {
    return `To edit your Figma file directly, you need a Figma Personal Access Token:

1. Go to Figma.com → Settings → Account
2. Scroll to "Personal Access Tokens" 
3. Click "Create a new personal access token"
4. Give it a name like "Prototype Text Editor"
5. Copy the token (starts with 'figd_')
6. Paste it below

Note: This token allows editing your Figma files, so keep it secure!`;
  }
}
import { TextElement } from '../types';

// Figma API response types
interface FigmaFile {
  document: FigmaNode;
  name: string;
  lastModified: string;
  version: string;
}

interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  characters?: string;
  style?: {
    fontSize?: number;
    fontWeight?: number;
    fontFamily?: string;
  };
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export class FigmaAuthenticator {
  private static instance: FigmaAuthenticator | null = null;
  private accessToken: string | null = null;
  private authMethod: 'token' | 'oauth' | 'enterprise' | null = null;

  // OAuth configuration
  private readonly FIGMA_CLIENT_ID = 'your-figma-client-id'; // You'll need to register with Figma
  private readonly REDIRECT_URI = `${window.location.origin}/auth/figma/callback`;
  private readonly FIGMA_OAUTH_URL = 'https://www.figma.com/oauth';
  private readonly FIGMA_API_BASE = 'https://api.figma.com/v1';

  static getInstance(): FigmaAuthenticator {
    if (!FigmaAuthenticator.instance) {
      FigmaAuthenticator.instance = new FigmaAuthenticator();
    }
    return FigmaAuthenticator.instance;
  }

  // Method 1: Personal Access Token Authentication
  async authenticateWithToken(token: string): Promise<boolean> {
    try {
      console.log('🔐 Authenticating with personal access token...');
      
      // Test the token by making a simple API call
      const response = await fetch(`${this.FIGMA_API_BASE}/me`, {
        headers: {
          'X-Figma-Token': token
        }
      });

      if (response.ok) {
        const user = await response.json();
        this.accessToken = token;
        this.authMethod = 'token';
        console.log('✅ Token authentication successful:', user.email);
        
        // Store token securely (consider encryption for production)
        localStorage.setItem('figma_access_token', token);
        localStorage.setItem('figma_auth_method', 'token');
        
        return true;
      } else {
        console.error('❌ Token authentication failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Token authentication error:', error);
      return false;
    }
  }

  // Method 2: OAuth 2.0 Flow (Chrome/Browser Authentication)
  async authenticateWithOAuth(): Promise<boolean> {
    try {
      console.log('🔐 Starting OAuth authentication flow...');
      
      const state = this.generateRandomState();
      localStorage.setItem('figma_oauth_state', state);
      
      const authUrl = new URL(this.FIGMA_OAUTH_URL);
      authUrl.searchParams.set('client_id', this.FIGMA_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', this.REDIRECT_URI);
      authUrl.searchParams.set('scope', 'file_read');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('response_type', 'code');

      // Open OAuth flow in popup window
      const popup = window.open(
        authUrl.toString(),
        'figma-oauth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      return new Promise((resolve) => {
        const pollTimer = setInterval(() => {
          try {
            if (popup?.closed) {
              clearInterval(pollTimer);
              resolve(false);
            }

            // Check if we got redirected back with auth code
            if (popup?.location.href.includes(this.REDIRECT_URI)) {
              const url = new URL(popup.location.href);
              const code = url.searchParams.get('code');
              const returnedState = url.searchParams.get('state');
              
              popup.close();
              clearInterval(pollTimer);

              if (code && returnedState === state) {
                this.exchangeCodeForToken(code).then(resolve);
              } else {
                resolve(false);
              }
            }
          } catch (e) {
            // Cross-origin error is expected until redirect
          }
        }, 1000);

        // Timeout after 5 minutes
        setTimeout(() => {
          clearInterval(pollTimer);
          popup?.close();
          resolve(false);
        }, 300000);
      });
    } catch (error) {
      console.error('❌ OAuth authentication error:', error);
      return false;
    }
  }

  // Method 3: Enterprise/Network Authentication
  async authenticateWithEnterprise(workspaceId?: string): Promise<boolean> {
    try {
      console.log('🏢 Attempting enterprise authentication...');
      
      // This would integrate with your Pendo network authentication
      // You might have a backend endpoint that handles enterprise Figma access
      const response = await fetch('/api/figma/enterprise-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          // Include your Pendo user context
          userContext: await this.getPendoUserContext()
        })
      });

      if (response.ok) {
        const { accessToken } = await response.json();
        this.accessToken = accessToken;
        this.authMethod = 'enterprise';
        
        console.log('✅ Enterprise authentication successful');
        return true;
      } else {
        console.error('❌ Enterprise authentication failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Enterprise authentication error:', error);
      return false;
    }
  }

  // Extract real text from Figma file using authenticated API
  async extractTextFromFigmaFile(fileId: string): Promise<TextElement[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated with Figma');
    }

    try {
      console.log('📄 Fetching Figma file:', fileId);

      const response = await fetch(`${this.FIGMA_API_BASE}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': this.accessToken
        }
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status}`);
      }

      const figmaFile: FigmaFile = await response.json();
      console.log('✅ Successfully fetched Figma file:', figmaFile.name);

      // Extract text elements from Figma node tree
      const textElements = this.extractTextFromNodes(figmaFile.document, figmaFile.name);
      
      console.log(`📝 Extracted ${textElements.length} real text elements from Figma`);
      return textElements;

    } catch (error) {
      console.error('❌ Failed to extract text from Figma:', error);
      throw error;
    }
  }

  // Recursively extract text from Figma node tree
  private extractTextFromNodes(node: FigmaNode, fileName: string, path: string = ''): TextElement[] {
    const textElements: TextElement[] = [];
    const currentPath = path ? `${path} > ${node.name}` : node.name;

    // If this node has text content
    if (node.characters && node.characters.trim()) {
      const element: TextElement = {
        id: node.id,
        originalText: node.characters.trim(),
        frameName: this.getFrameName(currentPath),
        componentPath: currentPath,
        boundingBox: node.absoluteBoundingBox ? {
          x: node.absoluteBoundingBox.x,
          y: node.absoluteBoundingBox.y,
          width: node.absoluteBoundingBox.width,
          height: node.absoluteBoundingBox.height
        } : { x: 0, y: 0, width: 100, height: 20 },
        contextNotes: `Real text from Figma file: ${fileName}`,
        componentType: this.determineComponentType(node, node.characters),
        hierarchy: `${fileName} > ${currentPath}`,
        isInteractive: this.isInteractiveComponent(node),
        screenSection: this.determineScreenSection(node),
        priority: this.determinePriority(node, node.characters),
        fontSize: node.style?.fontSize || 16,
        fontFamily: node.style?.fontFamily || 'Unknown',
        fontWeight: node.style?.fontWeight?.toString() || '400',
        extractionMetadata: {
          source: 'api' as const,
          confidence: 1.0, // 100% confidence for real Figma data
          extractedAt: new Date(),
          extractionMethod: `Figma API (${this.authMethod})`
        }
      };

      textElements.push(element);
    }

    // Recursively process child nodes
    if (node.children) {
      for (const child of node.children) {
        textElements.push(...this.extractTextFromNodes(child, fileName, currentPath));
      }
    }

    return textElements;
  }

  // Helper methods
  private generateRandomState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async exchangeCodeForToken(code: string): Promise<boolean> {
    try {
      // This would typically be done on your backend to keep client secret secure
      const response = await fetch('/api/figma/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          redirect_uri: this.REDIRECT_URI
        })
      });

      if (response.ok) {
        const { access_token } = await response.json();
        this.accessToken = access_token;
        this.authMethod = 'oauth';
        
        localStorage.setItem('figma_access_token', access_token);
        localStorage.setItem('figma_auth_method', 'oauth');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Token exchange failed:', error);
      return false;
    }
  }

  private async getPendoUserContext(): Promise<any> {
    // Integration with Pendo's user context
    // This would depend on how Pendo exposes user information
    try {
      // @ts-ignore - Pendo global object
      if (typeof pendo !== 'undefined') {
        return {
          // @ts-ignore
          userId: pendo.get('visitor.id'),
          // @ts-ignore
          userEmail: pendo.get('visitor.email'),
          // @ts-ignore
          accountId: pendo.get('account.id')
        };
      }
    } catch (e) {
      console.log('Pendo context not available');
    }
    return {};
  }

  private getFrameName(path: string): string {
    const parts = path.split(' > ');
    return parts[Math.max(0, parts.length - 2)] || 'Main Frame';
  }

  private determineComponentType(node: FigmaNode, text: string): TextElement['componentType'] {
    const nodeName = node.name.toLowerCase();
    const textLower = text.toLowerCase();

    if (nodeName.includes('button') || textLower.includes('click') || textLower.includes('submit')) {
      return 'button';
    }
    if (nodeName.includes('nav') || nodeName.includes('menu') || textLower.includes('home')) {
      return 'navigation';
    }
    if (nodeName.includes('head') || node.type === 'TEXT' && text.length < 50) {
      return 'heading';
    }
    if (nodeName.includes('label') || textLower.includes(':')) {
      return 'label';
    }
    if (nodeName.includes('link')) {
      return 'link';
    }
    
    return 'content';
  }

  private isInteractiveComponent(node: FigmaNode): boolean {
    const nodeName = node.name.toLowerCase();
    return nodeName.includes('button') || 
           nodeName.includes('link') || 
           nodeName.includes('nav') ||
           node.type === 'INSTANCE'; // Component instances are often interactive
  }

  private determineScreenSection(node: FigmaNode): TextElement['screenSection'] {
    const nodeName = node.name.toLowerCase();
    const y = node.absoluteBoundingBox?.y || 0;

    if (nodeName.includes('header') || y < 100) return 'header';
    if (nodeName.includes('footer') || nodeName.includes('bottom')) return 'footer';
    if (nodeName.includes('nav') || nodeName.includes('menu')) return 'navigation';
    
    return 'main';
  }

  private determinePriority(node: FigmaNode, text: string): TextElement['priority'] {
    const fontSize = node.style?.fontSize || 16;
    const nodeName = node.name.toLowerCase();

    if (fontSize > 24 || nodeName.includes('title') || nodeName.includes('head')) {
      return 'high';
    }
    if (nodeName.includes('button') || this.isInteractiveComponent(node)) {
      return 'high';
    }
    if (text.length < 30) {
      return 'medium';
    }
    
    return 'low';
  }

  // Check if user is already authenticated
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }

  // Restore authentication from storage
  async restoreAuthentication(): Promise<boolean> {
    const token = localStorage.getItem('figma_access_token');
    const method = localStorage.getItem('figma_auth_method') as typeof this.authMethod;

    if (token && method) {
      this.accessToken = token;
      this.authMethod = method;
      console.log(`🔐 Restored ${method} authentication`);
      return true;
    }

    return false;
  }

  // Clear authentication
  logout(): void {
    this.accessToken = null;
    this.authMethod = null;
    localStorage.removeItem('figma_access_token');
    localStorage.removeItem('figma_auth_method');
    console.log('🔐 Logged out of Figma');
  }

  // Get current authentication status
  getAuthStatus(): { isAuthenticated: boolean; method: string | null; hasToken: boolean } {
    return {
      isAuthenticated: this.isAuthenticated(),
      method: this.authMethod,
      hasToken: !!this.accessToken
    };
  }
}

export default FigmaAuthenticator;
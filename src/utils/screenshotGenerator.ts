import { TextElement } from '../types';

export class ScreenshotGenerator {
  private static canvas: HTMLCanvasElement | null = null;
  private static ctx: CanvasRenderingContext2D | null = null;

  private static getCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d');
      if (!this.ctx) {
        throw new Error('Could not get canvas context');
      }
    }
    return { canvas: this.canvas, ctx: this.ctx! };
  }

  static generateElementPreview(element: TextElement, designType: string = 'mobile'): string {
    const { canvas, ctx } = this.getCanvas();
    
    // Set canvas size based on design type
    const canvasWidth = designType === 'mobile' ? 300 : 400;
    const canvasHeight = 200;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw background frame
    this.drawFrameBackground(ctx, element, canvasWidth, canvasHeight);

    // Draw the text element with highlight
    this.drawTextElement(ctx, element, canvasWidth, canvasHeight);

    // Draw context elements
    this.drawContextElements(ctx, element, canvasWidth, canvasHeight);

    return canvas.toDataURL('image/png');
  }

  private static drawFrameBackground(ctx: CanvasRenderingContext2D, element: TextElement, width: number, height: number): void {
    // Draw frame background based on screen section
    const frameColor = this.getFrameColor(element.screenSection);
    
    // Frame border
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Frame background
    ctx.fillStyle = frameColor;
    ctx.fillRect(10, 10, width - 20, height - 20);

    // Frame label
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(element.frameName || 'Frame', 15, 25);

    // Screen section indicator
    const sectionColor = this.getSectionColor(element.screenSection);
    ctx.fillStyle = sectionColor;
    ctx.fillRect(width - 80, 15, 60, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(element.screenSection.toUpperCase(), width - 50, 27);
    ctx.textAlign = 'left';
  }

  private static drawTextElement(ctx: CanvasRenderingContext2D, element: TextElement, width: number, height: number): void {
    // Calculate element position within preview
    const elementX = 20 + (element.boundingBox.x % 200);
    const elementY = 50 + (element.boundingBox.y % 100);
    const elementWidth = Math.min(width - 40, Math.max(100, element.boundingBox.width || 150));
    const elementHeight = Math.max(20, element.boundingBox.height || 30);

    // Highlight background for the text element
    const highlightColor = this.getComponentColor(element.componentType);
    ctx.fillStyle = highlightColor + '40'; // Add transparency
    ctx.fillRect(elementX - 5, elementY - 5, elementWidth + 10, elementHeight + 10);
    
    // Border around the element
    ctx.strokeStyle = highlightColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(elementX - 5, elementY - 5, elementWidth + 10, elementHeight + 10);

    // Draw the actual text
    ctx.fillStyle = '#1e293b';
    const fontSize = Math.min(element.fontSize || 14, 14);
    ctx.font = `${element.fontWeight || '400'} ${fontSize}px ${element.fontFamily || 'Inter'}, sans-serif`;
    
    // Truncate text if too long
    let displayText = element.originalText;
    if (displayText.length > 25) {
      displayText = displayText.substring(0, 22) + '...';
    }
    
    ctx.fillText(displayText, elementX, elementY + fontSize);

    // Component type label
    ctx.fillStyle = highlightColor;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(element.componentType.toUpperCase(), elementX, elementY - 8);
  }

  private static drawContextElements(ctx: CanvasRenderingContext2D, element: TextElement, width: number, height: number): void {
    // Draw some context elements based on component type and screen section
    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;

    switch (element.screenSection) {
      case 'header':
        this.drawHeaderContext(ctx, width);
        break;
      case 'navigation':
        this.drawNavigationContext(ctx, width, height);
        break;
      case 'main':
        this.drawMainContent(ctx, width, height);
        break;
      case 'footer':
        this.drawFooterContext(ctx, width, height);
        break;
      case 'sidebar':
        this.drawSidebarContext(ctx, width, height);
        break;
    }
  }

  private static drawHeaderContext(ctx: CanvasRenderingContext2D, width: number): void {
    // Header background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(15, 35, width - 30, 30);
    ctx.strokeRect(15, 35, width - 30, 30);
    
    // Navigation items
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(25 + i * 60, 45, 50, 10);
    }
  }

  private static drawNavigationContext(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Bottom navigation
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(15, height - 45, width - 30, 30);
    ctx.strokeRect(15, height - 45, width - 30, 30);
    
    // Nav icons
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(25 + i * 70, height - 35, 15, 15);
    }
  }

  private static drawMainContent(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Content cards
    for (let i = 0; i < 2; i++) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(20, 80 + i * 40, width - 40, 30);
      ctx.strokeRect(20, 80 + i * 40, width - 40, 30);
    }
  }

  private static drawFooterContext(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Footer background
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(15, height - 35, width - 30, 20);
    ctx.strokeRect(15, height - 35, width - 30, 20);
  }

  private static drawSidebarContext(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Sidebar
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(15, 40, 60, height - 55);
    ctx.strokeRect(15, 40, 60, height - 55);
    
    // Sidebar items
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(20, 50 + i * 25, 50, 15);
    }
  }

  private static getFrameColor(screenSection: string): string {
    switch (screenSection) {
      case 'header': return '#f0f9ff';
      case 'navigation': return '#f3f4f6';
      case 'main': return '#ffffff';
      case 'sidebar': return '#fafafa';
      case 'footer': return '#f9fafb';
      case 'modal': return '#fef7ff';
      case 'form': return '#f0fdf4';
      default: return '#ffffff';
    }
  }

  private static getSectionColor(screenSection: string): string {
    switch (screenSection) {
      case 'header': return '#3b82f6';
      case 'navigation': return '#6366f1';
      case 'main': return '#10b981';
      case 'sidebar': return '#8b5cf6';
      case 'footer': return '#6b7280';
      case 'modal': return '#ec4899';
      case 'form': return '#059669';
      default: return '#64748b';
    }
  }

  private static getComponentColor(componentType: string): string {
    switch (componentType) {
      case 'button': return '#3b82f6';
      case 'heading': return '#1e40af';
      case 'navigation': return '#6366f1';
      case 'link': return '#0ea5e9';
      case 'label': return '#059669';
      case 'content': return '#4b5563';
      case 'placeholder': return '#9ca3af';
      default: return '#64748b';
    }
  }

  static generateBatchPreviews(elements: TextElement[], designType: string = 'mobile'): { [key: string]: string } {
    const previews: { [key: string]: string } = {};
    
    elements.forEach(element => {
      try {
        previews[element.id] = this.generateElementPreview(element, designType);
      } catch (error) {
        console.warn(`Failed to generate preview for element ${element.id}:`, error);
        previews[element.id] = this.generateFallbackPreview(element);
      }
    });
    
    return previews;
  }

  private static generateFallbackPreview(element: TextElement): string {
    const { canvas, ctx } = this.getCanvas();
    canvas.width = 300;
    canvas.height = 100;
    
    // Simple fallback
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 300, 100);
    
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText('Preview unavailable', 10, 30);
    
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(element.componentType + ' in ' + element.frameName, 10, 50);
    
    return canvas.toDataURL('image/png');
  }
}
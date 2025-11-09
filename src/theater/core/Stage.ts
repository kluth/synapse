/**
 * Stage - Component rendering and observation platform
 *
 * The Stage is where components are mounted and rendered for observation.
 * It provides isolation, viewport management, and device emulation.
 */

import { EventEmitter } from 'events';

/**
 * Viewport size
 */
export interface Viewport {
  width: number;
  height: number;
  label?: string;
}

/**
 * Predefined viewport sizes
 */
export const VIEWPORTS = {
  mobile: { width: 375, height: 667, label: 'iPhone SE' },
  mobileL: { width: 428, height: 926, label: 'iPhone 14 Pro Max' },
  tablet: { width: 768, height: 1024, label: 'iPad' },
  tabletL: { width: 1024, height: 1366, label: 'iPad Pro' },
  laptop: { width: 1366, height: 768, label: 'Laptop' },
  desktop: { width: 1920, height: 1080, label: 'Desktop HD' },
  desktopL: { width: 2560, height: 1440, label: 'Desktop 2K' },
} as const;

/**
 * Stage isolation mode
 */
export type IsolationMode = 'iframe' | 'shadow-dom' | 'none';

/**
 * Stage configuration
 */
export interface StageConfig {
  /**
   * Isolation mode for rendering
   * @default 'iframe'
   */
  isolation?: IsolationMode;

  /**
   * Initial viewport
   */
  viewport?: Viewport;

  /**
   * Enable responsive testing
   * @default true
   */
  responsive?: boolean;

  /**
   * Background color
   */
  backgroundColor?: string;

  /**
   * Padding around component
   */
  padding?: number;

  /**
   * Enable screenshot capture
   * @default true
   */
  screenshots?: boolean;
}

/**
 * Mounted component reference
 */
export interface MountedComponent {
  id: string;
  element: HTMLElement;
  timestamp: number;
}

/**
 * Stage - Component rendering platform
 */
export class Stage extends EventEmitter {
  private container: HTMLElement | null = null;
  private mountedComponent: MountedComponent | null = null;
  private viewport: Viewport;
  private isolation: IsolationMode;
  private backgroundColor: string;
  private padding: number;
  private responsive: boolean;
  private screenshotsEnabled: boolean;

  constructor(config: StageConfig = {}) {
    super();
    this.isolation = config.isolation ?? 'iframe';
    this.viewport = config.viewport ?? VIEWPORTS.desktop;
    this.responsive = config.responsive ?? true;
    this.backgroundColor = config.backgroundColor ?? '#ffffff';
    this.padding = config.padding ?? 16;
    this.screenshotsEnabled = config.screenshots ?? true;
  }

  /**
   * Initialize the stage
   */
  public async initialize(container: HTMLElement): Promise<void> {
    this.container = container;
    this.createStageDOM();
    this.emit('initialized');
  }

  /**
   * Mount a component on the stage
   */
  public async mount(element: HTMLElement, id: string = 'component'): Promise<void> {
    if (this.mountedComponent !== null) {
      await this.unmount();
    }

    if (this.container === null) {
      throw new Error('Stage not initialized');
    }

    const mounted: MountedComponent = {
      id,
      element,
      timestamp: Date.now(),
    };

    // Mount in isolation
    switch (this.isolation) {
      case 'iframe':
        await this.mountInIframe(element);
        break;
      case 'shadow-dom':
        await this.mountInShadowDOM(element);
        break;
      case 'none':
        this.container.appendChild(element);
        break;
    }

    this.mountedComponent = mounted;
    this.emit('mounted', { id, element });
  }

  /**
   * Unmount the current component
   */
  public async unmount(): Promise<void> {
    if (this.mountedComponent === null || this.container === null) {
      return;
    }

    const { id } = this.mountedComponent;

    // Clear container
    while (this.container.firstChild !== null) {
      this.container.removeChild(this.container.firstChild);
    }

    this.emit('unmounted', { id });
    this.mountedComponent = null;
  }

  /**
   * Set viewport size
   */
  public setViewport(viewport: Viewport): void {
    this.viewport = viewport;
    this.applyViewport();
    this.emit('viewport:change', { viewport });
  }

  /**
   * Get current viewport
   */
  public getViewport(): Viewport {
    return { ...this.viewport };
  }

  /**
   * Resize to specific dimensions
   */
  public resize(width: number, height: number): void {
    this.viewport = { width, height };
    this.applyViewport();
    this.emit('resize', { width, height });
  }

  /**
   * Set background color
   */
  public setBackgroundColor(color: string): void {
    this.backgroundColor = color;
    if (this.container !== null) {
      this.container.style.backgroundColor = color;
    }
    this.emit('background:change', { color });
  }

  /**
   * Capture screenshot of current stage
   */
  public async captureScreenshot(): Promise<string | null> {
    if (!this.screenshotsEnabled || this.container === null) {
      return null;
    }

    // This would integrate with a screenshot library like html2canvas
    // For now, return a placeholder
    return `data:image/png;base64,screenshot-placeholder-${Date.now()}`;
  }

  /**
   * Get mounted component
   */
  public getMountedComponent(): MountedComponent | null {
    return this.mountedComponent;
  }

  /**
   * Check if a component is mounted
   */
  public hasMountedComponent(): boolean {
    return this.mountedComponent !== null;
  }

  /**
   * Cleanup the stage
   */
  public async cleanup(): Promise<void> {
    await this.unmount();
    if (this.container !== null) {
      this.container.innerHTML = '';
    }
    this.emit('cleanup');
  }

  /**
   * Create stage DOM structure
   */
  private createStageDOM(): void {
    if (this.container === null) {
      return;
    }

    this.container.style.backgroundColor = this.backgroundColor;
    this.container.style.padding = `${this.padding}px`;
    this.container.style.overflow = 'auto';
    this.applyViewport();
  }

  /**
   * Apply viewport dimensions
   */
  private applyViewport(): void {
    if (this.container === null) {
      return;
    }

    if (this.responsive) {
      this.container.style.width = `${this.viewport.width}px`;
      this.container.style.height = `${this.viewport.height}px`;
    } else {
      this.container.style.width = '100%';
      this.container.style.height = '100%';
    }
  }

  /**
   * Mount component in iframe
   */
  private async mountInIframe(element: HTMLElement): Promise<void> {
    if (this.container === null) {
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';

    this.container.appendChild(iframe);

    const iframeDoc = iframe.contentDocument;
    if (iframeDoc !== null) {
      iframeDoc.body.appendChild(element);
    }
  }

  /**
   * Mount component in Shadow DOM
   */
  private async mountInShadowDOM(element: HTMLElement): Promise<void> {
    if (this.container === null) {
      return;
    }

    const wrapper = document.createElement('div');
    const shadowRoot = wrapper.attachShadow({ mode: 'open' });
    shadowRoot.appendChild(element);
    this.container.appendChild(wrapper);
  }

  /**
   * Get stage statistics
   */
  public getStats(): {
    hasMounted: boolean;
    viewport: Viewport;
    isolation: IsolationMode;
    backgroundColor: string;
  } {
    return {
      hasMounted: this.hasMountedComponent(),
      viewport: this.getViewport(),
      isolation: this.isolation,
      backgroundColor: this.backgroundColor,
    };
  }
}

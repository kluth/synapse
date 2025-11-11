/**
 * TestSubject - Component Wrapper for Testing
 *
 * TestSubject wraps a VisualNeuron component for testing,
 * providing helpers for inspecting state, props, render output,
 * and simulating interactions.
 */

import type { SkinCell, SkinCellProps } from '../../ui/SkinCell';
import type { Stage } from '../core/Stage';

/**
 * Test subject configuration
 */
export interface TestSubjectConfig<TProps extends SkinCellProps = SkinCellProps> {
  /**
   * Component to test
   */
  component: SkinCell<TProps, any>;

  /**
   * Initial props
   */
  initialProps?: Partial<TProps>;

  /**
   * Stage for rendering (currently not used in test implementation)
   */
  _stage?: Stage;

  /**
   * Auto-mount on creation
   */
  autoMount?: boolean;
}

/**
 * Interaction simulation
 */
export interface Interaction {
  /**
   * Interaction type
   */
  type: 'click' | 'input' | 'focus' | 'blur' | 'keydown' | 'keyup' | 'custom';

  /**
   * Target element selector (if applicable)
   */
  target?: string;

  /**
   * Interaction data
   */
  data?: unknown;

  /**
   * Delay before interaction (ms)
   */
  delay?: number;
}

/**
 * TestSubject - Component testing wrapper
 */
export class TestSubject<TProps extends SkinCellProps = SkinCellProps> {
  private component: SkinCell<TProps, any>;
  // stage is configured but not used in current test implementation
  private mounted: boolean = false;
  private renderCount: number = 0;
  private lastRenderOutput: string = '';
  private interactions: Interaction[] = [];

  constructor(config: TestSubjectConfig<TProps>) {
    this.component = config.component;

    // Stage is currently not used in test implementation
    // Would be used for actual DOM rendering

    if (config.initialProps !== undefined) {
      this.component.updateProps(config.initialProps);
    }

    if (config.autoMount === true) {
      void this.mount();
    }
  }

  /**
   * Get the wrapped component
   */
  public getComponent(): SkinCell<TProps, any> {
    return this.component;
  }

  /**
   * Mount the component
   */
  public async mount(): Promise<void> {
    if (this.mounted) {
      return;
    }

    await this.component.activate();

    // Note: Stage.mount() expects HTMLElement, not VisualNeuron
    // In a real implementation, this would mount the rendered output to the DOM
    // For testing purposes, we just activate the component

    this.mounted = true;
    this.render();
  }

  /**
   * Unmount the component
   */
  public async unmount(): Promise<void> {
    if (!this.mounted) {
      return;
    }

    // Note: Stage.unmount() would be called in a real implementation
    // For testing, we just deactivate the component

    await this.component.deactivate();
    this.mounted = false;
  }

  /**
   * Re-render the component
   */
  public render(): string {
    const renderSignal = this.component.render();
    // Convert RenderSignal to string for testing purposes
    this.lastRenderOutput = this.convertRenderSignalToString(renderSignal);
    this.renderCount++;
    return this.lastRenderOutput;
  }

  /**
   * Convert RenderSignal to string representation
   */
  private convertRenderSignalToString(signal: {
    type: string;
    data: { vdom: unknown; styles?: unknown; metadata?: unknown };
  }): string {
    // Convert VDOM to HTML string for testing
    return this.vdomToString(signal.data.vdom);
  }

  /**
   * Convert VDOM node to HTML string
   */
  private vdomToString(vdom: unknown): string {
    if (typeof vdom === 'string') {
      return vdom;
    }

    if (typeof vdom !== 'object' || vdom === null) {
      return '';
    }

    const node = vdom as { tag?: string; props?: Record<string, unknown>; children?: unknown[] };

    if (node.tag === undefined) {
      return '';
    }

    const { tag, props, children } = node;

    // Build attributes
    const attrs = props !== undefined ? this.propsToAttributes(props) : '';

    // Build children
    const childrenHTML =
      children !== undefined ? children.map((child) => this.vdomToString(child)).join('') : '';

    return `<${tag}${attrs}>${childrenHTML}</${tag}>`;
  }

  /**
   * Convert props object to HTML attributes
   */
  private propsToAttributes(props: Record<string, unknown>): string {
    const entries = Object.entries(props);

    if (entries.length === 0) {
      return '';
    }

    const attrs = entries
      .map(([key, value]) => {
        // Handle className specially
        const attrName = key === 'className' ? 'class' : key;
        return `${attrName}="${String(value)}"`;
      })
      .join(' ');

    return ` ${attrs}`;
  }

  /**
   * Get current render output
   */
  public getRenderOutput(): string {
    return this.lastRenderOutput;
  }

  /**
   * Get render count
   */
  public getRenderCount(): number {
    return this.renderCount;
  }

  /**
   * Get component props
   */
  public getProps(): Partial<TProps> {
    // Access props through component's public interface
    return { ...this.component.getProps() } as Partial<TProps>;
  }

  /**
   * Update component props
   */
  public setProps(props: Partial<TProps>): void {
    this.component.updateProps(props);
    this.render();
  }

  /**
   * Get component state
   */
  public getState(): Record<string, unknown> {
    // Access state through component's public interface
    return { ...this.component.getState() };
  }

  /**
   * Update component state
   */
  public setState(state: Partial<Record<string, unknown>>): void {
    // Use setState method from VisualNeuron
    this.component.setState(state);
    this.render();
  }

  /**
   * Check if component is mounted
   */
  public isMounted(): boolean {
    return this.mounted;
  }

  /**
   * Check if component is active
   */
  public isActive(): boolean {
    return this.component.state === 'active';
  }

  /**
   * Simulate an interaction
   */
  public async interact(interaction: Interaction): Promise<void> {
    this.interactions.push(interaction);

    // Delay if specified
    if (interaction.delay !== undefined && interaction.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, interaction.delay));
    }

    // Handle different interaction types
    switch (interaction.type) {
      case 'click':
        await this.simulateClick(interaction);
        break;
      case 'input':
        await this.simulateInput(interaction);
        break;
      case 'focus':
        await this.simulateFocus();
        break;
      case 'blur':
        await this.simulateBlur();
        break;
      case 'keydown':
      case 'keyup':
        await this.simulateKeyboard(interaction);
        break;
      case 'custom':
        // Custom interactions handled by user
        break;
    }

    // Re-render after interaction
    this.render();
  }

  /**
   * Simulate click interaction
   */
  private async simulateClick(_interaction: Interaction): Promise<void> {
    // Emit a signal to the component simulating a click
    // In a real implementation, this would interact with the DOM
    // For testing, we just trigger a re-render
    // Note: The actual signal sending would require proper Signal type matching
    await Promise.resolve(); // Placeholder for interaction logic
  }

  /**
   * Simulate input interaction
   */
  private async simulateInput(_interaction: Interaction): Promise<void> {
    // Simulate input by updating state or props
    // Placeholder for actual interaction logic
    await Promise.resolve();
  }

  /**
   * Simulate focus interaction
   */
  private async simulateFocus(): Promise<void> {
    // Simulate focus event
    // Placeholder for actual interaction logic
    await Promise.resolve();
  }

  /**
   * Simulate blur interaction
   */
  private async simulateBlur(): Promise<void> {
    // Simulate blur event
    // Placeholder for actual interaction logic
    await Promise.resolve();
  }

  /**
   * Simulate keyboard interaction
   */
  private async simulateKeyboard(_interaction: Interaction): Promise<void> {
    // Simulate keyboard event
    // Placeholder for actual interaction logic
    await Promise.resolve();
  }

  /**
   * Get interaction history
   */
  public getInteractions(): Interaction[] {
    return [...this.interactions];
  }

  /**
   * Clear interaction history
   */
  public clearInteractions(): void {
    this.interactions = [];
  }

  /**
   * Wait for next render
   */
  public async waitForRender(timeout: number = 1000): Promise<string> {
    const startRenderCount = this.renderCount;

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (this.renderCount > startRenderCount) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          resolve(this.lastRenderOutput);
        }
      }, 10);

      const timeoutHandle = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for render'));
      }, timeout);
    });
  }

  /**
   * Wait for specific condition
   */
  public async waitFor(
    condition: () => boolean,
    options: { timeout?: number; interval?: number } = {},
  ): Promise<void> {
    const timeout = options.timeout ?? 1000;
    const interval = options.interval ?? 10;

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (condition()) {
          clearInterval(checkInterval);
          clearTimeout(timeoutHandle);
          resolve();
        }
      }, interval);

      const timeoutHandle = setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout waiting for condition'));
      }, timeout);
    });
  }

  /**
   * Find element in render output
   */
  public find(selector: string): boolean {
    // Simple selector matching (could be enhanced with real DOM querying)
    return this.lastRenderOutput.includes(selector);
  }

  /**
   * Find all elements matching selector
   */
  public findAll(selector: string): string[] {
    // Simple implementation - could be enhanced
    const matches: string[] = [];
    const regex = new RegExp(selector, 'g');
    let match;

    while ((match = regex.exec(this.lastRenderOutput)) !== null) {
      matches.push(match[0]);
    }

    return matches;
  }

  /**
   * Get text content from render output
   */
  public getText(): string {
    // Strip HTML tags to get text content
    return this.lastRenderOutput.replace(/<[^>]*>/g, '');
  }

  /**
   * Take a snapshot of current state
   */
  public snapshot(): {
    props: Partial<TProps>;
    state: Record<string, unknown>;
    renderOutput: string;
    mounted: boolean;
    active: boolean;
    renderCount: number;
  } {
    return {
      props: this.getProps(),
      state: this.getState(),
      renderOutput: this.lastRenderOutput,
      mounted: this.mounted,
      active: this.isActive(),
      renderCount: this.renderCount,
    };
  }

  /**
   * Reset test subject
   */
  public async reset(): Promise<void> {
    await this.unmount();
    this.renderCount = 0;
    this.lastRenderOutput = '';
    this.interactions = [];
  }

  /**
   * Cleanup test subject
   */
  public async cleanup(): Promise<void> {
    await this.unmount();
  }
}

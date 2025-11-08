/**
 * Observation - Component variation showcase
 *
 * An Observation represents a specific state or variation of a component,
 * similar to Storybook's "Story". It defines props, state, and rendering
 * context for a particular use case or demonstration.
 */

import type { SpecimenContext } from './Specimen';

/**
 * Observation configuration
 */
export interface ObservationConfig {
  /**
   * Observation name (e.g., "Primary", "Disabled", "Loading")
   */
  name: string;

  /**
   * Description of this variation
   */
  description?: string;

  /**
   * Props for this observation
   */
  props?: Record<string, unknown>;

  /**
   * Initial state
   */
  state?: Record<string, unknown>;

  /**
   * Rendering context
   */
  context?: Partial<SpecimenContext>;

  /**
   * Tags for categorization
   */
  tags?: string[];

  /**
   * Play function - interactive demonstration
   */
  play?: (element: HTMLElement) => Promise<void> | void;

  /**
   * Setup function - runs before rendering
   */
  setup?: () => Promise<void> | void;

  /**
   * Teardown function - runs after observation
   */
  teardown?: () => Promise<void> | void;
}

/**
 * Observation - Component variation
 */
export class Observation {
  public readonly name: string;
  public readonly description?: string;
  public readonly props: Record<string, unknown>;
  public readonly state: Record<string, unknown>;
  public readonly context: Partial<SpecimenContext>;
  public readonly tags: string[];
  public readonly play?: (element: HTMLElement) => Promise<void> | void;
  private readonly setup?: () => Promise<void> | void;
  private readonly teardown?: () => Promise<void> | void;

  private isSetup = false;
  private isTornDown = false;

  constructor(config: ObservationConfig) {
    this.name = config.name;
    if (config.description !== undefined) {
      this.description = config.description;
    }
    this.props = config.props ?? {};
    this.state = config.state ?? {};
    this.context = config.context ?? {};
    this.tags = config.tags ?? [];
    if (config.play !== undefined) {
      this.play = config.play;
    }
    if (config.setup !== undefined) {
      this.setup = config.setup;
    }
    if (config.teardown !== undefined) {
      this.teardown = config.teardown;
    }
  }

  /**
   * Initialize the observation
   */
  public async initialize(): Promise<void> {
    if (this.isSetup) {
      return;
    }

    if (this.setup !== undefined) {
      await this.setup();
    }

    this.isSetup = true;
  }

  /**
   * Cleanup the observation
   */
  public async cleanup(): Promise<void> {
    if (this.isTornDown) {
      return;
    }

    if (this.teardown !== undefined) {
      await this.teardown();
    }

    this.isTornDown = true;
  }

  /**
   * Get full specimen context
   */
  public getSpecimenContext(): SpecimenContext {
    return {
      props: { ...this.props },
      state: { ...this.state },
      ...this.context,
    };
  }

  /**
   * Run the play function (interactive demo)
   */
  public async runPlay(element: HTMLElement): Promise<void> {
    if (this.play === undefined) {
      return;
    }

    await this.play(element);
  }

  /**
   * Check if observation has play function
   */
  public hasPlay(): boolean {
    return this.play !== undefined;
  }

  /**
   * Export observation definition
   */
  public export(): {
    name: string;
    description?: string;
    props: Record<string, unknown>;
    state: Record<string, unknown>;
    context: Partial<SpecimenContext>;
    tags: string[];
    hasPlay: boolean;
  } {
    const exported: {
      name: string;
      description?: string;
      props: Record<string, unknown>;
      state: Record<string, unknown>;
      context: Partial<SpecimenContext>;
      tags: string[];
      hasPlay: boolean;
    } = {
      name: this.name,
      props: { ...this.props },
      state: { ...this.state },
      context: { ...this.context },
      tags: [...this.tags],
      hasPlay: this.hasPlay(),
    };

    if (this.description !== undefined) {
      exported.description = this.description;
    }

    return exported;
  }
}

/**
 * Create multiple observations from a configuration object
 */
export function createObservations(
  configs: Record<string, ObservationConfig>,
): Map<string, Observation> {
  const observations = new Map<string, Observation>();

  for (const [key, config] of Object.entries(configs)) {
    observations.set(key, new Observation(config));
  }

  return observations;
}

/**
 * Observation builder for fluent API
 */
export class ObservationBuilder {
  private config: Partial<ObservationConfig> = {};

  public withName(name: string): this {
    this.config.name = name;
    return this;
  }

  public withDescription(description: string): this {
    this.config.description = description;
    return this;
  }

  public withProps(props: Record<string, unknown>): this {
    this.config.props = props;
    return this;
  }

  public withState(state: Record<string, unknown>): this {
    this.config.state = state;
    return this;
  }

  public withContext(context: Partial<SpecimenContext>): this {
    this.config.context = context;
    return this;
  }

  public withTags(...tags: string[]): this {
    this.config.tags = tags;
    return this;
  }

  public withPlay(play: (element: HTMLElement) => Promise<void> | void): this {
    this.config.play = play;
    return this;
  }

  public withSetup(setup: () => Promise<void> | void): this {
    this.config.setup = setup;
    return this;
  }

  public withTeardown(teardown: () => Promise<void> | void): this {
    this.config.teardown = teardown;
    return this;
  }

  public build(): Observation {
    if (this.config.name === undefined) {
      throw new Error('Observation name is required');
    }

    return new Observation(this.config as ObservationConfig);
  }
}

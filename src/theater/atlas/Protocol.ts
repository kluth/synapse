/**
 * Protocol - Usage Guidelines and Best Practices
 *
 * The Protocol provides structured documentation for usage patterns,
 * best practices, accessibility guidelines, and performance recommendations.
 *
 * Medical Metaphor: Medical protocols define standardized procedures,
 * best practices, and guidelines for consistent treatment and care.
 */

import { EventEmitter } from 'events';

/**
 * Protocol type
 */
export type ProtocolType =
  | 'usage'
  | 'best-practice'
  | 'accessibility'
  | 'performance'
  | 'security'
  | 'testing';

/**
 * Protocol severity/priority
 */
export type ProtocolSeverity = 'critical' | 'important' | 'recommended' | 'optional';

/**
 * Code example in a protocol
 */
export interface ProtocolExample {
  /** Example title */
  title: string;

  /** Example description */
  description: string;

  /** Code snippet */
  code: string;

  /** Programming language */
  language: string;

  /** Whether this is a good or bad example */
  good: boolean;

  /** Explanation of why */
  explanation: string;
}

/**
 * Protocol guideline
 */
export interface ProtocolGuideline {
  /** Guideline ID */
  id: string;

  /** Guideline title */
  title: string;

  /** Guideline description */
  description: string;

  /** Protocol type */
  type: ProtocolType;

  /** Severity/priority */
  severity: ProtocolSeverity;

  /** Detailed explanation */
  explanation: string;

  /** Examples */
  examples: ProtocolExample[];

  /** Related guidelines */
  related: string[];

  /** Tags for filtering */
  tags: string[];

  /** References (links to docs, standards, etc.) */
  references: Array<{
    title: string;
    url: string;
  }>;

  /** When created */
  timestamp: number;
}

/**
 * Protocol checklist item
 */
export interface ChecklistItem {
  /** Item ID */
  id: string;

  /** Item text */
  text: string;

  /** Category */
  category: string;

  /** Required or optional */
  required: boolean;

  /** Related guideline ID */
  guidelineId?: string;
}

/**
 * Component protocol
 */
export interface ComponentProtocol {
  /** Component ID */
  componentId: string;

  /** Component name */
  componentName: string;

  /** Usage patterns */
  usagePatterns: ProtocolGuideline[];

  /** Best practices */
  bestPractices: ProtocolGuideline[];

  /** Accessibility guidelines */
  accessibility: ProtocolGuideline[];

  /** Performance recommendations */
  performance: ProtocolGuideline[];

  /** Security considerations */
  security: ProtocolGuideline[];

  /** Testing strategies */
  testing: ProtocolGuideline[];

  /** Checklist */
  checklist: ChecklistItem[];
}

/**
 * Protocol search query
 */
export interface ProtocolQuery {
  /** Text search */
  text?: string;

  /** Filter by type */
  type?: ProtocolType;

  /** Filter by severity */
  severity?: ProtocolSeverity;

  /** Filter by tags */
  tags?: string[];

  /** Component ID */
  componentId?: string;
}

/**
 * Protocol configuration
 */
export interface ProtocolConfig {
  /** Protocol system name */
  name?: string;

  /** Enforce severity levels */
  enforceSeverity?: boolean;

  /** Include examples */
  includeExamples?: boolean;

  /** Auto-generate checklists */
  autoGenerateChecklists?: boolean;
}

/**
 * Protocol statistics
 */
export interface ProtocolStatistics {
  /** Total guidelines */
  totalGuidelines: number;

  /** By type */
  byType: Record<ProtocolType, number>;

  /** By severity */
  bySeverity: Record<ProtocolSeverity, number>;

  /** Total examples */
  totalExamples: number;

  /** Components with protocols */
  componentsWithProtocols: number;
}

/**
 * Protocol - Usage Guidelines and Best Practices
 *
 * @example
 * ```typescript
 * const protocol = new Protocol();
 *
 * // Add guideline
 * protocol.addGuideline({
 *   id: 'button-accessibility',
 *   title: 'Button Accessibility',
 *   description: 'Ensure buttons are keyboard accessible',
 *   type: 'accessibility',
 *   severity: 'critical',
 *   explanation: 'Buttons must be operable via keyboard...',
 *   examples: [
 *     {
 *       title: 'Good Example',
 *       description: 'Button with proper aria-label',
 *       code: '<button aria-label="Submit">Submit</button>',
 *       language: 'html',
 *       good: true,
 *       explanation: 'Provides accessible name'
 *     }
 *   ],
 *   related: [],
 *   tags: ['keyboard', 'aria'],
 *   references: [],
 *   timestamp: Date.now()
 * });
 *
 * // Get protocol for component
 * const buttonProtocol = protocol.getComponentProtocol('button');
 * ```
 */
export class Protocol extends EventEmitter {
  private readonly name: string;
  private readonly config: Required<ProtocolConfig>;
  private guidelines: Map<string, ProtocolGuideline> = new Map();
  private componentProtocols: Map<string, ComponentProtocol> = new Map();
  private checklists: Map<string, ChecklistItem[]> = new Map();

  constructor(config: ProtocolConfig = {}) {
    super();

    this.name = config.name ?? 'Protocol System';
    this.config = {
      name: this.name,
      enforceSeverity: config.enforceSeverity ?? true,
      includeExamples: config.includeExamples ?? true,
      autoGenerateChecklists: config.autoGenerateChecklists ?? true,
    };
  }

  /**
   * Add a guideline
   */
  public addGuideline(guideline: ProtocolGuideline): void {
    this.guidelines.set(guideline.id, guideline);
    this.emit('guideline:added', { id: guideline.id });
  }

  /**
   * Get guideline by ID
   */
  public getGuideline(id: string): ProtocolGuideline | undefined {
    return this.guidelines.get(id);
  }

  /**
   * Get all guidelines
   */
  public getAllGuidelines(): ProtocolGuideline[] {
    return Array.from(this.guidelines.values());
  }

  /**
   * Search guidelines
   */
  public search(query: ProtocolQuery): ProtocolGuideline[] {
    let results = this.getAllGuidelines();

    // Filter by type
    if (query.type !== undefined) {
      results = results.filter((g) => g.type === query.type);
    }

    // Filter by severity
    if (query.severity !== undefined) {
      results = results.filter((g) => g.severity === query.severity);
    }

    // Filter by tags
    if (query.tags !== undefined && query.tags.length > 0) {
      const tags = query.tags;
      results = results.filter((g) => tags.some((tag) => g.tags.includes(tag)));
    }

    // Text search
    if (query.text !== undefined) {
      const searchText = query.text.toLowerCase();
      results = results.filter(
        (g) =>
          g.title.toLowerCase().includes(searchText) ||
          g.description.toLowerCase().includes(searchText) ||
          g.explanation.toLowerCase().includes(searchText),
      );
    }

    return results;
  }

  /**
   * Get guidelines by type
   */
  public getByType(type: ProtocolType): ProtocolGuideline[] {
    return this.getAllGuidelines().filter((g) => g.type === type);
  }

  /**
   * Get guidelines by severity
   */
  public getBySeverity(severity: ProtocolSeverity): ProtocolGuideline[] {
    return this.getAllGuidelines().filter((g) => g.severity === severity);
  }

  /**
   * Set component protocol
   */
  public setComponentProtocol(protocol: ComponentProtocol): void {
    this.componentProtocols.set(protocol.componentId, protocol);

    // Auto-generate checklist if enabled
    if (this.config.autoGenerateChecklists) {
      this.generateChecklist(protocol.componentId);
    }

    this.emit('component:protocol-set', { componentId: protocol.componentId });
  }

  /**
   * Get component protocol
   */
  public getComponentProtocol(componentId: string): ComponentProtocol | undefined {
    return this.componentProtocols.get(componentId);
  }

  /**
   * Generate checklist from guidelines
   */
  public generateChecklist(componentId: string): ChecklistItem[] {
    const protocol = this.componentProtocols.get(componentId);
    if (protocol === undefined) return [];

    const items: ChecklistItem[] = [];
    let itemId = 0;

    // Add accessibility items (all required)
    protocol.accessibility.forEach((guideline) => {
      items.push({
        id: `${componentId}-a11y-${itemId++}`,
        text: guideline.title,
        category: 'Accessibility',
        required: guideline.severity === 'critical' || guideline.severity === 'important',
        guidelineId: guideline.id,
      });
    });

    // Add security items
    protocol.security.forEach((guideline) => {
      items.push({
        id: `${componentId}-security-${itemId++}`,
        text: guideline.title,
        category: 'Security',
        required: guideline.severity === 'critical',
        guidelineId: guideline.id,
      });
    });

    // Add performance items
    protocol.performance.forEach((guideline) => {
      items.push({
        id: `${componentId}-perf-${itemId++}`,
        text: guideline.title,
        category: 'Performance',
        required: guideline.severity === 'critical',
        guidelineId: guideline.id,
      });
    });

    // Add testing items
    protocol.testing.forEach((guideline) => {
      items.push({
        id: `${componentId}-test-${itemId++}`,
        text: guideline.title,
        category: 'Testing',
        required: guideline.severity === 'critical' || guideline.severity === 'important',
        guidelineId: guideline.id,
      });
    });

    this.checklists.set(componentId, items);
    return items;
  }

  /**
   * Get checklist for component
   */
  public getChecklist(componentId: string): ChecklistItem[] {
    return this.checklists.get(componentId) ?? [];
  }

  /**
   * Validate component against protocol
   */
  public validate(
    componentId: string,
    completedItems: string[],
  ): {
    passed: boolean;
    missingRequired: ChecklistItem[];
    missingOptional: ChecklistItem[];
    score: number;
  } {
    const checklist = this.getChecklist(componentId);
    const requiredItems = checklist.filter((item) => item.required);
    const optionalItems = checklist.filter((item) => !item.required);

    const missingRequired = requiredItems.filter((item) => !completedItems.includes(item.id));
    const missingOptional = optionalItems.filter((item) => !completedItems.includes(item.id));

    const passed = missingRequired.length === 0;
    const score = checklist.length > 0 ? (completedItems.length / checklist.length) * 100 : 100;

    return {
      passed,
      missingRequired,
      missingOptional,
      score,
    };
  }

  /**
   * Create usage pattern guideline
   */
  public createUsagePattern(
    id: string,
    title: string,
    description: string,
    examples: ProtocolExample[],
    options: {
      severity?: ProtocolSeverity;
      tags?: string[];
      related?: string[];
    } = {},
  ): ProtocolGuideline {
    const guideline: ProtocolGuideline = {
      id,
      title,
      description,
      type: 'usage',
      severity: options.severity ?? 'recommended',
      explanation: description,
      examples,
      related: options.related ?? [],
      tags: options.tags ?? [],
      references: [],
      timestamp: Date.now(),
    };

    this.addGuideline(guideline);
    return guideline;
  }

  /**
   * Create accessibility guideline
   */
  public createAccessibilityGuideline(
    id: string,
    title: string,
    description: string,
    wcagLevel: '2.0' | '2.1' | '2.2',
    criterion: string,
    options: {
      severity?: ProtocolSeverity;
      examples?: ProtocolExample[];
    } = {},
  ): ProtocolGuideline {
    const guideline: ProtocolGuideline = {
      id,
      title,
      description,
      type: 'accessibility',
      severity: options.severity ?? 'critical',
      explanation: `WCAG ${wcagLevel} - ${criterion}: ${description}`,
      examples: options.examples ?? [],
      related: [],
      tags: ['wcag', wcagLevel, criterion],
      references: [
        {
          title: `WCAG ${wcagLevel} ${criterion}`,
          url: `https://www.w3.org/WAI/WCAG${wcagLevel.replace('.', '')}/quickref/#${criterion}`,
        },
      ],
      timestamp: Date.now(),
    };

    this.addGuideline(guideline);
    return guideline;
  }

  /**
   * Create performance guideline
   */
  public createPerformanceGuideline(
    id: string,
    title: string,
    description: string,
    impact: 'high' | 'medium' | 'low',
    options: {
      examples?: ProtocolExample[];
      tags?: string[];
    } = {},
  ): ProtocolGuideline {
    const severityMap: Record<'high' | 'medium' | 'low', ProtocolSeverity> = {
      high: 'critical',
      medium: 'important',
      low: 'recommended',
    };

    const guideline: ProtocolGuideline = {
      id,
      title,
      description,
      type: 'performance',
      severity: severityMap[impact],
      explanation: description,
      examples: options.examples ?? [],
      related: [],
      tags: options.tags ?? ['performance', impact],
      references: [],
      timestamp: Date.now(),
    };

    this.addGuideline(guideline);
    return guideline;
  }

  /**
   * Get statistics
   */
  public getStatistics(): ProtocolStatistics {
    const guidelines = this.getAllGuidelines();

    const byType: Record<ProtocolType, number> = {
      usage: 0,
      'best-practice': 0,
      accessibility: 0,
      performance: 0,
      security: 0,
      testing: 0,
    };

    const bySeverity: Record<ProtocolSeverity, number> = {
      critical: 0,
      important: 0,
      recommended: 0,
      optional: 0,
    };

    let totalExamples = 0;

    guidelines.forEach((guideline) => {
      byType[guideline.type]++;
      bySeverity[guideline.severity]++;
      totalExamples += guideline.examples.length;
    });

    return {
      totalGuidelines: guidelines.length,
      byType,
      bySeverity,
      totalExamples,
      componentsWithProtocols: this.componentProtocols.size,
    };
  }

  /**
   * Export protocols as JSON
   */
  public export(): string {
    return JSON.stringify(
      {
        name: this.name,
        guidelines: this.getAllGuidelines(),
        componentProtocols: Array.from(this.componentProtocols.values()),
        checklists: Object.fromEntries(this.checklists),
        statistics: this.getStatistics(),
        exportedAt: Date.now(),
      },
      null,
      2,
    );
  }

  /**
   * Import protocols from JSON
   */
  public import(json: string): void {
    const data = JSON.parse(json) as {
      guidelines: ProtocolGuideline[];
      componentProtocols: ComponentProtocol[];
      checklists: Record<string, ChecklistItem[]>;
    };

    data.guidelines.forEach((guideline) => this.addGuideline(guideline));
    data.componentProtocols.forEach((protocol) => this.setComponentProtocol(protocol));
    Object.entries(data.checklists).forEach(([componentId, checklist]) => {
      this.checklists.set(componentId, checklist);
    });

    this.emit('imported', {
      guidelines: data.guidelines.length,
      protocols: data.componentProtocols.length,
    });
  }

  /**
   * Remove guideline
   */
  public removeGuideline(id: string): boolean {
    const existed = this.guidelines.has(id);
    this.guidelines.delete(id);

    if (existed) {
      this.emit('guideline:removed', { id });
    }

    return existed;
  }

  /**
   * Clear all protocols
   */
  public clear(): void {
    this.guidelines.clear();
    this.componentProtocols.clear();
    this.checklists.clear();
    this.emit('cleared');
  }
}

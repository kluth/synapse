/**
 * Diagram - Visual Documentation Generator
 *
 * The Diagram generates visual representations of component structures,
 * signal flows, dependencies, and state machines using Mermaid and GraphViz formats.
 *
 * Medical Metaphor: Medical diagrams illustrate anatomical structures,
 * physiological processes, and interconnections in a clear visual format.
 */

import type { DependencyGraph } from './ComponentCatalogue';
import type { ComponentDocumentation } from './Atlas';

/**
 * Diagram type
 */
export type DiagramType =
  | 'component-hierarchy'
  | 'signal-flow'
  | 'dependency-graph'
  | 'state-machine'
  | 'architecture';

/**
 * Diagram format
 */
export type DiagramFormat = 'mermaid' | 'graphviz' | 'svg' | 'png';

/**
 * Diagram configuration
 */
export interface DiagramConfig {
  /** Diagram title */
  title?: string;

  /** Diagram type */
  type: DiagramType;

  /** Output format */
  format?: DiagramFormat;

  /** Direction (for hierarchies) */
  direction?: 'TB' | 'BT' | 'LR' | 'RL';

  /** Include labels */
  showLabels?: boolean;

  /** Include types */
  showTypes?: boolean;

  /** Color scheme */
  colorScheme?: 'default' | 'medical' | 'neural';

  /** Maximum depth (for hierarchies) */
  maxDepth?: number;
}

/**
 * Node in a diagram
 */
export interface DiagramNode {
  /** Node ID */
  id: string;

  /** Node label */
  label: string;

  /** Node type */
  type?: string;

  /** Node shape */
  shape?: 'box' | 'ellipse' | 'diamond' | 'hexagon';

  /** Node color */
  color?: string;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Edge in a diagram
 */
export interface DiagramEdge {
  /** Source node ID */
  from: string;

  /** Target node ID */
  to: string;

  /** Edge label */
  label?: string;

  /** Edge type */
  type?: 'solid' | 'dashed' | 'dotted';

  /** Edge color */
  color?: string;

  /** Arrow direction */
  arrow?: 'forward' | 'backward' | 'both' | 'none';
}

/**
 * State machine state
 */
export interface StateMachineState {
  /** State name */
  name: string;

  /** State type */
  type: 'initial' | 'active' | 'final';

  /** State description */
  description?: string;
}

/**
 * State machine transition
 */
export interface StateMachineTransition {
  /** Source state */
  from: string;

  /** Target state */
  to: string;

  /** Trigger event */
  trigger: string;

  /** Guard condition */
  guard?: string;

  /** Actions */
  actions?: string[];
}

/**
 * Diagram - Visual Documentation Generator
 *
 * @example
 * ```typescript
 * const diagram = new Diagram();
 *
 * // Generate component hierarchy
 * const mermaid = diagram.generateComponentHierarchy(
 *   componentDocs,
 *   { format: 'mermaid', direction: 'TB' }
 * );
 *
 * // Generate dependency graph
 * const graph = diagram.generateDependencyGraph(
 *   dependencyData,
 *   { format: 'graphviz' }
 * );
 * ```
 */
export class Diagram {
  /**
   * Generate component hierarchy diagram
   */
  public generateComponentHierarchy(
    components: ComponentDocumentation[],
    config: DiagramConfig = { type: 'component-hierarchy' },
  ): string {
    const format = config.format ?? 'mermaid';

    if (format === 'mermaid') {
      return this.generateMermaidHierarchy(components, config);
    } else if (format === 'graphviz') {
      return this.generateGraphvizHierarchy(components, config);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate Mermaid hierarchy diagram
   */
  private generateMermaidHierarchy(
    components: ComponentDocumentation[],
    config: DiagramConfig,
  ): string {
    const direction = config.direction ?? 'TB';
    const lines: string[] = [`graph ${direction}`];

    if (config.title !== undefined) {
      lines.push(`  title ${config.title}`);
    }

    // Group by category
    const byCategory: Record<string, ComponentDocumentation[]> = {};
    components.forEach((comp) => {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if (byCategory[comp.category] === undefined) {
        byCategory[comp.category] = [];
      }
      byCategory[comp.category]?.push(comp);
    });

    // Generate category subgraphs
    Object.entries(byCategory).forEach(([category, comps]) => {
      lines.push(`  subgraph ${category}`);
      comps.forEach((comp) => {
        const label = config.showLabels !== false ? comp.name : comp.id;
        lines.push(`    ${this.sanitizeId(comp.id)}[${label}]`);
      });
      lines.push('  end');
    });

    // Add relationships
    components.forEach((comp) => {
      comp.related.forEach((relatedId) => {
        lines.push(`  ${this.sanitizeId(comp.id)} --> ${this.sanitizeId(relatedId)}`);
      });
    });

    return lines.join('\n');
  }

  /**
   * Generate GraphViz hierarchy diagram
   */
  private generateGraphvizHierarchy(
    components: ComponentDocumentation[],
    config: DiagramConfig,
  ): string {
    const lines: string[] = ['digraph ComponentHierarchy {'];

    if (config.title !== undefined) {
      lines.push(`  label="${config.title}";`);
      lines.push('  labelloc=top;');
    }

    lines.push('  rankdir=' + (config.direction ?? 'TB') + ';');
    lines.push('  node [shape=box, style=rounded];');

    // Group by category
    const byCategory: Record<string, ComponentDocumentation[]> = {};
    components.forEach((comp) => {
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      if (byCategory[comp.category] === undefined) {
        byCategory[comp.category] = [];
      }
      byCategory[comp.category]?.push(comp);
    });

    // Generate category clusters
    Object.entries(byCategory).forEach(([category, comps], index) => {
      lines.push(`  subgraph cluster_${index} {`);
      lines.push(`    label="${category}";`);
      comps.forEach((comp) => {
        const label = config.showLabels !== false ? comp.name : comp.id;
        lines.push(`    "${comp.id}" [label="${label}"];`);
      });
      lines.push('  }');
    });

    // Add edges
    components.forEach((comp) => {
      comp.related.forEach((relatedId) => {
        lines.push(`  "${comp.id}" -> "${relatedId}";`);
      });
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate dependency graph
   */
  public generateDependencyGraph(graph: DependencyGraph, config: DiagramConfig): string {
    const format = config.format ?? 'mermaid';

    if (format === 'mermaid') {
      return this.generateMermaidDependencies(graph, config);
    } else if (format === 'graphviz') {
      return this.generateGraphvizDependencies(graph, config);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate Mermaid dependency graph
   */
  private generateMermaidDependencies(graph: DependencyGraph, config: DiagramConfig): string {
    const direction = config.direction ?? 'LR';
    const lines: string[] = [`graph ${direction}`];

    if (config.title !== undefined) {
      lines.push(`  title ${config.title}`);
    }

    // Add nodes
    graph.nodes.forEach((node) => {
      const label = config.showLabels !== false ? node.name : node.id;
      lines.push(`  ${this.sanitizeId(node.id)}[${label}]`);
    });

    // Add edges
    graph.edges.forEach((edge) => {
      const arrow = edge.type === 'optional' ? '-.->' : '-->';
      lines.push(`  ${this.sanitizeId(edge.from)} ${arrow} ${this.sanitizeId(edge.to)}`);
    });

    return lines.join('\n');
  }

  /**
   * Generate GraphViz dependency graph
   */
  private generateGraphvizDependencies(graph: DependencyGraph, config: DiagramConfig): string {
    const lines: string[] = ['digraph Dependencies {'];

    if (config.title !== undefined) {
      lines.push(`  label="${config.title}";`);
    }

    lines.push('  rankdir=' + (config.direction ?? 'LR') + ';');

    // Add nodes
    graph.nodes.forEach((node) => {
      const label = config.showLabels !== false ? node.name : node.id;
      lines.push(`  "${node.id}" [label="${label}"];`);
    });

    // Add edges
    graph.edges.forEach((edge) => {
      const style = edge.type === 'optional' ? 'style=dashed' : '';
      lines.push(`  "${edge.from}" -> "${edge.to}" [${style}];`);
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate signal flow diagram
   */
  public generateSignalFlow(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    config: DiagramConfig,
  ): string {
    const format = config.format ?? 'mermaid';

    if (format === 'mermaid') {
      return this.generateMermaidSignalFlow(nodes, edges, config);
    } else if (format === 'graphviz') {
      return this.generateGraphvizSignalFlow(nodes, edges, config);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate Mermaid signal flow diagram
   */
  private generateMermaidSignalFlow(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    config: DiagramConfig,
  ): string {
    const direction = config.direction ?? 'LR';
    const lines: string[] = [`graph ${direction}`];

    if (config.title !== undefined) {
      lines.push(`  title ${config.title}`);
    }

    // Add nodes with shapes
    nodes.forEach((node) => {
      const shape = this.getMermaidShape(node.shape ?? 'box');
      lines.push(`  ${this.sanitizeId(node.id)}${shape[0]}${node.label}${shape[1]}`);
    });

    // Add edges
    edges.forEach((edge) => {
      const arrow = this.getMermaidArrow(edge.type ?? 'solid', edge.arrow ?? 'forward');
      const label = edge.label !== undefined ? `|${edge.label}|` : '';
      lines.push(
        `  ${this.sanitizeId(edge.from)} ${arrow[0]}${label}${arrow[1]} ${this.sanitizeId(edge.to)}`,
      );
    });

    return lines.join('\n');
  }

  /**
   * Generate GraphViz signal flow diagram
   */
  private generateGraphvizSignalFlow(
    nodes: DiagramNode[],
    edges: DiagramEdge[],
    config: DiagramConfig,
  ): string {
    const lines: string[] = ['digraph SignalFlow {'];

    if (config.title !== undefined) {
      lines.push(`  label="${config.title}";`);
    }

    lines.push('  rankdir=' + (config.direction ?? 'LR') + ';');

    // Add nodes
    nodes.forEach((node) => {
      const shape = node.shape ?? 'box';
      const color = node.color !== undefined ? `, fillcolor="${node.color}", style=filled` : '';
      lines.push(`  "${node.id}" [label="${node.label}", shape=${shape}${color}];`);
    });

    // Add edges
    edges.forEach((edge) => {
      const style = edge.type !== undefined && edge.type !== 'solid' ? `style=${edge.type}` : '';
      const label = edge.label !== undefined ? `, label="${edge.label}"` : '';
      const color = edge.color !== undefined ? `, color="${edge.color}"` : '';
      lines.push(`  "${edge.from}" -> "${edge.to}" [${style}${label}${color}];`);
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Generate state machine diagram
   */
  public generateStateMachine(
    states: StateMachineState[],
    transitions: StateMachineTransition[],
    config: DiagramConfig,
  ): string {
    const format = config.format ?? 'mermaid';

    if (format === 'mermaid') {
      return this.generateMermaidStateMachine(states, transitions, config);
    } else if (format === 'graphviz') {
      return this.generateGraphvizStateMachine(states, transitions, config);
    }

    throw new Error(`Unsupported format: ${format}`);
  }

  /**
   * Generate Mermaid state machine diagram
   */
  private generateMermaidStateMachine(
    states: StateMachineState[],
    transitions: StateMachineTransition[],
    config: DiagramConfig,
  ): string {
    const lines: string[] = ['stateDiagram-v2'];

    if (config.title !== undefined) {
      lines.push(`  title ${config.title}`);
    }

    // Add initial state
    const initial = states.find((s) => s.type === 'initial');
    if (initial !== undefined) {
      lines.push(`  [*] --> ${this.sanitizeId(initial.name)}`);
    }

    // Add states
    states.forEach((state) => {
      if (state.description !== undefined) {
        lines.push(`  ${this.sanitizeId(state.name)}: ${state.description}`);
      }
    });

    // Add transitions
    transitions.forEach((trans) => {
      const label = trans.guard !== undefined ? `${trans.trigger} [${trans.guard}]` : trans.trigger;
      lines.push(`  ${this.sanitizeId(trans.from)} --> ${this.sanitizeId(trans.to)}: ${label}`);
    });

    // Add final states
    states
      .filter((s) => s.type === 'final')
      .forEach((state) => {
        lines.push(`  ${this.sanitizeId(state.name)} --> [*]`);
      });

    return lines.join('\n');
  }

  /**
   * Generate GraphViz state machine diagram
   */
  private generateGraphvizStateMachine(
    states: StateMachineState[],
    transitions: StateMachineTransition[],
    config: DiagramConfig,
  ): string {
    const lines: string[] = ['digraph StateMachine {'];

    if (config.title !== undefined) {
      lines.push(`  label="${config.title}";`);
    }

    lines.push('  node [shape=circle];');

    // Add states
    states.forEach((state) => {
      const shape = state.type === 'final' ? 'doublecircle' : 'circle';
      lines.push(`  "${state.name}" [shape=${shape}];`);
    });

    // Add initial state
    const initial = states.find((s) => s.type === 'initial');
    if (initial !== undefined) {
      lines.push('  __start__ [shape=point];');
      lines.push(`  __start__ -> "${initial.name}";`);
    }

    // Add transitions
    transitions.forEach((trans) => {
      const label =
        trans.guard !== undefined ? `${trans.trigger}\\n[${trans.guard}]` : trans.trigger;
      lines.push(`  "${trans.from}" -> "${trans.to}" [label="${label}"];`);
    });

    lines.push('}');
    return lines.join('\n');
  }

  /**
   * Get Mermaid shape notation
   */
  private getMermaidShape(shape: string): [string, string] {
    switch (shape) {
      case 'box':
        return ['[', ']'];
      case 'ellipse':
        return ['([', '])'];
      case 'diamond':
        return ['{', '}'];
      case 'hexagon':
        return ['{{', '}}'];
      default:
        return ['[', ']'];
    }
  }

  /**
   * Get Mermaid arrow notation
   */
  private getMermaidArrow(type: string, direction: string): [string, string] {
    const arrows: Record<string, [string, string]> = {
      'solid-forward': ['--', '-->'],
      'solid-backward': ['<--', '--'],
      'solid-both': ['<--', '-->'],
      'solid-none': ['--', '--'],
      'dashed-forward': ['-.', '.->'],
      'dashed-backward': ['<-.', '.-'],
      'dashed-both': ['<-.', '.->'],
      'dashed-none': ['-.', '.-'],
      'dotted-forward': ['-.', '.->'],
      'dotted-backward': ['<-.', '.-'],
      'dotted-both': ['<-.', '.->'],
      'dotted-none': ['-.', '.-'],
    };

    return arrows[`${type}-${direction}`] ?? ['--', '-->'];
  }

  /**
   * Sanitize ID for Mermaid/GraphViz
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  /**
   * Convert to SVG (requires external renderer)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async renderToSVG(_diagram: string, _format: 'mermaid' | 'graphviz'): Promise<string> {
    // This would integrate with Mermaid.js or GraphViz CLI
    // For now, return placeholder
    throw new Error('SVG rendering not implemented - use Mermaid.js or GraphViz CLI');
  }

  /**
   * Convert to PNG (requires external renderer)
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async renderToPNG(_diagram: string, _format: 'mermaid' | 'graphviz'): Promise<Buffer> {
    // This would integrate with Mermaid.js or GraphViz CLI
    // For now, return placeholder
    throw new Error('PNG rendering not implemented - use Mermaid.js or GraphViz CLI');
  }
}

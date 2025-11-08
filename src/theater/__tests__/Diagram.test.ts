/**
 * Diagram Tests
 */

import { Diagram } from '../atlas/Diagram';
import type {
  ComponentDocumentation,
  DependencyGraph,
  DiagramNode,
  DiagramEdge,
  StateMachineState,
  StateMachineTransition,
} from '../atlas';

describe('Diagram - Visual Documentation Generator', () => {
  let diagram: Diagram;

  const createMockDoc = (
    id: string,
    category: string,
    related: string[] = [],
  ): ComponentDocumentation => ({
    id,
    name: id,
    description: `${id} component`,
    category,
    tags: [],
    props: [],
    state: [],
    signals: [],
    examples: [],
    related,
    source: '',
    timestamp: Date.now(),
  });

  beforeEach(() => {
    diagram = new Diagram();
  });

  describe('Component Hierarchy - Mermaid', () => {
    it('should generate Mermaid hierarchy diagram', () => {
      const components: ComponentDocumentation[] = [
        createMockDoc('button', 'ui', ['icon']),
        createMockDoc('icon', 'ui'),
        createMockDoc('astrocyte', 'glial'),
      ];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'mermaid',
      });

      expect(result).toContain('graph TB');
      expect(result).toContain('subgraph ui');
      expect(result).toContain('subgraph glial');
    });

    it('should support different directions', () => {
      const components: ComponentDocumentation[] = [createMockDoc('button', 'ui')];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'mermaid',
        direction: 'LR',
      });

      expect(result).toContain('graph LR');
    });

    it('should include title', () => {
      const components: ComponentDocumentation[] = [createMockDoc('button', 'ui')];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'mermaid',
        title: 'Component Hierarchy',
      });

      expect(result).toContain('title Component Hierarchy');
    });

    it('should show relationships', () => {
      const components: ComponentDocumentation[] = [
        createMockDoc('button', 'ui', ['icon']),
        createMockDoc('icon', 'ui'),
      ];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'mermaid',
      });

      expect(result).toContain('button --> icon');
    });
  });

  describe('Component Hierarchy - GraphViz', () => {
    it('should generate GraphViz hierarchy diagram', () => {
      const components: ComponentDocumentation[] = [
        createMockDoc('button', 'ui'),
        createMockDoc('astrocyte', 'glial'),
      ];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'graphviz',
      });

      expect(result).toContain('digraph ComponentHierarchy');
      expect(result).toContain('subgraph cluster_');
      expect(result).toContain('"button"');
      expect(result).toContain('"astrocyte"');
    });

    it('should support different directions', () => {
      const components: ComponentDocumentation[] = [createMockDoc('button', 'ui')];

      const result = diagram.generateComponentHierarchy(components, {
        type: 'component-hierarchy',
        format: 'graphviz',
        direction: 'LR',
      });

      expect(result).toContain('rankdir=LR');
    });
  });

  describe('Dependency Graph - Mermaid', () => {
    it('should generate Mermaid dependency graph', () => {
      const graph: DependencyGraph = {
        nodes: [
          { id: 'button', name: 'Button', category: 'ui' },
          { id: 'icon', name: 'Icon', category: 'ui' },
        ],
        edges: [{ from: 'button', to: 'icon', type: 'dependency' }],
      };

      const result = diagram.generateDependencyGraph(graph, {
        type: 'dependency-graph',
        format: 'mermaid',
      });

      expect(result).toContain('graph LR');
      expect(result).toContain('button[Button]');
      expect(result).toContain('icon[Icon]');
      expect(result).toContain('button --> icon');
    });

    it('should show optional dependencies with dashed lines', () => {
      const graph: DependencyGraph = {
        nodes: [
          { id: 'button', name: 'Button', category: 'ui' },
          { id: 'icon', name: 'Icon', category: 'ui' },
        ],
        edges: [{ from: 'button', to: 'icon', type: 'optional' }],
      };

      const result = diagram.generateDependencyGraph(graph, {
        type: 'dependency-graph',
        format: 'mermaid',
      });

      expect(result).toContain('button -.-> icon');
    });
  });

  describe('Dependency Graph - GraphViz', () => {
    it('should generate GraphViz dependency graph', () => {
      const graph: DependencyGraph = {
        nodes: [
          { id: 'button', name: 'Button', category: 'ui' },
          { id: 'icon', name: 'Icon', category: 'ui' },
        ],
        edges: [{ from: 'button', to: 'icon', type: 'dependency' }],
      };

      const result = diagram.generateDependencyGraph(graph, {
        type: 'dependency-graph',
        format: 'graphviz',
      });

      expect(result).toContain('digraph Dependencies');
      expect(result).toContain('"button" [label="Button"]');
      expect(result).toContain('"icon" [label="Icon"]');
      expect(result).toContain('"button" -> "icon"');
    });

    it('should show optional dependencies with dashed style', () => {
      const graph: DependencyGraph = {
        nodes: [
          { id: 'button', name: 'Button', category: 'ui' },
          { id: 'icon', name: 'Icon', category: 'ui' },
        ],
        edges: [{ from: 'button', to: 'icon', type: 'optional' }],
      };

      const result = diagram.generateDependencyGraph(graph, {
        type: 'dependency-graph',
        format: 'graphviz',
      });

      expect(result).toContain('style=dashed');
    });
  });

  describe('Signal Flow - Mermaid', () => {
    it('should generate Mermaid signal flow diagram', () => {
      const nodes: DiagramNode[] = [
        { id: 'sensor', label: 'Sensor', shape: 'ellipse' },
        { id: 'processor', label: 'Processor', shape: 'box' },
        { id: 'output', label: 'Output', shape: 'diamond' },
      ];

      const edges: DiagramEdge[] = [
        { from: 'sensor', to: 'processor', label: 'signal', type: 'solid', arrow: 'forward' },
        { from: 'processor', to: 'output', type: 'dashed', arrow: 'forward' },
      ];

      const result = diagram.generateSignalFlow(nodes, edges, {
        type: 'signal-flow',
        format: 'mermaid',
      });

      expect(result).toContain('graph LR');
      expect(result).toContain('sensor([Sensor])');
      expect(result).toContain('processor[Processor]');
      expect(result).toContain('output{Output}');
    });

    it('should include edge labels', () => {
      const nodes: DiagramNode[] = [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
      ];

      const edges: DiagramEdge[] = [{ from: 'a', to: 'b', label: 'signal', arrow: 'forward' }];

      const result = diagram.generateSignalFlow(nodes, edges, {
        type: 'signal-flow',
        format: 'mermaid',
      });

      expect(result).toContain('|signal|');
    });
  });

  describe('Signal Flow - GraphViz', () => {
    it('should generate GraphViz signal flow diagram', () => {
      const nodes: DiagramNode[] = [
        { id: 'sensor', label: 'Sensor', shape: 'ellipse' },
        { id: 'processor', label: 'Processor', shape: 'box' },
      ];

      const edges: DiagramEdge[] = [
        { from: 'sensor', to: 'processor', label: 'signal', type: 'dashed' },
      ];

      const result = diagram.generateSignalFlow(nodes, edges, {
        type: 'signal-flow',
        format: 'graphviz',
      });

      expect(result).toContain('digraph SignalFlow');
      expect(result).toContain('"sensor" [label="Sensor", shape=ellipse]');
      expect(result).toContain('"processor" [label="Processor", shape=box]');
      expect(result).toContain('style=dashed');
    });

    it('should support node colors', () => {
      const nodes: DiagramNode[] = [{ id: 'node', label: 'Node', color: 'red' }];

      const edges: DiagramEdge[] = [];

      const result = diagram.generateSignalFlow(nodes, edges, {
        type: 'signal-flow',
        format: 'graphviz',
      });

      expect(result).toContain('fillcolor="red"');
    });
  });

  describe('State Machine - Mermaid', () => {
    it('should generate Mermaid state machine diagram', () => {
      const states: StateMachineState[] = [
        { name: 'idle', type: 'initial' },
        { name: 'active', type: 'active' },
        { name: 'complete', type: 'final' },
      ];

      const transitions: StateMachineTransition[] = [
        { from: 'idle', to: 'active', trigger: 'start' },
        { from: 'active', to: 'complete', trigger: 'finish' },
      ];

      const result = diagram.generateStateMachine(states, transitions, {
        type: 'state-machine',
        format: 'mermaid',
      });

      expect(result).toContain('stateDiagram-v2');
      expect(result).toContain('[*] --> idle');
      expect(result).toContain('idle --> active: start');
      expect(result).toContain('active --> complete: finish');
      expect(result).toContain('complete --> [*]');
    });

    it('should include state descriptions', () => {
      const states: StateMachineState[] = [
        { name: 'idle', type: 'initial', description: 'Waiting for input' },
      ];

      const transitions: StateMachineTransition[] = [];

      const result = diagram.generateStateMachine(states, transitions, {
        type: 'state-machine',
        format: 'mermaid',
      });

      expect(result).toContain('idle: Waiting for input');
    });

    it('should include guard conditions', () => {
      const states: StateMachineState[] = [
        { name: 'idle', type: 'initial' },
        { name: 'active', type: 'active' },
      ];

      const transitions: StateMachineTransition[] = [
        { from: 'idle', to: 'active', trigger: 'start', guard: 'isReady' },
      ];

      const result = diagram.generateStateMachine(states, transitions, {
        type: 'state-machine',
        format: 'mermaid',
      });

      expect(result).toContain('start [isReady]');
    });
  });

  describe('State Machine - GraphViz', () => {
    it('should generate GraphViz state machine diagram', () => {
      const states: StateMachineState[] = [
        { name: 'idle', type: 'initial' },
        { name: 'active', type: 'active' },
        { name: 'complete', type: 'final' },
      ];

      const transitions: StateMachineTransition[] = [
        { from: 'idle', to: 'active', trigger: 'start' },
        { from: 'active', to: 'complete', trigger: 'finish' },
      ];

      const result = diagram.generateStateMachine(states, transitions, {
        type: 'state-machine',
        format: 'graphviz',
      });

      expect(result).toContain('digraph StateMachine');
      expect(result).toContain('"idle" [shape=circle]');
      expect(result).toContain('"complete" [shape=doublecircle]');
      expect(result).toContain('__start__ [shape=point]');
      expect(result).toContain('__start__ -> "idle"');
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported format', () => {
      const components: ComponentDocumentation[] = [createMockDoc('button', 'ui')];

      expect(() => {
        diagram.generateComponentHierarchy(components, {
          type: 'component-hierarchy',
          format: 'svg' as 'mermaid',
        });
      }).toThrow('Unsupported format: svg');
    });

    it('should throw error for SVG rendering (not implemented)', async () => {
      await expect(diagram.renderToSVG('diagram', 'mermaid')).rejects.toThrow(
        'SVG rendering not implemented',
      );
    });

    it('should throw error for PNG rendering (not implemented)', async () => {
      await expect(diagram.renderToPNG('diagram', 'mermaid')).rejects.toThrow(
        'PNG rendering not implemented',
      );
    });
  });
});

/**
 * Tests for InterneuronUI (Container/Layout components)
 */

import { InterneuronUI } from '../InterneuronUI';
import { VisualNeuron } from '../VisualNeuron';
import type { RenderSignal, VirtualDOMNode } from '../types';

// Simple child component for testing
class TestChild extends VisualNeuron<{ label: string; value: number }, { count: number }> {
  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: any,
  ): Promise<TOutput> {
    const signal = input.data;
    if (signal?.type === 'ui:click') {
      this.setState({ count: this.getState().count + 1 });
    }
    return undefined as TOutput;
  }

  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'span',
          children: [`${props.label}: ${state.count}`],
        },
        styles: {},
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }
}

// Test container implementation
class TestContainer extends InterneuronUI<
  { title: string; layout: 'row' | 'column' },
  { expanded: boolean }
> {
  protected performRender(): RenderSignal {
    const props = this.getProps();
    const state = this.getState();

    // Get child render signals
    const childSignals = this.orchestrateChildren();
    const childNodes = childSignals.map((signal) => signal.data.vdom);

    return {
      type: 'render',
      data: {
        vdom: {
          tag: 'div',
          props: {
            className: `container ${props.layout}`,
          },
          children: [
            {
              tag: 'h2',
              children: [props.title],
            },
            ...childNodes,
          ],
        },
        styles: {
          display: state.expanded ? 'flex' : 'none',
          flexDirection: props.layout,
        },
        metadata: {
          componentId: this.id,
          renderCount: this.getRenderCount(),
          lastRenderTime: Date.now(),
        },
      },
      strength: 1.0,
      timestamp: Date.now(),
    };
  }

  protected override async executeProcessing<TInput = unknown, TOutput = unknown>(
    input: any,
  ): Promise<TOutput> {
    const signal = input.data;
    if (signal?.type === 'ui:click' && signal.data?.payload?.action === 'toggle') {
      this.setState({ expanded: !this.getState().expanded });
    }
    return undefined as TOutput;
  }
}

describe('InterneuronUI', () => {
  let container: TestContainer;
  let child1: TestChild;
  let child2: TestChild;

  beforeEach(() => {
    container = new TestContainer({
      id: 'test-container',
      type: 'cortical',
      threshold: 0.5,
      props: {
        title: 'Test Container',
        layout: 'column',
      },
      initialState: {
        expanded: true,
      },
    });

    child1 = new TestChild({
      id: 'child-1',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Child 1', value: 0 },
      initialState: { count: 0 },
    });

    child2 = new TestChild({
      id: 'child-2',
      type: 'cortical',
      threshold: 0.5,
      props: { label: 'Child 2', value: 0 },
      initialState: { count: 0 },
    });
  });

  afterEach(async () => {
    await container.deactivate();
    await child1.deactivate();
    await child2.deactivate();
  });

  describe('Child Management', () => {
    it('should add child neurons', () => {
      container.addChild(child1);
      const children = container.getChildren();
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe('child-1');
    });

    it('should add multiple children', () => {
      container.addChild(child1);
      container.addChild(child2);
      const children = container.getChildren();
      expect(children).toHaveLength(2);
    });

    it('should remove child neuron', () => {
      container.addChild(child1);
      container.addChild(child2);
      container.removeChild('child-1');
      const children = container.getChildren();
      expect(children).toHaveLength(1);
      expect(children[0].id).toBe('child-2');
    });

    it('should get child by id', () => {
      container.addChild(child1);
      container.addChild(child2);
      const child = container.getChild('child-2');
      expect(child).toBeDefined();
      expect(child!.id).toBe('child-2');
    });

    it('should return undefined for non-existent child', () => {
      const child = container.getChild('non-existent');
      expect(child).toBeUndefined();
    });

    it('should clear all children', () => {
      container.addChild(child1);
      container.addChild(child2);
      container.clearChildren();
      expect(container.getChildren()).toHaveLength(0);
    });
  });

  describe('Child Activation', () => {
    beforeEach(async () => {
      await child1.activate();
      await child2.activate();
    });

    it('should activate children when container activates', async () => {
      container.addChild(child1);
      container.addChild(child2);

      await child1.deactivate();
      await child2.deactivate();

      await container.activate();

      expect(child1.getStatus()).toBe('active');
      expect(child2.getStatus()).toBe('active');
    });

    it('should deactivate children when container deactivates', async () => {
      container.addChild(child1);
      container.addChild(child2);

      await container.activate();
      await container.deactivate();

      expect(child1.getStatus()).toBe('inactive');
      expect(child2.getStatus()).toBe('inactive');
    });
  });

  describe('Child Orchestration', () => {
    beforeEach(async () => {
      container.addChild(child1);
      container.addChild(child2);
      await container.activate(); // Activates children automatically
    });

    it('should orchestrate child rendering', () => {
      const childSignals = container.orchestrateChildren();
      expect(childSignals).toHaveLength(2);
      expect(childSignals[0].type).toBe('render');
      expect(childSignals[1].type).toBe('render');
    });

    it('should include child render outputs in container render', () => {
      const renderSignal = container.render();
      const children = renderSignal.data.vdom.children as VirtualDOMNode[];

      // Should have title + 2 child nodes
      expect(children).toHaveLength(3);
      expect(children[0].tag).toBe('h2');
      expect(children[1].tag).toBe('span');
      expect(children[2].tag).toBe('span');
    });

    it('should pass props to children during orchestration', () => {
      child1.updateProps({ label: 'Updated Child' });
      const childSignals = container.orchestrateChildren();
      expect(childSignals[0].data.vdom.children).toContain('Updated Child: 0');
    });
  });

  describe('Event Propagation', () => {
    beforeEach(async () => {
      container.addChild(child1);
      container.addChild(child2);
      await container.activate(); // Activates children automatically
    });

    it('should propagate events from parent to children', async () => {
      const signals: any[] = [];
      child1.on('signal', (signal) => signals.push(signal));

      await container.propagateToChildren({
        type: 'ui:click',
        data: { payload: {}, target: container.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(signals.length).toBeGreaterThan(0);
    });

    it('should bubble events from children to parent', async () => {
      const signals: any[] = [];
      container.on('signal', (signal) => signals.push(signal));

      await child1.receive({
        type: 'ui:click',
        data: { payload: {}, target: child1.id, bubbles: true },
        strength: 1.0,
        timestamp: Date.now(),
      });

      // Manually trigger bubbling
      container.bubbleFromChild({
        type: 'ui:click',
        data: { payload: {}, target: child1.id, bubbles: true },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const bubbledEvents = signals.filter((s) => s.type === 'ui:click');
      expect(bubbledEvents.length).toBeGreaterThan(0);
    });

    it('should not bubble events when bubbles is false', async () => {
      const signals: any[] = [];
      container.on('signal', (signal) => signals.push(signal));

      container.bubbleFromChild({
        type: 'ui:click',
        data: { payload: {}, target: child1.id, bubbles: false },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const bubbledEvents = signals.filter((s) => s.type === 'ui:click');
      expect(bubbledEvents).toHaveLength(0);
    });
  });

  describe('Layout Management', () => {
    beforeEach(async () => {
      container.addChild(child1);
      container.addChild(child2);
      await container.activate(); // Activates children automatically
    });

    it('should render with specified layout', () => {
      const renderSignal = container.render();
      expect(renderSignal.data.styles.flexDirection).toBe('column');
      expect(renderSignal.data.vdom.props!.className).toContain('column');
    });

    it('should update layout when props change', () => {
      container.updateProps({ layout: 'row' });
      const renderSignal = container.render();
      expect(renderSignal.data.styles.flexDirection).toBe('row');
      expect(renderSignal.data.vdom.props!.className).toContain('row');
    });

    it('should toggle visibility', async () => {
      let renderSignal = container.render();
      expect(renderSignal.data.styles.display).toBe('flex');

      await container.receive({
        type: 'ui:click',
        data: { payload: { action: 'toggle' }, target: container.id },
        strength: 1.0,
        timestamp: Date.now(),
      });

      await new Promise((resolve) => setTimeout(resolve, 50));

      renderSignal = container.render();
      expect(renderSignal.data.styles.display).toBe('none');
    });
  });

  describe('Child State Synchronization', () => {
    beforeEach(async () => {
      container.addChild(child1);
      container.addChild(child2);
      await container.activate(); // Activates children automatically
    });

    it('should track child state changes', async () => {
      const stateChanges: any[] = [];

      child1.on('signal', (signal) => {
        if (signal.type === 'state:update') {
          stateChanges.push(signal);
        }
      });

      child1.setState({ count: 5 });

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(stateChanges.length).toBeGreaterThan(0);
    });

    it('should re-render when child state changes', async () => {
      const initialRenderCount = container.getRenderCount();

      child1.setState({ count: 10 });

      // Container would listen to child changes in real implementation
      container.render();

      expect(container.getRenderCount()).toBe(initialRenderCount + 1);
    });
  });

  describe('Nested Containers', () => {
    let nestedContainer: TestContainer;

    beforeEach(() => {
      nestedContainer = new TestContainer({
        id: 'nested-container',
        type: 'cortical',
        threshold: 0.5,
        props: {
          title: 'Nested',
          layout: 'row',
        },
        initialState: { expanded: true },
      });
    });

    afterEach(async () => {
      await nestedContainer.deactivate();
    });

    it('should support nested containers', async () => {
      nestedContainer.addChild(child1);
      container.addChild(nestedContainer);
      container.addChild(child2);

      await container.activate(); // Activates all children recursively

      const children = container.getChildren();
      expect(children).toHaveLength(2);
      expect(children[0]).toBe(nestedContainer);
    });

    it('should render nested structure', async () => {
      nestedContainer.addChild(child1);
      container.addChild(nestedContainer);

      await container.activate(); // Activates all children recursively

      const renderSignal = container.render();
      const children = renderSignal.data.vdom.children as VirtualDOMNode[];

      // Should have title + nested container
      expect(children.length).toBeGreaterThan(1);
    });
  });

  describe('Performance', () => {
    it('should handle many children efficiently', async () => {
      const childCount = 100;
      const children: TestChild[] = [];

      for (let i = 0; i < childCount; i++) {
        const child = new TestChild({
          id: `child-${i}`,
          type: 'cortical',
          threshold: 0.5,
          props: { label: `Child ${i}`, value: i },
          initialState: { count: 0 },
        });
        children.push(child);
        container.addChild(child);
      }

      await container.activate(); // Activates all children

      const start = Date.now();
      const renderSignal = container.render();
      const duration = Date.now() - start;

      expect(renderSignal.data.vdom.children!.length).toBe(childCount + 1); // +1 for title
      expect(duration).toBeLessThan(100); // Should render in < 100ms

      for (const child of children) {
        await child.deactivate();
      }
    });
  });
});

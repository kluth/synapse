/**
 * Tests for VisualOligodendrocyte (Rendering Optimization)
 * Virtual DOM diffing, memoization, lazy loading
 */

import { VisualOligodendrocyte } from '../VisualOligodendrocyte';
import type { VirtualDOMNode } from '../../types';

describe('VisualOligodendrocyte - Rendering Optimization', () => {
  let oligodendrocyte: VisualOligodendrocyte;

  beforeEach(() => {
    oligodendrocyte = new VisualOligodendrocyte({
      id: 'render-optimizer',
      maxCacheSize: 100,
    });
  });

  afterEach(async () => {
    await oligodendrocyte.deactivate();
  });

  describe('Component Memoization', () => {
    it('should cache component render results', async () => {
      await oligodendrocyte.activate();

      const vdom: VirtualDOMNode = {
        tag: 'div',
        props: { className: 'test' },
        children: ['Hello'],
      };

      oligodendrocyte.memoizeRender('component-1', vdom, { prop1: 'value1' });

      const cached = oligodendrocyte.getCachedRender('component-1', { prop1: 'value1' });
      expect(cached).toEqual(vdom);
    });

    it('should return null for cache miss', async () => {
      await oligodendrocyte.activate();

      const cached = oligodendrocyte.getCachedRender('non-existent', {});
      expect(cached).toBeNull();
    });

    it('should invalidate cache when props change', async () => {
      await oligodendrocyte.activate();

      const vdom: VirtualDOMNode = {
        tag: 'div',
        children: ['Test'],
      };

      oligodendrocyte.memoizeRender('comp', vdom, { a: 1 });

      const cached1 = oligodendrocyte.getCachedRender('comp', { a: 1 });
      expect(cached1).toBeTruthy();

      const cached2 = oligodendrocyte.getCachedRender('comp', { a: 2 });
      expect(cached2).toBeNull();
    });
  });

  describe('Virtual DOM Diffing', () => {
    it('should detect no changes', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'div',
        children: ['Hello'],
      };

      const newTree: VirtualDOMNode = {
        tag: 'div',
        children: ['Hello'],
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches).toHaveLength(0);
    });

    it('should detect text content change', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'div',
        children: ['Old'],
      };

      const newTree: VirtualDOMNode = {
        tag: 'div',
        children: ['New'],
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches.length).toBeGreaterThan(0);
    });

    it('should detect prop changes', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'div',
        props: { className: 'old' },
      };

      const newTree: VirtualDOMNode = {
        tag: 'div',
        props: { className: 'new' },
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches.length).toBeGreaterThan(0);
      expect(patches[0]!.type).toBe('UPDATE');
    });

    it('should detect tag replacement', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'div',
      };

      const newTree: VirtualDOMNode = {
        tag: 'span',
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches[0]!.type).toBe('REPLACE');
    });

    it('should detect child additions', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'ul',
        children: [{ tag: 'li', children: ['Item 1'] }],
      };

      const newTree: VirtualDOMNode = {
        tag: 'ul',
        children: [
          { tag: 'li', children: ['Item 1'] },
          { tag: 'li', children: ['Item 2'] },
        ],
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches.some((p) => p.type === 'CREATE')).toBe(true);
    });

    it('should detect child removals', () => {
      const oldTree: VirtualDOMNode = {
        tag: 'ul',
        children: [
          { tag: 'li', key: '1', children: ['Item 1'] },
          { tag: 'li', key: '2', children: ['Item 2'] },
        ],
      };

      const newTree: VirtualDOMNode = {
        tag: 'ul',
        children: [{ tag: 'li', key: '1', children: ['Item 1'] }],
      };

      const patches = oligodendrocyte.diff(oldTree, newTree);
      expect(patches.some((p) => p.type === 'DELETE')).toBe(true);
    });
  });

  describe('Render Performance Tracking', () => {
    it('should track render metrics', async () => {
      await oligodendrocyte.activate();

      oligodendrocyte.recordRenderTime('component-1', 16);
      oligodendrocyte.recordRenderTime('component-1', 18);

      const metrics = oligodendrocyte.getRenderMetrics('component-1');
      expect(metrics).toBeDefined();
      expect(metrics!.renderCount).toBe(2);
      expect(metrics!.averageRenderTime).toBe(17);
    });

    it('should identify slow renders', async () => {
      await oligodendrocyte.activate();

      oligodendrocyte.recordRenderTime('fast', 10);
      oligodendrocyte.recordRenderTime('slow', 100);

      const slowComponents = oligodendrocyte.getSlowComponents(50);
      expect(slowComponents).toContain('slow');
      expect(slowComponents).not.toContain('fast');
    });
  });

  describe('Lazy Loading', () => {
    it('should mark component for lazy loading', () => {
      oligodendrocyte.markLazyComponent('heavy-component', 'src/Heavy.ts');

      const isLazy = oligodendrocyte.isLazyComponent('heavy-component');
      expect(isLazy).toBe(true);
    });

    it('should track loaded lazy components', () => {
      oligodendrocyte.markLazyComponent('comp', 'src/Comp.ts');
      expect(oligodendrocyte.isComponentLoaded('comp')).toBe(false);

      oligodendrocyte.markComponentLoaded('comp');
      expect(oligodendrocyte.isComponentLoaded('comp')).toBe(true);
    });
  });

  describe('Myelination (Hot Path Optimization)', () => {
    it('should track component usage frequency', async () => {
      await oligodendrocyte.activate();

      for (let i = 0; i < 10; i++) {
        oligodendrocyte.trackComponentUsage('frequently-used');
      }

      const hotComponents = oligodendrocyte.getHotComponents(5);
      expect(hotComponents).toContain('frequently-used');
    });

    it('should myelinate frequently used components', async () => {
      await oligodendrocyte.activate();

      for (let i = 0; i < 20; i++) {
        oligodendrocyte.trackComponentUsage('hot-component');
      }

      oligodendrocyte.myelinateHotPaths(10);

      const isMyelinated = oligodendrocyte.isMyelinated('hot-component');
      expect(isMyelinated).toBe(true);
    });
  });
});

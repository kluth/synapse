/**
 * HotReload Tests
 */

import { HotReload } from '../server/HotReload';
import type { FileChangeEvent, WatchPattern } from '../server/HotReload';

describe('HotReload - File Watching System', () => {
  let hotReload: HotReload;

  beforeEach(() => {
    hotReload = new HotReload({ verbose: false });
  });

  afterEach(async () => {
    if (hotReload.isWatching()) {
      await hotReload.stop();
    }
  });

  describe('Construction', () => {
    it('should create hot reload with default config', () => {
      expect(hotReload).toBeInstanceOf(HotReload);
      expect(hotReload.isWatching()).toBe(false);
    });

    it('should create hot reload with custom config', () => {
      const custom = new HotReload({
        patterns: [{ pattern: 'src/**/*.ts' }],
        debounce: 500,
        enabled: false,
      });

      expect(custom).toBeInstanceOf(HotReload);
    });
  });

  describe('Watch Lifecycle', () => {
    it('should start watching', async () => {
      await hotReload.start();
      expect(hotReload.isWatching()).toBe(true);
    });

    it('should stop watching', async () => {
      await hotReload.start();
      await hotReload.stop();
      expect(hotReload.isWatching()).toBe(false);
    });

    it('should emit started event', async () => {
      const startedHandler = jest.fn();
      hotReload.on('started', startedHandler);

      await hotReload.start();

      expect(startedHandler).toHaveBeenCalled();
    });

    it('should emit stopped event', async () => {
      const stoppedHandler = jest.fn();
      hotReload.on('stopped', stoppedHandler);

      await hotReload.start();
      await hotReload.stop();

      expect(stoppedHandler).toHaveBeenCalled();
    });

    it('should throw error when starting while already watching', async () => {
      await hotReload.start();
      await expect(hotReload.start()).rejects.toThrow('Hot reload is already watching');
    });

    it('should not start when disabled', async () => {
      const disabled = new HotReload({ enabled: false });
      await disabled.start();

      expect(disabled.isWatching()).toBe(false);
    });
  });

  describe('Watch Patterns', () => {
    it('should add watch pattern', () => {
      const pattern: WatchPattern = {
        pattern: 'src/**/*.ts',
        extensions: ['.ts', '.tsx'],
      };

      hotReload.addPattern(pattern);

      const addedHandler = jest.fn();
      hotReload.on('pattern:added', addedHandler);

      hotReload.addPattern({ pattern: 'test/**/*.ts' });
      // Event only emitted if watching
    });

    it('should remove watch pattern', () => {
      hotReload.addPattern({ pattern: 'src/**/*.ts' });

      const removedHandler = jest.fn();
      hotReload.on('pattern:removed', removedHandler);

      hotReload.removePattern('src/**/*.ts');

      expect(removedHandler).toHaveBeenCalledWith({
        pattern: 'src/**/*.ts',
      });
    });

    it('should emit pattern:added when watching', async () => {
      await hotReload.start();

      const addedHandler = jest.fn();
      hotReload.on('pattern:added', addedHandler);

      hotReload.addPattern({ pattern: 'src/**/*.ts' });

      expect(addedHandler).toHaveBeenCalled();
    });
  });

  describe('File Changes', () => {
    it('should handle file change', (done) => {
      const event: FileChangeEvent = {
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      };

      hotReload.on('change', (changeEvent: FileChangeEvent) => {
        expect(changeEvent).toEqual(event);
        done();
      });

      hotReload.handleChange(event);
    });

    it('should handle file added', (done) => {
      const event: FileChangeEvent = {
        type: 'added',
        path: 'src/new.ts',
        timestamp: Date.now(),
        size: 1024,
      };

      hotReload.on('change', (changeEvent: FileChangeEvent) => {
        expect(changeEvent.type).toBe('added');
        expect(changeEvent.path).toBe('src/new.ts');
        done();
      });

      hotReload.handleChange(event);
    });

    it('should handle file removed', (done) => {
      const event: FileChangeEvent = {
        type: 'removed',
        path: 'src/old.ts',
        timestamp: Date.now(),
      };

      hotReload.on('change', (changeEvent: FileChangeEvent) => {
        expect(changeEvent.type).toBe('removed');
        done();
      });

      hotReload.handleChange(event);
    });

    it('should debounce file changes', (done) => {
      const changeHandler = jest.fn();
      hotReload.on('change', changeHandler);

      // Fire multiple changes quickly
      hotReload.handleChange({
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      // Should only emit once after debounce
      setTimeout(() => {
        expect(changeHandler).toHaveBeenCalledTimes(1);
        done();
      }, 400);
    });

    it('should debounce different files separately', (done) => {
      const changeHandler = jest.fn();
      hotReload.on('change', changeHandler);

      hotReload.handleChange({
        type: 'changed',
        path: 'src/file1.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'changed',
        path: 'src/file2.ts',
        timestamp: Date.now(),
      });

      setTimeout(() => {
        expect(changeHandler).toHaveBeenCalledTimes(2);
        done();
      }, 400);
    });
  });

  describe('Ignore Patterns', () => {
    it('should check if file should be ignored', () => {
      expect(hotReload.shouldIgnore('node_modules/test/file.ts')).toBe(true);
      expect(hotReload.shouldIgnore('src/test.test.ts')).toBe(true);
      expect(hotReload.shouldIgnore('src/test.spec.ts')).toBe(true);
    });

    it('should not ignore regular files', () => {
      expect(hotReload.shouldIgnore('src/component.ts')).toBe(false);
      expect(hotReload.shouldIgnore('src/utils/helper.ts')).toBe(false);
    });

    it('should support custom ignore patterns', () => {
      const custom = new HotReload({
        ignore: ['dist/**', '*.log'],
      });

      expect(custom.shouldIgnore('dist/bundle.js')).toBe(true);
      expect(custom.shouldIgnore('debug.log')).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should track file changes', () => {
      hotReload.handleChange({
        type: 'added',
        path: 'src/new.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'removed',
        path: 'src/old.ts',
        timestamp: Date.now(),
      });

      const stats = hotReload.getStatistics();

      expect(stats.totalChanges).toBe(3);
      expect(stats.byType.added).toBe(1);
      expect(stats.byType.changed).toBe(1);
      expect(stats.byType.removed).toBe(1);
    });

    it('should track watched files', () => {
      hotReload.handleChange({
        type: 'added',
        path: 'src/file1.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'added',
        path: 'src/file2.ts',
        timestamp: Date.now(),
      });

      const stats = hotReload.getStatistics();
      expect(stats.watchedFiles).toBe(2);

      const files = hotReload.getWatchedFiles();
      expect(files).toContain('src/file1.ts');
      expect(files).toContain('src/file2.ts');
    });

    it('should update watched files when file removed', () => {
      hotReload.handleChange({
        type: 'added',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      hotReload.handleChange({
        type: 'removed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      const stats = hotReload.getStatistics();
      expect(stats.watchedFiles).toBe(0);
    });

    it('should clear statistics', () => {
      hotReload.handleChange({
        type: 'changed',
        path: 'src/test.ts',
        timestamp: Date.now(),
      });

      hotReload.clearStatistics();

      const stats = hotReload.getStatistics();
      expect(stats.totalChanges).toBe(0);
      expect(stats.byType.added).toBe(0);
      expect(stats.byType.changed).toBe(0);
      expect(stats.byType.removed).toBe(0);
    });
  });

  describe('Manual Reload', () => {
    it('should trigger manual reload', () => {
      const changeHandler = jest.fn();
      const manualHandler = jest.fn();

      hotReload.on('change', changeHandler);
      hotReload.on('manual:reload', manualHandler);

      hotReload.triggerReload('src/test.ts', 'Manual trigger');

      expect(changeHandler).toHaveBeenCalled();
      expect(manualHandler).toHaveBeenCalledWith({
        path: 'src/test.ts',
        reason: 'Manual trigger',
      });
    });
  });
});

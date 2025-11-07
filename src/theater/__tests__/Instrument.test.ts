import { Instrument } from '../core/Instrument';

// Concrete implementation for testing
class TestInstrument extends Instrument {
  public initializeCalled = false;
  public cleanupCalled = false;

  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  public async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }

  public render(): string {
    return `<div class="test-instrument">${this.name}</div>`;
  }
}

describe('Instrument - Base Development Tool', () => {
  describe('Construction', () => {
    it('should create an instrument with required config', () => {
      const instrument = new TestInstrument({
        id: 'test-inst',
        name: 'Test Instrument',
      });

      expect(instrument.id).toBe('test-inst');
      expect(instrument.name).toBe('Test Instrument');
      expect(instrument.icon).toBe('🔬'); // Default icon
    });

    it('should create an instrument with full config', () => {
      const instrument = new TestInstrument({
        id: 'full-inst',
        name: 'Full Instrument',
        icon: '🔧',
        defaultPosition: 'left',
        defaultState: 'active',
        shortcut: 'Ctrl+Shift+I',
        priority: 10,
      });

      expect(instrument.id).toBe('full-inst');
      expect(instrument.name).toBe('Full Instrument');
      expect(instrument.icon).toBe('🔧');
      expect(instrument.getPosition()).toBe('left');
      expect(instrument.getState()).toBe('active');
      expect(instrument.shortcut).toBe('Ctrl+Shift+I');
      expect(instrument.priority).toBe(10);
    });

    it('should use default values', () => {
      const instrument = new TestInstrument({
        id: 'default-inst',
        name: 'Default Instrument',
      });

      expect(instrument.getState()).toBe('inactive');
      expect(instrument.getPosition()).toBe('right');
      expect(instrument.priority).toBe(0);
    });
  });

  describe('State Management', () => {
    it('should open instrument', () => {
      const instrument = new TestInstrument({
        id: 'open-test',
        name: 'Open Test',
      });

      let stateChangeEmitted = false;
      instrument.on('state:change', (data) => {
        stateChangeEmitted = true;
        expect(data.state).toBe('active');
      });

      instrument.open();

      expect(instrument.getState()).toBe('active');
      expect(stateChangeEmitted).toBe(true);
    });

    it('should close instrument', () => {
      const instrument = new TestInstrument({
        id: 'close-test',
        name: 'Close Test',
        defaultState: 'active',
      });

      let stateChangeEmitted = false;
      instrument.on('state:change', (data) => {
        stateChangeEmitted = true;
        expect(data.state).toBe('inactive');
      });

      instrument.close();

      expect(instrument.getState()).toBe('inactive');
      expect(stateChangeEmitted).toBe(true);
    });

    it('should minimize instrument', () => {
      const instrument = new TestInstrument({
        id: 'minimize-test',
        name: 'Minimize Test',
        defaultState: 'active',
      });

      let stateChangeEmitted = false;
      instrument.on('state:change', (data) => {
        stateChangeEmitted = true;
        expect(data.state).toBe('minimized');
      });

      instrument.minimize();

      expect(instrument.getState()).toBe('minimized');
      expect(stateChangeEmitted).toBe(true);
    });

    it('should toggle instrument state', () => {
      const instrument = new TestInstrument({
        id: 'toggle-test',
        name: 'Toggle Test',
      });

      expect(instrument.getState()).toBe('inactive');

      instrument.toggle();
      expect(instrument.getState()).toBe('active');

      instrument.toggle();
      expect(instrument.getState()).toBe('inactive');
    });
  });

  describe('Position Management', () => {
    it('should set position', () => {
      const instrument = new TestInstrument({
        id: 'position-test',
        name: 'Position Test',
      });

      let positionChangeEmitted = false;
      instrument.on('position:change', (data) => {
        positionChangeEmitted = true;
        expect(data.position).toBe('left');
      });

      instrument.setPosition('left');

      expect(instrument.getPosition()).toBe('left');
      expect(positionChangeEmitted).toBe(true);
    });

    it('should support all position values', () => {
      const instrument = new TestInstrument({
        id: 'pos-test',
        name: 'Position Test',
      });

      instrument.setPosition('left');
      expect(instrument.getPosition()).toBe('left');

      instrument.setPosition('right');
      expect(instrument.getPosition()).toBe('right');

      instrument.setPosition('bottom');
      expect(instrument.getPosition()).toBe('bottom');

      instrument.setPosition('floating');
      expect(instrument.getPosition()).toBe('floating');
    });
  });

  describe('Data Management', () => {
    it('should store and retrieve data', () => {
      const instrument = new TestInstrument({
        id: 'data-test',
        name: 'Data Test',
      });

      let dataChangeEmitted = false;
      instrument.on('data:change', (data) => {
        dataChangeEmitted = true;
        expect(data.key).toBe('foo');
        expect(data.value).toBe('bar');
      });

      instrument.setData('foo', 'bar');

      expect(instrument.getData('foo')).toBe('bar');
      expect(dataChangeEmitted).toBe(true);
    });

    it('should store different data types', () => {
      const instrument = new TestInstrument({
        id: 'types-test',
        name: 'Types Test',
      });

      instrument.setData('string', 'hello');
      instrument.setData('number', 42);
      instrument.setData('boolean', true);
      instrument.setData('object', { foo: 'bar' });
      instrument.setData('array', [1, 2, 3]);

      expect(instrument.getData('string')).toBe('hello');
      expect(instrument.getData('number')).toBe(42);
      expect(instrument.getData('boolean')).toBe(true);
      expect(instrument.getData('object')).toEqual({ foo: 'bar' });
      expect(instrument.getData('array')).toEqual([1, 2, 3]);
    });

    it('should return undefined for non-existent keys', () => {
      const instrument = new TestInstrument({
        id: 'undefined-test',
        name: 'Undefined Test',
      });

      expect(instrument.getData('does-not-exist')).toBeUndefined();
    });

    it('should get all data', () => {
      const instrument = new TestInstrument({
        id: 'all-data-test',
        name: 'All Data Test',
      });

      instrument.setData('key1', 'value1');
      instrument.setData('key2', 'value2');
      instrument.setData('key3', 'value3');

      const allData = instrument.getAllData();

      expect(allData).toEqual({
        key1: 'value1',
        key2: 'value2',
        key3: 'value3',
      });
    });

    it('should clear all data', () => {
      const instrument = new TestInstrument({
        id: 'clear-test',
        name: 'Clear Test',
      });

      instrument.setData('key1', 'value1');
      instrument.setData('key2', 'value2');

      let dataClearEmitted = false;
      instrument.on('data:clear', () => {
        dataClearEmitted = true;
      });

      instrument.clearData();

      expect(instrument.getAllData()).toEqual({});
      expect(instrument.getData('key1')).toBeUndefined();
      expect(dataClearEmitted).toBe(true);
    });
  });

  describe('State Persistence', () => {
    it('should export state', () => {
      const instrument = new TestInstrument({
        id: 'export-test',
        name: 'Export Test',
      });

      instrument.open();
      instrument.setPosition('left');
      instrument.setData('key1', 'value1');
      instrument.setData('key2', 'value2');

      const exported = instrument.exportState();

      expect(exported.state).toBe('active');
      expect(exported.position).toBe('left');
      expect(exported.data).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should import state', () => {
      const instrument = new TestInstrument({
        id: 'import-test',
        name: 'Import Test',
      });

      let stateImportEmitted = false;
      instrument.on('state:import', () => {
        stateImportEmitted = true;
      });

      instrument.importState({
        state: 'active',
        position: 'bottom',
        data: {
          restored: true,
          count: 42,
        },
      });

      expect(instrument.getState()).toBe('active');
      expect(instrument.getPosition()).toBe('bottom');
      expect(instrument.getData('restored')).toBe(true);
      expect(instrument.getData('count')).toBe(42);
      expect(stateImportEmitted).toBe(true);
    });

    it('should partially import state', () => {
      const instrument = new TestInstrument({
        id: 'partial-import-test',
        name: 'Partial Import Test',
      });

      instrument.setPosition('right');
      instrument.setData('existing', 'data');

      // Only import state, leave position and data unchanged
      instrument.importState({
        state: 'minimized',
      });

      expect(instrument.getState()).toBe('minimized');
      expect(instrument.getPosition()).toBe('right'); // Unchanged
      expect(instrument.getData('existing')).toBe('data'); // Unchanged
    });

    it('should export and re-import state', () => {
      const instrument1 = new TestInstrument({
        id: 'inst1',
        name: 'Instrument 1',
      });

      instrument1.open();
      instrument1.setPosition('left');
      instrument1.setData('foo', 'bar');

      const exported = instrument1.exportState();

      const instrument2 = new TestInstrument({
        id: 'inst2',
        name: 'Instrument 2',
      });

      instrument2.importState(exported);

      expect(instrument2.getState()).toBe(instrument1.getState());
      expect(instrument2.getPosition()).toBe(instrument1.getPosition());
      expect(instrument2.getData('foo')).toBe('bar');
    });
  });

  describe('Lifecycle', () => {
    it('should call initialize', async () => {
      const instrument = new TestInstrument({
        id: 'init-test',
        name: 'Init Test',
      });

      expect(instrument.initializeCalled).toBe(false);

      await instrument.initialize();

      expect(instrument.initializeCalled).toBe(true);
    });

    it('should call cleanup', async () => {
      const instrument = new TestInstrument({
        id: 'cleanup-test',
        name: 'Cleanup Test',
      });

      expect(instrument.cleanupCalled).toBe(false);

      await instrument.cleanup();

      expect(instrument.cleanupCalled).toBe(true);
    });
  });

  describe('Rendering', () => {
    it('should render instrument UI', () => {
      const instrument = new TestInstrument({
        id: 'render-test',
        name: 'Render Test',
      });

      const html = instrument.render();

      expect(html).toContain('test-instrument');
      expect(html).toContain('Render Test');
    });
  });
});

import { Theater } from '../core/Theater';
import { Instrument } from '../core/Instrument';

// Mock instrument for testing
class MockInstrument extends Instrument {
  public initializeCalled = false;
  public cleanupCalled = false;

  public async initialize(): Promise<void> {
    this.initializeCalled = true;
  }

  public async cleanup(): Promise<void> {
    this.cleanupCalled = true;
  }

  public render(): string {
    return '<div>Mock Instrument</div>';
  }
}

describe('Theater - Main Orchestrator', () => {
  describe('Initialization', () => {
    it('should create a theater with configuration', () => {
      const theater = new Theater({
        title: 'Test Theater',
        port: 3000,
        darkMode: true,
      });

      expect(theater).toBeDefined();
      expect(theater.stage).toBeDefined();
      expect(theater.amphitheater).toBeDefined();

      const config = theater.getConfig();
      expect(config.title).toBe('Test Theater');
      expect(config.port).toBe(3000);
      expect(config.darkMode).toBe(true);
    });

    it('should use default configuration', () => {
      const theater = new Theater({ title: 'Default Test' });
      const config = theater.getConfig();

      expect(config.port).toBe(6006);
      expect(config.hotReload).toBe(true);
      expect(config.darkMode).toBe(false);
    });

    it('should have stopped state initially', () => {
      const theater = new Theater({ title: 'State Test' });
      expect(theater.getState()).toBe('stopped');
      expect(theater.isRunning()).toBe(false);
    });
  });

  describe('Lifecycle Management', () => {
    it('should start the theater', async () => {
      const theater = new Theater({ title: 'Start Test' });

      await theater.start();

      expect(theater.getState()).toBe('running');
      expect(theater.isRunning()).toBe(true);
    });

    it('should emit started event', async () => {
      const theater = new Theater({ title: 'Event Test' });
      let eventEmitted = false;

      theater.on('started', () => {
        eventEmitted = true;
      });

      await theater.start();
      expect(eventEmitted).toBe(true);
    });

    it('should stop the theater', async () => {
      const theater = new Theater({ title: 'Stop Test' });

      await theater.start();
      expect(theater.isRunning()).toBe(true);

      await theater.stop();
      expect(theater.getState()).toBe('stopped');
      expect(theater.isRunning()).toBe(false);
    });

    it('should emit stopped event', async () => {
      const theater = new Theater({ title: 'Stop Event Test' });
      let eventEmitted = false;

      await theater.start();

      theater.on('stopped', () => {
        eventEmitted = true;
      });

      await theater.stop();
      expect(eventEmitted).toBe(true);
    });

    it('should reload the theater', async () => {
      const theater = new Theater({ title: 'Reload Test' });
      let reloadedEventEmitted = false;

      await theater.start();

      theater.on('reloaded', () => {
        reloadedEventEmitted = true;
      });

      await theater.reload();

      expect(theater.isRunning()).toBe(true);
      expect(reloadedEventEmitted).toBe(true);
    });

    it('should not start twice', async () => {
      const theater = new Theater({ title: 'Double Start Test' });

      await theater.start();
      const firstState = theater.getState();

      await theater.start(); // Should be no-op
      const secondState = theater.getState();

      expect(firstState).toBe('running');
      expect(secondState).toBe('running');
    });

    it('should not stop when already stopped', async () => {
      const theater = new Theater({ title: 'Double Stop Test' });

      await theater.start();
      await theater.stop();

      const firstState = theater.getState();
      await theater.stop(); // Should be no-op
      const secondState = theater.getState();

      expect(firstState).toBe('stopped');
      expect(secondState).toBe('stopped');
    });
  });

  describe('Instrument Management', () => {
    it('should register an instrument', () => {
      const theater = new Theater({ title: 'Instrument Test' });
      const instrument = new MockInstrument({
        id: 'test-instrument',
        name: 'Test Instrument',
      });

      theater.registerInstrument(instrument);

      const registered = theater.getInstrument('test-instrument');
      expect(registered).toBe(instrument);
    });

    it('should emit instrument:registered event', () => {
      const theater = new Theater({ title: 'Instrument Event Test' });
      const instrument = new MockInstrument({
        id: 'event-instrument',
        name: 'Event Instrument',
      });

      let eventEmitted = false;
      theater.on('instrument:registered', (data) => {
        eventEmitted = true;
        expect(data.instrument).toBe(instrument);
      });

      theater.registerInstrument(instrument);
      expect(eventEmitted).toBe(true);
    });

    it('should initialize instrument when theater is running', async () => {
      const theater = new Theater({ title: 'Init Instrument Test' });
      await theater.start();

      const instrument = new MockInstrument({
        id: 'init-instrument',
        name: 'Init Instrument',
      });

      theater.registerInstrument(instrument);

      // Give it a moment to initialize
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(instrument.initializeCalled).toBe(true);
    });

    it('should throw error when registering duplicate instrument', () => {
      const theater = new Theater({ title: 'Duplicate Test' });
      const instrument1 = new MockInstrument({
        id: 'duplicate',
        name: 'First',
      });
      const instrument2 = new MockInstrument({
        id: 'duplicate',
        name: 'Second',
      });

      theater.registerInstrument(instrument1);

      expect(() => {
        theater.registerInstrument(instrument2);
      }).toThrow('Instrument already registered: duplicate');
    });

    it('should unregister an instrument', async () => {
      const theater = new Theater({ title: 'Unregister Test' });
      const instrument = new MockInstrument({
        id: 'remove-me',
        name: 'Remove Me',
      });

      theater.registerInstrument(instrument);
      expect(theater.getInstrument('remove-me')).toBe(instrument);

      await theater.unregisterInstrument('remove-me');
      expect(theater.getInstrument('remove-me')).toBeUndefined();
      expect(instrument.cleanupCalled).toBe(true);
    });

    it('should get all instruments', () => {
      const theater = new Theater({ title: 'Get All Test' });
      const instrument1 = new MockInstrument({ id: 'inst1', name: 'Inst 1' });
      const instrument2 = new MockInstrument({ id: 'inst2', name: 'Inst 2' });
      const instrument3 = new MockInstrument({ id: 'inst3', name: 'Inst 3' });

      theater.registerInstrument(instrument1);
      theater.registerInstrument(instrument2);
      theater.registerInstrument(instrument3);

      const instruments = theater.getInstruments();
      expect(instruments).toHaveLength(3);
      expect(instruments).toContain(instrument1);
      expect(instruments).toContain(instrument2);
      expect(instruments).toContain(instrument3);
    });

    it('should cleanup instruments on stop', async () => {
      const theater = new Theater({ title: 'Cleanup Test' });
      const instrument = new MockInstrument({
        id: 'cleanup-instrument',
        name: 'Cleanup Instrument',
      });

      theater.registerInstrument(instrument);
      await theater.start();
      await theater.stop();

      expect(instrument.cleanupCalled).toBe(true);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const theater = new Theater({ title: 'Update Config Test' });

      theater.updateConfig({ port: 8080, darkMode: true });

      const config = theater.getConfig();
      expect(config.port).toBe(8080);
      expect(config.darkMode).toBe(true);
    });

    it('should emit config:update event', () => {
      const theater = new Theater({ title: 'Config Event Test' });
      let eventEmitted = false;

      theater.on('config:update', (data) => {
        eventEmitted = true;
        expect(data.config.port).toBe(9000);
      });

      theater.updateConfig({ port: 9000 });
      expect(eventEmitted).toBe(true);
    });

    it('should apply theme change to amphitheater', () => {
      const theater = new Theater({ title: 'Theme Test', darkMode: false });
      expect(theater.amphitheater.getTheme()).toBe('light');

      theater.updateConfig({ darkMode: true });
      expect(theater.amphitheater.getTheme()).toBe('dark');
    });

    it('should enable hot reload', () => {
      const theater = new Theater({ title: 'HMR Test', hotReload: false });

      theater.enableHotReload();

      const config = theater.getConfig();
      expect(config.hotReload).toBe(true);
    });

    it('should disable hot reload', () => {
      const theater = new Theater({ title: 'Disable HMR Test', hotReload: true });

      theater.disableHotReload();

      const config = theater.getConfig();
      expect(config.hotReload).toBe(false);
    });
  });

  describe('Statistics', () => {
    it('should provide theater statistics', () => {
      const theater = new Theater({ title: 'Stats Test' });
      const instrument = new MockInstrument({ id: 'stat-inst', name: 'Stat Instrument' });

      theater.registerInstrument(instrument);

      const stats = theater.getStats();

      expect(stats.state).toBe('stopped');
      expect(stats.instruments).toBe(1);
      expect(stats.config.title).toBe('Stats Test');
      expect(stats.amphitheaterStats).toBeDefined();
      expect(stats.stageStats).toBeDefined();
    });
  });

  describe('Event Propagation', () => {
    it('should propagate stage events', async () => {
      const theater = new Theater({ title: 'Stage Events Test' });
      let mountedEventEmitted = false;

      theater.on('stage:mounted', (data) => {
        mountedEventEmitted = true;
        expect(data.id).toBeDefined();
      });

      const element = document.createElement('div');
      await theater.stage.initialize(document.createElement('div'));
      await theater.stage.mount(element, 'test-component');

      expect(mountedEventEmitted).toBe(true);
    });

    it('should propagate amphitheater events', () => {
      const theater = new Theater({ title: 'Amphitheater Events Test' });
      let selectedEventEmitted = false;

      theater.on('specimen:selected', (data) => {
        selectedEventEmitted = true;
        expect(data.id).toBe('test-specimen');
      });

      theater.amphitheater.registerSpecimen({
        id: 'test-specimen',
        name: 'Test Specimen',
        category: 'Test',
        tags: ['test'],
      });

      theater.amphitheater.selectSpecimen('test-specimen');
      expect(selectedEventEmitted).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should dispose theater completely', async () => {
      const theater = new Theater({ title: 'Dispose Test' });
      const instrument = new MockInstrument({ id: 'dispose-inst', name: 'Dispose Inst' });

      theater.registerInstrument(instrument);
      await theater.start();

      await theater.dispose();

      expect(theater.getState()).toBe('stopped');
      expect(theater.getInstruments()).toHaveLength(0);
    });
  });
});

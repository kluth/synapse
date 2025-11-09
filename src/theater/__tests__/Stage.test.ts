import { Stage, VIEWPORTS } from '../core/Stage';

describe('Stage - Component Rendering Platform', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Initialization', () => {
    it('should create a stage with default configuration', () => {
      const stage = new Stage();
      expect(stage).toBeDefined();
    });

    it('should create a stage with custom configuration', () => {
      const stage = new Stage({
        isolation: 'shadow-dom',
        viewport: { width: 800, height: 600 },
        responsive: false,
        backgroundColor: '#f0f0f0',
      });

      const stats = stage.getStats();
      expect(stats.isolation).toBe('shadow-dom');
      expect(stats.backgroundColor).toBe('#f0f0f0');
    });

    it('should initialize the stage', async () => {
      const stage = new Stage();
      let initializedEventEmitted = false;

      stage.on('initialized', () => {
        initializedEventEmitted = true;
      });

      await stage.initialize(container);
      expect(initializedEventEmitted).toBe(true);
    });
  });

  describe('Component Mounting', () => {
    it('should mount a component', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element = document.createElement('div');
      element.textContent = 'Test Component';

      let mountedEventEmitted = false;
      stage.on('mounted', (data) => {
        mountedEventEmitted = true;
        expect(data.id).toBe('test-comp');
      });

      await stage.mount(element, 'test-comp');

      expect(mountedEventEmitted).toBe(true);
      expect(stage.hasMountedComponent()).toBe(true);
    });

    it('should get mounted component', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element = document.createElement('div');
      await stage.mount(element, 'my-component');

      const mounted = stage.getMountedComponent();
      expect(mounted).not.toBeNull();
      expect(mounted!.id).toBe('my-component');
      expect(mounted!.element).toBe(element);
      expect(mounted!.timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should unmount a component', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element = document.createElement('div');
      await stage.mount(element, 'unmount-test');

      expect(stage.hasMountedComponent()).toBe(true);

      let unmountedEventEmitted = false;
      stage.on('unmounted', (data) => {
        unmountedEventEmitted = true;
        expect(data.id).toBe('unmount-test');
      });

      await stage.unmount();

      expect(unmountedEventEmitted).toBe(true);
      expect(stage.hasMountedComponent()).toBe(false);
    });

    it('should unmount previous component when mounting new one', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element1 = document.createElement('div');
      const element2 = document.createElement('div');

      await stage.mount(element1, 'first');
      expect(stage.getMountedComponent()!.id).toBe('first');

      await stage.mount(element2, 'second');
      expect(stage.getMountedComponent()!.id).toBe('second');
    });

    it('should throw error when mounting without initialization', async () => {
      const stage = new Stage();
      const element = document.createElement('div');

      await expect(stage.mount(element, 'error-test')).rejects.toThrow('Stage not initialized');
    });
  });

  describe('Viewport Management', () => {
    it('should set viewport size', async () => {
      const stage = new Stage();
      await stage.initialize(container);

      let viewportChangeEmitted = false;
      stage.on('viewport:change', (data) => {
        viewportChangeEmitted = true;
        expect(data.viewport.width).toBe(1024);
        expect(data.viewport.height).toBe(768);
      });

      stage.setViewport({ width: 1024, height: 768, label: 'Custom' });

      const viewport = stage.getViewport();
      expect(viewport.width).toBe(1024);
      expect(viewport.height).toBe(768);
      expect(viewportChangeEmitted).toBe(true);
    });

    it('should resize to specific dimensions', async () => {
      const stage = new Stage();
      await stage.initialize(container);

      let resizeEmitted = false;
      stage.on('resize', (data) => {
        resizeEmitted = true;
        expect(data.width).toBe(800);
        expect(data.height).toBe(600);
      });

      stage.resize(800, 600);

      const viewport = stage.getViewport();
      expect(viewport.width).toBe(800);
      expect(viewport.height).toBe(600);
      expect(resizeEmitted).toBe(true);
    });

    it('should use predefined viewport sizes', async () => {
      const stage = new Stage();
      await stage.initialize(container);

      stage.setViewport(VIEWPORTS.mobile);
      let viewport = stage.getViewport();
      expect(viewport.width).toBe(375);
      expect(viewport.height).toBe(667);

      stage.setViewport(VIEWPORTS.tablet);
      viewport = stage.getViewport();
      expect(viewport.width).toBe(768);
      expect(viewport.height).toBe(1024);

      stage.setViewport(VIEWPORTS.desktop);
      viewport = stage.getViewport();
      expect(viewport.width).toBe(1920);
      expect(viewport.height).toBe(1080);
    });
  });

  describe('Styling', () => {
    it('should set background color', async () => {
      const stage = new Stage();
      await stage.initialize(container);

      let backgroundChangeEmitted = false;
      stage.on('background:change', (data) => {
        backgroundChangeEmitted = true;
        expect(data.color).toBe('#f5f5f5');
      });

      stage.setBackgroundColor('#f5f5f5');

      const stats = stage.getStats();
      expect(stats.backgroundColor).toBe('#f5f5f5');
      expect(backgroundChangeEmitted).toBe(true);
    });
  });

  describe('Screenshots', () => {
    it('should capture screenshot when enabled', async () => {
      const stage = new Stage({ screenshots: true });
      await stage.initialize(container);

      const screenshot = await stage.captureScreenshot();
      expect(screenshot).not.toBeNull();
      expect(screenshot).toContain('data:image/png;base64');
    });

    it('should return null when screenshots disabled', async () => {
      const stage = new Stage({ screenshots: false });
      await stage.initialize(container);

      const screenshot = await stage.captureScreenshot();
      expect(screenshot).toBeNull();
    });
  });

  describe('Statistics', () => {
    it('should provide stage statistics', async () => {
      const stage = new Stage({
        isolation: 'iframe',
        viewport: { width: 1920, height: 1080 },
        backgroundColor: '#ffffff',
      });
      await stage.initialize(container);

      const stats = stage.getStats();

      expect(stats.hasMounted).toBe(false);
      expect(stats.viewport.width).toBe(1920);
      expect(stats.viewport.height).toBe(1080);
      expect(stats.isolation).toBe('iframe');
      expect(stats.backgroundColor).toBe('#ffffff');
    });

    it('should update statistics after mounting', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const statsBefore = stage.getStats();
      expect(statsBefore.hasMounted).toBe(false);

      const element = document.createElement('div');
      await stage.mount(element, 'stats-test');

      const statsAfter = stage.getStats();
      expect(statsAfter.hasMounted).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup stage', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element = document.createElement('div');
      await stage.mount(element, 'cleanup-test');

      let cleanupEmitted = false;
      stage.on('cleanup', () => {
        cleanupEmitted = true;
      });

      await stage.cleanup();

      expect(cleanupEmitted).toBe(true);
      expect(stage.hasMountedComponent()).toBe(false);
    });
  });

  describe('Isolation Modes', () => {
    it('should mount with iframe isolation', async () => {
      const stage = new Stage({ isolation: 'iframe' });
      await stage.initialize(container);

      const element = document.createElement('div');
      element.textContent = 'Iframe Test';

      await stage.mount(element, 'iframe-test');

      // Check that iframe was created
      const iframe = container.querySelector('iframe');
      expect(iframe).not.toBeNull();
    });

    it('should mount with shadow DOM isolation', async () => {
      const stage = new Stage({ isolation: 'shadow-dom' });
      await stage.initialize(container);

      const element = document.createElement('div');
      element.textContent = 'Shadow DOM Test';

      await stage.mount(element, 'shadow-test');

      // Check that shadow root was created
      const wrapper = container.querySelector('div');
      expect(wrapper).not.toBeNull();
      expect(wrapper!.shadowRoot).not.toBeNull();
    });

    it('should mount with no isolation', async () => {
      const stage = new Stage({ isolation: 'none' });
      await stage.initialize(container);

      const element = document.createElement('div');
      element.textContent = 'No Isolation Test';

      await stage.mount(element, 'no-isolation-test');

      // Check that element was appended directly
      expect(container.querySelector('div')).toBe(element);
    });
  });

  describe('Predefined Viewports', () => {
    it('should have mobile viewport', () => {
      expect(VIEWPORTS.mobile.width).toBe(375);
      expect(VIEWPORTS.mobile.height).toBe(667);
      expect(VIEWPORTS.mobile.label).toBe('iPhone SE');
    });

    it('should have tablet viewport', () => {
      expect(VIEWPORTS.tablet.width).toBe(768);
      expect(VIEWPORTS.tablet.height).toBe(1024);
      expect(VIEWPORTS.tablet.label).toBe('iPad');
    });

    it('should have desktop viewport', () => {
      expect(VIEWPORTS.desktop.width).toBe(1920);
      expect(VIEWPORTS.desktop.height).toBe(1080);
      expect(VIEWPORTS.desktop.label).toBe('Desktop HD');
    });
  });
});

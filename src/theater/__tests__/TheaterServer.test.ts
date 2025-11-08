/**
 * TheaterServer Tests
 */

import { TheaterServer } from '../server/TheaterServer';
import type { RequestInfo } from '../server/TheaterServer';

describe('TheaterServer - Development Server', () => {
  let server: TheaterServer;

  beforeEach(() => {
    server = new TheaterServer({ verbose: false });
  });

  afterEach(async () => {
    if (server.isRunning()) {
      await server.stop();
    }
  });

  describe('Construction', () => {
    it('should create server with default config', () => {
      expect(server).toBeInstanceOf(TheaterServer);
      expect(server.getState()).toBe('stopped');
    });

    it('should create server with custom config', () => {
      const customServer = new TheaterServer({
        port: 8080,
        host: '0.0.0.0',
        hotReload: false,
      });

      const config = customServer.getConfig();
      expect(config.port).toBe(8080);
      expect(config.host).toBe('0.0.0.0');
      expect(config.hotReload).toBe(false);
    });

    it('should use default values', () => {
      const config = server.getConfig();
      expect(config.port).toBe(6006);
      expect(config.host).toBe('localhost');
      expect(config.hotReload).toBe(true);
    });
  });

  describe('Server Lifecycle', () => {
    it('should start server', async () => {
      await server.start();
      expect(server.getState()).toBe('running');
      expect(server.isRunning()).toBe(true);
    });

    it('should stop server', async () => {
      await server.start();
      await server.stop();
      expect(server.getState()).toBe('stopped');
      expect(server.isRunning()).toBe(false);
    });

    it('should restart server', async () => {
      await server.start();
      await server.restart();
      expect(server.getState()).toBe('running');
    });

    it('should emit started event', async () => {
      const startedHandler = jest.fn();
      server.on('started', startedHandler);

      await server.start();

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 6006,
          host: 'localhost',
          url: 'http://localhost:6006',
        }),
      );
    });

    it('should emit stopped event', async () => {
      const stoppedHandler = jest.fn();
      server.on('stopped', stoppedHandler);

      await server.start();
      await server.stop();

      expect(stoppedHandler).toHaveBeenCalled();
    });

    it('should emit state:change events', async () => {
      const stateChangeHandler = jest.fn();
      server.on('state:change', stateChangeHandler);

      await server.start();

      expect(stateChangeHandler).toHaveBeenCalledWith({
        from: 'stopped',
        to: 'starting',
      });

      expect(stateChangeHandler).toHaveBeenCalledWith({
        from: 'starting',
        to: 'running',
      });
    });

    it('should throw error when starting already running server', async () => {
      await server.start();
      await expect(server.start()).rejects.toThrow('Cannot start server in running state');
    });

    it('should throw error when stopping non-running server', async () => {
      await expect(server.stop()).rejects.toThrow('Cannot stop server in stopped state');
    });
  });

  describe('URL Generation', () => {
    it('should get server URL', () => {
      expect(server.getUrl()).toBe('http://localhost:6006');
    });

    it('should get WebSocket URL', () => {
      expect(server.getWebSocketUrl()).toBe('ws://localhost:6007');
    });

    it('should use custom WebSocket port', () => {
      const customServer = new TheaterServer({ wsPort: 9000 });
      expect(customServer.getWebSocketUrl()).toBe('ws://localhost:9000');
    });
  });

  describe('Request Tracking', () => {
    it('should record requests', () => {
      const request: RequestInfo = {
        method: 'GET',
        path: '/specimens',
        timestamp: Date.now(),
        statusCode: 200,
      };

      server.recordRequest(request);

      const requests = server.getRequests();
      expect(requests).toHaveLength(1);
      expect(requests[0]).toEqual(request);
    });

    it('should emit request event', () => {
      const requestHandler = jest.fn();
      server.on('request', requestHandler);

      const request: RequestInfo = {
        method: 'GET',
        path: '/api/test',
        timestamp: Date.now(),
      };

      server.recordRequest(request);

      expect(requestHandler).toHaveBeenCalledWith(request);
    });

    it('should limit request history to 1000', () => {
      for (let i = 0; i < 1500; i++) {
        server.recordRequest({
          method: 'GET',
          path: `/test/${i}`,
          timestamp: Date.now(),
        });
      }

      expect(server.getRequests(2000).length).toBe(1000);
    });

    it('should get limited requests', () => {
      for (let i = 0; i < 50; i++) {
        server.recordRequest({
          method: 'GET',
          path: `/test/${i}`,
          timestamp: Date.now(),
        });
      }

      expect(server.getRequests(10)).toHaveLength(10);
    });
  });

  describe('Connection Tracking', () => {
    it('should increment connections', () => {
      server.incrementConnections();
      server.incrementConnections();

      const stats = server.getStatistics();
      expect(stats.activeConnections).toBe(2);
    });

    it('should decrement connections', () => {
      server.incrementConnections();
      server.incrementConnections();
      server.decrementConnections();

      const stats = server.getStatistics();
      expect(stats.activeConnections).toBe(1);
    });

    it('should not go below zero connections', () => {
      server.decrementConnections();
      server.decrementConnections();

      const stats = server.getStatistics();
      expect(stats.activeConnections).toBe(0);
    });

    it('should emit connection events', () => {
      const openedHandler = jest.fn();
      const closedHandler = jest.fn();

      server.on('connection:opened', openedHandler);
      server.on('connection:closed', closedHandler);

      server.incrementConnections();
      server.decrementConnections();

      expect(openedHandler).toHaveBeenCalledWith({ active: 1 });
      expect(closedHandler).toHaveBeenCalledWith({ active: 0 });
    });
  });

  describe('Hot Reload', () => {
    it('should trigger reload', () => {
      const reloadHandler = jest.fn();
      server.on('reload', reloadHandler);

      server.triggerReload('Test file changed');

      expect(reloadHandler).toHaveBeenCalledWith({
        reason: 'Test file changed',
        count: 1,
      });
    });

    it('should track reload count', () => {
      server.triggerReload();
      server.triggerReload();
      server.triggerReload();

      const stats = server.getStatistics();
      expect(stats.reloadCount).toBe(3);
    });

    it('should not trigger reload when hot reload is disabled', () => {
      const noReloadServer = new TheaterServer({ hotReload: false });
      const reloadHandler = jest.fn();

      noReloadServer.on('reload', reloadHandler);
      noReloadServer.triggerReload();

      expect(reloadHandler).not.toHaveBeenCalled();
    });
  });

  describe('Statistics', () => {
    it('should get statistics', async () => {
      const request: RequestInfo = {
        method: 'GET',
        path: '/test',
        timestamp: Date.now(),
      };

      server.recordRequest(request);
      server.recordRequest(request);
      server.incrementConnections();
      server.triggerReload();

      const stats = server.getStatistics();

      expect(stats.totalRequests).toBe(2);
      expect(stats.activeConnections).toBe(1);
      expect(stats.reloadCount).toBe(1);
    });

    it('should calculate uptime when running', async () => {
      await server.start();

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      const stats = server.getStatistics();
      expect(stats.uptime).toBeGreaterThan(0);
      expect(stats.startTime).toBeGreaterThan(0);
    });

    it('should have zero uptime when stopped', () => {
      const stats = server.getStatistics();
      expect(stats.uptime).toBe(0);
    });

    it('should clear statistics', () => {
      server.recordRequest({
        method: 'GET',
        path: '/test',
        timestamp: Date.now(),
      });

      server.triggerReload();

      server.clearStatistics();

      const stats = server.getStatistics();
      expect(stats.totalRequests).toBe(0);
      expect(stats.reloadCount).toBe(0);
      expect(server.getRequests()).toHaveLength(0);
    });

    it('should preserve active connections when clearing statistics', () => {
      server.incrementConnections();
      server.incrementConnections();

      server.clearStatistics();

      const stats = server.getStatistics();
      expect(stats.activeConnections).toBe(2);
    });
  });

  describe('Configuration', () => {
    it('should get readonly config', () => {
      const config = server.getConfig();

      expect(config.port).toBe(6006);
      expect(config.host).toBe('localhost');
      expect(config.hotReload).toBe(true);
      expect(config.cors).toBe(true);
    });
  });
});

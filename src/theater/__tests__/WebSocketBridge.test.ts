/**
 * WebSocketBridge Tests
 */

import { WebSocketBridge } from '../server/WebSocketBridge';
import type { WebSocketMessage } from '../server/WebSocketBridge';

describe('WebSocketBridge - Real-time Communication', () => {
  let bridge: WebSocketBridge;

  beforeEach(() => {
    bridge = new WebSocketBridge({ verbose: false });
  });

  afterEach(async () => {
    if (bridge.isRunning()) {
      await bridge.stop();
    }
  });

  describe('Construction', () => {
    it('should create bridge with default config', () => {
      expect(bridge).toBeInstanceOf(WebSocketBridge);
      expect(bridge.isRunning()).toBe(false);
    });

    it('should create bridge with custom config', () => {
      const custom = new WebSocketBridge({
        port: 8080,
        host: '0.0.0.0',
        heartbeat: 60000,
      });

      expect(custom).toBeInstanceOf(WebSocketBridge);
    });
  });

  describe('Bridge Lifecycle', () => {
    it('should start bridge', async () => {
      await bridge.start();
      expect(bridge.isRunning()).toBe(true);
    });

    it('should stop bridge', async () => {
      await bridge.start();
      await bridge.stop();
      expect(bridge.isRunning()).toBe(false);
    });

    it('should emit started event', async () => {
      const startedHandler = jest.fn();
      bridge.on('started', startedHandler);

      await bridge.start();

      expect(startedHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          port: 6007,
          host: 'localhost',
          url: 'ws://localhost:6007',
        }),
      );
    });

    it('should emit stopped event', async () => {
      const stoppedHandler = jest.fn();
      bridge.on('stopped', stoppedHandler);

      await bridge.start();
      await bridge.stop();

      expect(stoppedHandler).toHaveBeenCalled();
    });

    it('should throw error when starting while already running', async () => {
      await bridge.start();
      await expect(bridge.start()).rejects.toThrow('WebSocket bridge is already running');
    });

    it('should disconnect all clients when stopping', async () => {
      await bridge.start();

      bridge.connectClient('client1');
      bridge.connectClient('client2');

      await bridge.stop();

      expect(bridge.getClients()).toHaveLength(0);
    });
  });

  describe('Client Connections', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should connect client', () => {
      bridge.connectClient('client1', { browser: 'chrome' });

      const client = bridge.getClient('client1');
      expect(client).toBeDefined();
      expect(client?.id).toBe('client1');
      expect(client?.metadata.browser).toBe('chrome');
    });

    it('should disconnect client', () => {
      bridge.connectClient('client1');
      bridge.disconnectClient('client1');

      expect(bridge.getClient('client1')).toBeUndefined();
    });

    it('should emit client:connected event', () => {
      const connectedHandler = jest.fn();
      bridge.on('client:connected', connectedHandler);

      bridge.connectClient('client1', { test: true });

      expect(connectedHandler).toHaveBeenCalledWith({
        clientId: 'client1',
        metadata: { test: true },
      });
    });

    it('should emit client:disconnected event', () => {
      const disconnectedHandler = jest.fn();
      bridge.on('client:disconnected', disconnectedHandler);

      bridge.connectClient('client1');
      bridge.disconnectClient('client1');

      expect(disconnectedHandler).toHaveBeenCalledWith({
        clientId: 'client1',
      });
    });

    it('should get all connected clients', () => {
      bridge.connectClient('client1');
      bridge.connectClient('client2');
      bridge.connectClient('client3');

      const clients = bridge.getClients();
      expect(clients).toHaveLength(3);
    });

    it('should track connection statistics', () => {
      bridge.connectClient('client1');
      bridge.connectClient('client2');

      const stats = bridge.getStatistics();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
    });
  });

  describe('Messaging', () => {
    beforeEach(async () => {
      await bridge.start();
      bridge.connectClient('client1');
    });

    it('should send message to client', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      const message: WebSocketMessage = {
        type: 'reload',
        payload: { reason: 'File changed' },
        timestamp: Date.now(),
      };

      bridge.sendToClient('client1', message);

      expect(sentHandler).toHaveBeenCalledWith({
        clientId: 'client1',
        message,
      });
    });

    it('should not send to non-existent client', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      bridge.sendToClient('nonexistent', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      expect(sentHandler).not.toHaveBeenCalled();
    });

    it('should update client last activity on send', () => {
      const before = bridge.getClient('client1')?.lastActivity ?? 0;

      bridge.sendToClient('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      const after = bridge.getClient('client1')?.lastActivity ?? 0;
      expect(after).toBeGreaterThanOrEqual(before);
    });
  });

  describe('Broadcasting', () => {
    beforeEach(async () => {
      await bridge.start();
      bridge.connectClient('client1');
      bridge.connectClient('client2');
      bridge.connectClient('client3');
    });

    it('should broadcast to all clients', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      const message: WebSocketMessage = {
        type: 'update',
        payload: { data: 'test' },
        timestamp: Date.now(),
      };

      bridge.broadcast(message);

      expect(sentHandler).toHaveBeenCalledTimes(3);
    });

    it('should exclude client from broadcast', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      const message: WebSocketMessage = {
        type: 'update',
        payload: {},
        timestamp: Date.now(),
      };

      bridge.broadcast(message, 'client2');

      expect(sentHandler).toHaveBeenCalledTimes(2);
      expect(sentHandler).not.toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 'client2',
        }),
      );
    });

    it('should emit broadcast event', () => {
      const broadcastHandler = jest.fn();
      bridge.on('broadcast', broadcastHandler);

      const message: WebSocketMessage = {
        type: 'reload',
        payload: null,
        timestamp: Date.now(),
      };

      bridge.broadcast(message);

      expect(broadcastHandler).toHaveBeenCalledWith({
        message,
        excludeClient: undefined,
      });
    });

    it('should track broadcast statistics', () => {
      bridge.broadcast({
        type: 'reload',
        payload: null,
        timestamp: Date.now(),
      });

      bridge.broadcast({
        type: 'update',
        payload: {},
        timestamp: Date.now(),
      });

      const stats = bridge.getStatistics();
      expect(stats.broadcastCount).toBe(2);
    });
  });

  describe('Channels', () => {
    beforeEach(async () => {
      await bridge.start();
      bridge.connectClient('client1');
      bridge.connectClient('client2');
      bridge.connectClient('client3');
    });

    it('should subscribe client to channel', () => {
      bridge.subscribeToChannel('client1', 'updates');

      const client = bridge.getClient('client1');
      expect(client?.channels.has('updates')).toBe(true);
    });

    it('should unsubscribe client from channel', () => {
      bridge.subscribeToChannel('client1', 'updates');
      bridge.unsubscribeFromChannel('client1', 'updates');

      const client = bridge.getClient('client1');
      expect(client?.channels.has('updates')).toBe(false);
    });

    it('should emit channel:subscribed event', () => {
      const subscribedHandler = jest.fn();
      bridge.on('channel:subscribed', subscribedHandler);

      bridge.subscribeToChannel('client1', 'updates');

      expect(subscribedHandler).toHaveBeenCalledWith({
        clientId: 'client1',
        channel: 'updates',
      });
    });

    it('should emit channel:unsubscribed event', () => {
      const unsubscribedHandler = jest.fn();
      bridge.on('channel:unsubscribed', unsubscribedHandler);

      bridge.subscribeToChannel('client1', 'updates');
      bridge.unsubscribeFromChannel('client1', 'updates');

      expect(unsubscribedHandler).toHaveBeenCalledWith({
        clientId: 'client1',
        channel: 'updates',
      });
    });

    it('should broadcast to channel', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      bridge.subscribeToChannel('client1', 'updates');
      bridge.subscribeToChannel('client2', 'updates');

      bridge.broadcastToChannel('updates', {
        type: 'update',
        payload: { data: 'test' },
        timestamp: Date.now(),
      });

      expect(sentHandler).toHaveBeenCalledTimes(2);
    });

    it('should get channel subscribers', () => {
      bridge.subscribeToChannel('client1', 'updates');
      bridge.subscribeToChannel('client2', 'updates');

      const subscribers = bridge.getChannelSubscribers('updates');
      expect(subscribers).toHaveLength(2);
      expect(subscribers).toContain('client1');
      expect(subscribers).toContain('client2');
    });

    it('should get all channels', () => {
      bridge.subscribeToChannel('client1', 'updates');
      bridge.subscribeToChannel('client2', 'reload');

      const channels = bridge.getChannels();
      expect(channels).toContain('updates');
      expect(channels).toContain('reload');
    });

    it('should remove channel when no subscribers', () => {
      bridge.subscribeToChannel('client1', 'updates');
      bridge.unsubscribeFromChannel('client1', 'updates');

      const channels = bridge.getChannels();
      expect(channels).not.toContain('updates');
    });

    it('should unsubscribe client from all channels on disconnect', () => {
      bridge.subscribeToChannel('client1', 'updates');
      bridge.subscribeToChannel('client1', 'reload');

      bridge.disconnectClient('client1');

      expect(bridge.getChannels()).toHaveLength(0);
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await bridge.start();
      bridge.connectClient('client1');
    });

    it('should handle incoming message', () => {
      const receivedHandler = jest.fn();
      bridge.on('message:received', receivedHandler);

      const message: WebSocketMessage = {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      };

      bridge.handleMessage('client1', message);

      expect(receivedHandler).toHaveBeenCalledWith({
        clientId: 'client1',
        message,
      });
    });

    it('should respond to ping with pong', () => {
      const sentHandler = jest.fn();
      bridge.on('message:sent', sentHandler);

      bridge.handleMessage('client1', {
        type: 'ping',
        payload: { test: true },
        timestamp: Date.now(),
      });

      expect(sentHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            type: 'pong',
          }),
        }),
      );
    });

    it('should handle subscribe message', () => {
      bridge.handleMessage('client1', {
        type: 'subscribe',
        payload: 'updates',
        timestamp: Date.now(),
      });

      const client = bridge.getClient('client1');
      expect(client?.channels.has('updates')).toBe(true);
    });

    it('should handle unsubscribe message', () => {
      bridge.subscribeToChannel('client1', 'updates');

      bridge.handleMessage('client1', {
        type: 'unsubscribe',
        payload: 'updates',
        timestamp: Date.now(),
      });

      const client = bridge.getClient('client1');
      expect(client?.channels.has('updates')).toBe(false);
    });

    it('should emit message event for custom types', () => {
      const messageHandler = jest.fn();
      bridge.on('message', messageHandler);

      bridge.handleMessage('client1', {
        type: 'broadcast',
        payload: { custom: 'data' },
        timestamp: Date.now(),
      });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should update client last activity on message', () => {
      const before = bridge.getClient('client1')?.lastActivity ?? 0;

      bridge.handleMessage('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      const after = bridge.getClient('client1')?.lastActivity ?? 0;
      expect(after).toBeGreaterThanOrEqual(before);
    });

    it('should track message statistics', () => {
      bridge.handleMessage('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      bridge.handleMessage('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      const stats = bridge.getStatistics();
      expect(stats.messagesReceived).toBe(2);
    });
  });

  describe('Statistics', () => {
    beforeEach(async () => {
      await bridge.start();
    });

    it('should get statistics', () => {
      bridge.connectClient('client1');
      bridge.connectClient('client2');

      bridge.sendToClient('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      bridge.broadcast({
        type: 'reload',
        payload: null,
        timestamp: Date.now(),
      });

      const stats = bridge.getStatistics();

      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.messagesSent).toBe(3); // 1 + 2 from broadcast
      expect(stats.broadcastCount).toBe(1);
    });

    it('should clear statistics', () => {
      bridge.connectClient('client1');

      bridge.sendToClient('client1', {
        type: 'ping',
        payload: null,
        timestamp: Date.now(),
      });

      bridge.clearStatistics();

      const stats = bridge.getStatistics();
      expect(stats.messagesSent).toBe(0);
      expect(stats.messagesReceived).toBe(0);
      expect(stats.broadcastCount).toBe(0);
    });

    it('should preserve total and active connections when clearing', () => {
      bridge.connectClient('client1');
      bridge.connectClient('client2');

      bridge.clearStatistics();

      const stats = bridge.getStatistics();
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
    });
  });
});

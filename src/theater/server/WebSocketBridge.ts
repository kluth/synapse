/**
 * WebSocketBridge - Real-time Communication
 *
 * The WebSocketBridge provides bidirectional real-time communication
 * between the Theater server and client browsers for hot reload,
 * state synchronization, and live updates.
 *
 * Medical Metaphor: Like a neural communication system that transmits
 * signals instantly between the observation theater and monitoring systems.
 */

import { EventEmitter } from 'events';

/**
 * WebSocket message type
 */
export type MessageType =
  | 'reload'
  | 'update'
  | 'ping'
  | 'pong'
  | 'subscribe'
  | 'unsubscribe'
  | 'broadcast';

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  /** Message type */
  type: MessageType;

  /** Message payload */
  payload: unknown;

  /** Message timestamp */
  timestamp: number;

  /** Message ID */
  id?: string;
}

/**
 * Client connection
 */
export interface ClientConnection {
  /** Client ID */
  id: string;

  /** Connection timestamp */
  connectedAt: number;

  /** Last activity timestamp */
  lastActivity: number;

  /** Subscribed channels */
  channels: Set<string>;

  /** Client metadata */
  metadata: Record<string, unknown>;
}

/**
 * WebSocket bridge configuration
 */
export interface WebSocketConfig {
  /** WebSocket port */
  port?: number;

  /** Host address */
  host?: string;

  /** Heartbeat interval in ms */
  heartbeat?: number;

  /** Connection timeout in ms */
  timeout?: number;

  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Bridge statistics
 */
export interface BridgeStatistics {
  /** Total connections */
  totalConnections: number;

  /** Active connections */
  activeConnections: number;

  /** Total messages sent */
  messagesSent: number;

  /** Total messages received */
  messagesReceived: number;

  /** Broadcast count */
  broadcastCount: number;

  /** Average latency in ms */
  averageLatency: number;
}

/**
 * WebSocketBridge - Real-time Communication
 *
 * @example
 * ```typescript
 * const bridge = new WebSocketBridge({
 *   port: 6007,
 *   heartbeat: 30000
 * });
 *
 * await bridge.start();
 *
 * // Send reload message to all clients
 * bridge.broadcast({
 *   type: 'reload',
 *   payload: { reason: 'File changed' },
 *   timestamp: Date.now()
 * });
 *
 * // Handle client messages
 * bridge.on('message', (clientId, message) => {
 *   console.log(`Message from ${clientId}:`, message);
 * });
 * ```
 */
export class WebSocketBridge extends EventEmitter {
  private readonly config: Required<WebSocketConfig>;
  private clients: Map<string, ClientConnection> = new Map();
  private channels: Map<string, Set<string>> = new Map();
  private statistics: BridgeStatistics;
  private running: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig = {}) {
    super();

    this.config = {
      port: config.port ?? 6007,
      host: config.host ?? 'localhost',
      heartbeat: config.heartbeat ?? 30000,
      timeout: config.timeout ?? 60000,
      verbose: config.verbose ?? false,
    };

    this.statistics = {
      totalConnections: 0,
      activeConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      broadcastCount: 0,
      averageLatency: 0,
    };
  }

  /**
   * Start the WebSocket bridge
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async start(): Promise<void> {
    if (this.running) {
      throw new Error('WebSocket bridge is already running');
    }

    this.running = true;

    // Start heartbeat
    this.startHeartbeat();

    this.emit('started', {
      port: this.config.port,
      host: this.config.host,
      url: `ws://${this.config.host}:${this.config.port}`,
    });

    if (this.config.verbose) {
      this.log(`WebSocket bridge started on ws://${this.config.host}:${this.config.port}`);
    }
  }

  /**
   * Stop the WebSocket bridge
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  public async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    // Stop heartbeat
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Disconnect all clients
    this.clients.forEach((_, clientId) => {
      this.disconnectClient(clientId);
    });

    this.emit('stopped');

    if (this.config.verbose) {
      this.log('WebSocket bridge stopped');
    }
  }

  /**
   * Connect a client
   */
  public connectClient(clientId: string, metadata: Record<string, unknown> = {}): void {
    const connection: ClientConnection = {
      id: clientId,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
      channels: new Set(),
      metadata,
    };

    this.clients.set(clientId, connection);
    this.statistics.totalConnections++;
    this.statistics.activeConnections++;

    this.emit('client:connected', { clientId, metadata });

    if (this.config.verbose) {
      this.log(`Client connected: ${clientId}`);
    }
  }

  /**
   * Disconnect a client
   */
  public disconnectClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client === undefined) {
      return;
    }

    // Unsubscribe from all channels
    client.channels.forEach((channel) => {
      this.unsubscribeFromChannel(clientId, channel);
    });

    this.clients.delete(clientId);
    this.statistics.activeConnections = Math.max(0, this.statistics.activeConnections - 1);

    this.emit('client:disconnected', { clientId });

    if (this.config.verbose) {
      this.log(`Client disconnected: ${clientId}`);
    }
  }

  /**
   * Send message to a specific client
   */
  public sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client === undefined) {
      return;
    }

    client.lastActivity = Date.now();
    this.statistics.messagesSent++;

    this.emit('message:sent', { clientId, message });

    if (this.config.verbose) {
      this.log(`Message sent to ${clientId}: ${message.type}`);
    }
  }

  /**
   * Broadcast message to all clients
   */
  public broadcast(message: WebSocketMessage, excludeClient?: string): void {
    this.clients.forEach((_, clientId) => {
      if (clientId !== excludeClient) {
        this.sendToClient(clientId, message);
      }
    });

    this.statistics.broadcastCount++;
    this.emit('broadcast', { message, excludeClient });
  }

  /**
   * Broadcast to a specific channel
   */
  public broadcastToChannel(channel: string, message: WebSocketMessage): void {
    const subscribers = this.channels.get(channel);
    if (subscribers === undefined) {
      return;
    }

    subscribers.forEach((clientId) => {
      this.sendToClient(clientId, message);
    });

    this.emit('channel:broadcast', { channel, message, subscribers: subscribers.size });
  }

  /**
   * Subscribe client to channel
   */
  public subscribeToChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client === undefined) {
      return;
    }

    // Add client to channel
    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Set());
    }
    this.channels.get(channel)?.add(clientId);

    // Add channel to client
    client.channels.add(channel);

    this.emit('channel:subscribed', { clientId, channel });

    if (this.config.verbose) {
      this.log(`Client ${clientId} subscribed to ${channel}`);
    }
  }

  /**
   * Unsubscribe client from channel
   */
  public unsubscribeFromChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (client === undefined) {
      return;
    }

    // Remove client from channel
    const subscribers = this.channels.get(channel);
    if (subscribers !== undefined) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.channels.delete(channel);
      }
    }

    // Remove channel from client
    client.channels.delete(channel);

    this.emit('channel:unsubscribed', { clientId, channel });
  }

  /**
   * Handle incoming message from client
   */
  public handleMessage(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client === undefined) {
      return;
    }

    client.lastActivity = Date.now();
    this.statistics.messagesReceived++;

    this.emit('message:received', { clientId, message });

    // Handle special message types
    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, {
          type: 'pong',
          payload: message.payload,
          timestamp: Date.now(),
        });
        break;

      case 'subscribe':
        if (typeof message.payload === 'string') {
          this.subscribeToChannel(clientId, message.payload);
        }
        break;

      case 'unsubscribe':
        if (typeof message.payload === 'string') {
          this.unsubscribeFromChannel(clientId, message.payload);
        }
        break;

      default:
        this.emit('message', { clientId, message });
    }
  }

  /**
   * Get client connection
   */
  public getClient(clientId: string): ClientConnection | undefined {
    return this.clients.get(clientId);
  }

  /**
   * Get all connected clients
   */
  public getClients(): ClientConnection[] {
    return Array.from(this.clients.values());
  }

  /**
   * Get channel subscribers
   */
  public getChannelSubscribers(channel: string): string[] {
    return Array.from(this.channels.get(channel) ?? []);
  }

  /**
   * Get all channels
   */
  public getChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Get bridge statistics
   */
  public getStatistics(): BridgeStatistics {
    return { ...this.statistics };
  }

  /**
   * Check if running
   */
  public isRunning(): boolean {
    return this.running;
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      this.clients.forEach((client, clientId) => {
        // Send ping
        this.sendToClient(clientId, {
          type: 'ping',
          payload: null,
          timestamp: now,
        });

        // Check for timeout
        if (now - client.lastActivity > this.config.timeout) {
          this.disconnectClient(clientId);
        }
      });
    }, this.config.heartbeat);
  }

  /**
   * Log message
   */
  private log(message: string): void {
    // eslint-disable-next-line no-console
    console.log(`[WebSocketBridge] ${message}`);
  }

  /**
   * Clear statistics
   */
  public clearStatistics(): void {
    this.statistics = {
      totalConnections: this.statistics.totalConnections,
      activeConnections: this.clients.size,
      messagesSent: 0,
      messagesReceived: 0,
      broadcastCount: 0,
      averageLatency: 0,
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * WebSocketAdapter - WebSocket Protocol Adapter
 *
 * Provides WebSocket communication with:
 * - Connection management
 * - Automatic reconnection
 * - Message framing
 * - Event-based API
 * - Heartbeat/ping-pong
 */

import { EventEmitter } from 'events';
import { BaseProtocolAdapter, type ProtocolAdapterConfig } from './ProtocolAdapter';
import type { Lung } from '../core/Lung';

/**
 * WebSocket adapter configuration
 */
export interface WebSocketAdapterConfig extends ProtocolAdapterConfig {
  url?: string;
  protocols?: string | string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  reconnectMaxAttempts?: number;
  heartbeatInterval?: number;
  messageFormat?: 'json' | 'text' | 'binary';
}

/**
 * WebSocket connection state
 */
export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

/**
 * WebSocket message
 */
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
}

/**
 * WebSocket adapter for real-time communication
 */
export class WebSocketAdapter extends BaseProtocolAdapter {
  private ws: WebSocket | null = null;
  private url: string;
  private protocols: string | string[] | undefined;
  private reconnectEnabled: boolean;
  private reconnectInterval: number;
  private reconnectMaxAttempts: number;
  private reconnectAttempts: number = 0;
  private heartbeatInterval: number;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private messageFormat: 'json' | 'text' | 'binary';
  private emitter: EventEmitter;

  constructor(lung: Lung, config: WebSocketAdapterConfig = {}) {
    super(lung, config);
    this.url = config.url ?? '';
    this.protocols = config.protocols;
    this.reconnectEnabled = config.reconnect ?? true;
    this.reconnectInterval = config.reconnectInterval ?? 5000;
    this.reconnectMaxAttempts = config.reconnectMaxAttempts ?? 5;
    this.heartbeatInterval = config.heartbeatInterval ?? 30000;
    this.messageFormat = config.messageFormat ?? 'json';
    this.emitter = new EventEmitter();
  }

  public getName(): string {
    return 'WebSocketAdapter';
  }

  public getProtocol(): string {
    return 'WebSocket';
  }

  /**
   * Connect to WebSocket server
   */
  public override async connect(): Promise<void> {
    if (this.ws !== null && this.ws.readyState === WebSocket.OPEN) {
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, this.protocols);

        this.ws.onopen = (): void => {
          this.connected = true;
          this.reconnectAttempts = 0;
          this.emitter.emit('connected');
          this.startHeartbeat();
          resolve();
        };

        this.ws.onerror = (event): void => {
          this.emitter.emit('error', event);
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onmessage = (event): void => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event): void => {
          this.connected = false;
          this.stopHeartbeat();
          this.emitter.emit('disconnected', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          if (this.reconnectEnabled && this.reconnectAttempts < this.reconnectMaxAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Failed to create WebSocket'));
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public override disconnect(): Promise<void> {
    this.reconnectEnabled = false;
    this.stopHeartbeat();

    if (this.ws !== null) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.connected = false;
    return Promise.resolve();
  }

  /**
   * Send a message
   */
  public send<T = unknown>(type: string, data: T): void {
    if (!this.isConnected() || this.ws === null) {
      throw new Error('WebSocket is not connected');
    }

    const message: WebSocketMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
    };

    let payload: string | ArrayBuffer;

    switch (this.messageFormat) {
      case 'json':
        payload = JSON.stringify(message);
        break;
      case 'text':
        payload = String(data);
        break;
      case 'binary':
        // For binary, assume data is already ArrayBuffer or can be converted
        payload = data as unknown as ArrayBuffer;
        break;
      default:
        payload = JSON.stringify(message);
    }

    this.ws.send(payload);
    this.emitter.emit('message:sent', message);
  }

  /**
   * Subscribe to message type
   */
  public on(
    event: 'message' | 'connected' | 'disconnected' | 'error' | 'message:sent',
    listener: (...args: any[]) => void,
  ): void {
    this.emitter.on(event, listener);
  }

  /**
   * Unsubscribe from message type
   */
  public off(
    event: 'message' | 'connected' | 'disconnected' | 'error' | 'message:sent',
    listener: (...args: any[]) => void,
  ): void {
    this.emitter.off(event, listener);
  }

  /**
   * Get WebSocket state
   */
  public getState(): WebSocketState {
    if (this.ws === null) {
      return 'CLOSED';
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'CLOSED';
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: unknown): void {
    try {
      let message: WebSocketMessage;

      if (typeof data === 'string') {
        if (this.messageFormat === 'json') {
          message = JSON.parse(data) as WebSocketMessage;
        } else {
          message = { type: 'text', data };
        }
      } else {
        message = { type: 'binary', data };
      }

      this.emitter.emit('message', message);
      this.emitter.emit(`message:${message.type}`, message.data);
    } catch {
      this.emitter.emit('error', new Error('Failed to parse message'));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    setTimeout(() => {
      this.emitter.emit('reconnecting', { attempt: this.reconnectAttempts });
      void this.connect().catch((error) => {
        this.emitter.emit('reconnect:failed', error);
      });
    }, this.reconnectInterval);
  }

  /**
   * Start heartbeat/ping
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.isConnected() && this.ws !== null) {
          // Send ping message
          this.send('ping', { timestamp: Date.now() });
        }
      }, this.heartbeatInterval);
    }
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

/**
 * ProtocolAdapter - Base interface for protocol adapters
 *
 * Protocol adapters (Bronchi) provide protocol-specific abstractions
 * on top of the Lung HTTP client, handling different communication
 * patterns like REST, GraphQL, WebSocket, etc.
 */

import type { Lung } from '../core/Lung';

/**
 * Base protocol adapter configuration
 */
export interface ProtocolAdapterConfig {
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Protocol adapter interface
 */
export interface ProtocolAdapter {
  /**
   * Get adapter name
   */
  getName(): string;

  /**
   * Get protocol name
   */
  getProtocol(): string;

  /**
   * Connect to the service
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the service
   */
  disconnect(): Promise<void>;

  /**
   * Check if adapter is connected
   */
  isConnected(): boolean;

  /**
   * Get underlying Lung client
   */
  getLung(): Lung;
}

/**
 * Base protocol adapter implementation
 */
export abstract class BaseProtocolAdapter implements ProtocolAdapter {
  protected lung: Lung;
  protected config: ProtocolAdapterConfig;
  protected connected: boolean = false;

  constructor(lung: Lung, config: ProtocolAdapterConfig = {}) {
    this.lung = lung;
    this.config = config;
  }

  abstract getName(): string;
  abstract getProtocol(): string;

  public connect(): Promise<void> {
    this.connected = true;
    return Promise.resolve();
  }

  public disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public getLung(): Lung {
    return this.lung;
  }
}

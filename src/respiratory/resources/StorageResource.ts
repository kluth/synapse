/**
 * StorageResource - Object Storage Manager
 *
 * Manages object storage (S3, Azure Blob, GCS, etc.) with:
 * - Upload/Download operations
 * - Streaming support
 * - Metadata management
 * - Pre-signed URLs
 */

import { Resource, type ResourceConfig } from './Resource';
import type { Readable } from 'stream';

/**
 * Storage object metadata
 */
export interface StorageObjectMetadata {
  contentType?: string;
  contentLength?: number;
  lastModified?: Date;
  etag?: string;
  metadata?: Record<string, string>;
}

/**
 * Storage object
 */
export interface StorageObject extends StorageObjectMetadata {
  key: string;
  body: Buffer | Readable;
}

/**
 * Storage client interface
 */
export interface StorageClient {
  upload(key: string, data: Buffer | Readable, metadata?: StorageObjectMetadata): Promise<void>;
  download(key: string): Promise<StorageObject>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string, maxKeys?: number): Promise<string[]>;
  getMetadata(key: string): Promise<StorageObjectMetadata>;
  copy(sourceKey: string, destinationKey: string): Promise<void>;
  move(sourceKey: string, destinationKey: string): Promise<void>;
  getSignedUrl(key: string, operation: 'get' | 'put', expiresIn: number): Promise<string>;
  ping(): Promise<boolean>;
  close(): Promise<void>;
}

/**
 * Storage configuration
 */
export interface StorageConfig extends ResourceConfig {
  clientFactory: () => Promise<StorageClient>;
  bucket?: string;
}

/**
 * Upload options
 */
export interface UploadOptions extends StorageObjectMetadata {
  acl?: 'private' | 'public-read';
}

/**
 * Storage resource for managing object storage
 */
export class StorageResource extends Resource {
  private client: StorageClient | null = null;
  private clientFactory: () => Promise<StorageClient>;
  private bucket?: string;

  constructor(config: StorageConfig) {
    super(config);
    this.clientFactory = config.clientFactory;
    if (config.bucket !== undefined) {
      this.bucket = config.bucket;
    }
  }

  public getType(): string {
    return 'Storage';
  }

  /**
   * Upload an object
   */
  public async upload(
    key: string,
    data: Buffer | Readable,
    options?: UploadOptions,
  ): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      await this.client.upload(this.prefixKey(key), data, options);
      this.trackRequest(Date.now() - startTime, true);
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Download an object
   */
  public async download(key: string): Promise<StorageObject> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      const result = await this.client.download(this.prefixKey(key));
      this.trackRequest(Date.now() - startTime, true);
      return {
        ...result,
        key: this.unprefixKey(result.key),
      };
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Delete an object
   */
  public async delete(key: string): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    const startTime = Date.now();
    try {
      this.stats.activeConnections++;
      await this.client.delete(this.prefixKey(key));
      this.trackRequest(Date.now() - startTime, true);
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
    }
  }

  /**
   * Check if object exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    return this.client.exists(this.prefixKey(key));
  }

  /**
   * List objects
   */
  public async list(prefix?: string, maxKeys?: number): Promise<string[]> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    const keys = await this.client.list(
      prefix !== undefined ? this.prefixKey(prefix) : undefined,
      maxKeys,
    );
    return keys.map((key) => this.unprefixKey(key));
  }

  /**
   * Get object metadata
   */
  public async getMetadata(key: string): Promise<StorageObjectMetadata> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    return this.client.getMetadata(this.prefixKey(key));
  }

  /**
   * Copy an object
   */
  public async copy(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    await this.client.copy(this.prefixKey(sourceKey), this.prefixKey(destinationKey));
  }

  /**
   * Move an object
   */
  public async move(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    await this.client.move(this.prefixKey(sourceKey), this.prefixKey(destinationKey));
  }

  /**
   * Get signed URL for temporary access
   */
  public async getSignedUrl(
    key: string,
    operation: 'get' | 'put',
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.isConnected() || this.client === null) {
      throw new Error('Storage not connected');
    }

    return this.client.getSignedUrl(this.prefixKey(key), operation, expiresIn);
  }

  /**
   * Connect to storage
   */
  protected async doConnect(): Promise<void> {
    this.client = await this.clientFactory();
  }

  /**
   * Disconnect from storage
   */
  protected async doDisconnect(): Promise<void> {
    if (this.client !== null) {
      await this.client.close();
      this.client = null;
    }
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<boolean> {
    if (this.client === null) {
      return false;
    }

    try {
      return await this.client.ping();
    } catch {
      return false;
    }
  }

  /**
   * Add bucket prefix to key if configured
   */
  private prefixKey(key: string): string {
    return this.bucket !== undefined ? `${this.bucket}/${key}` : key;
  }

  /**
   * Remove bucket prefix from key
   */
  private unprefixKey(key: string): string {
    if (this.bucket !== undefined && key.startsWith(`${this.bucket}/`)) {
      return key.substring(this.bucket.length + 1);
    }
    return key;
  }
}

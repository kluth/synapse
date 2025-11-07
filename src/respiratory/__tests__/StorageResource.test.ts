import {
  StorageResource,
  type StorageClient,
  type StorageObject,
} from '../resources/StorageResource';
import { Readable } from 'stream';

// Mock storage client
class MockStorageClient implements StorageClient {
  private store = new Map<string, { data: Buffer; metadata: Record<string, unknown> }>();
  private isOpen = true;

  async upload(
    key: string,
    data: Buffer | Readable,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');

    let buffer: Buffer;
    if (data instanceof Buffer) {
      buffer = data;
    } else {
      buffer = await this.streamToBuffer(data);
    }

    this.store.set(key, {
      data: buffer,
      metadata: metadata ?? {},
    });
  }

  async download(key: string): Promise<StorageObject> {
    if (!this.isOpen) throw new Error('Client closed');
    const entry = this.store.get(key);
    if (entry === undefined) {
      throw new Error('Object not found');
    }

    return {
      key,
      body: entry.data,
      contentLength: entry.data.length,
      contentType: (entry.metadata.contentType as string | undefined) ?? 'application/octet-stream',
      metadata: entry.metadata.metadata as Record<string, string> | undefined,
    };
  }

  async delete(key: string): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!this.isOpen) throw new Error('Client closed');
    return this.store.has(key);
  }

  async list(prefix?: string, maxKeys?: number): Promise<string[]> {
    if (!this.isOpen) throw new Error('Client closed');
    let keys = Array.from(this.store.keys());

    if (prefix !== undefined) {
      keys = keys.filter((key) => key.startsWith(prefix));
    }

    if (maxKeys !== undefined) {
      keys = keys.slice(0, maxKeys);
    }

    return keys;
  }

  async getMetadata(key: string): Promise<Record<string, unknown>> {
    if (!this.isOpen) throw new Error('Client closed');
    const entry = this.store.get(key);
    if (entry === undefined) {
      throw new Error('Object not found');
    }
    return entry.metadata;
  }

  async copy(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    const entry = this.store.get(sourceKey);
    if (entry === undefined) {
      throw new Error('Source not found');
    }
    this.store.set(destinationKey, { ...entry });
  }

  async move(sourceKey: string, destinationKey: string): Promise<void> {
    if (!this.isOpen) throw new Error('Client closed');
    await this.copy(sourceKey, destinationKey);
    await this.delete(sourceKey);
  }

  async getSignedUrl(_key: string, _operation: 'get' | 'put', _expiresIn: number): Promise<string> {
    if (!this.isOpen) throw new Error('Client closed');
    return `https://example.com/signed-url`;
  }

  async ping(): Promise<boolean> {
    return this.isOpen;
  }

  async close(): Promise<void> {
    this.isOpen = false;
    this.store.clear();
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}

describe('StorageResource', () => {
  describe('Connection Management', () => {
    it('should connect to storage', async () => {
      const storage = new StorageResource({
        name: 'TestStorage',
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      expect(storage.isConnected()).toBe(true);
      expect(storage.getState()).toBe('connected');

      await storage.disconnect();
    });

    it('should disconnect from storage', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();
      await storage.disconnect();

      expect(storage.isConnected()).toBe(false);
    });
  });

  describe('Upload Operations', () => {
    it('should upload buffer', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      const data = Buffer.from('Hello World');
      await storage.upload('file.txt', data, {
        contentType: 'text/plain',
      });

      const downloaded = await storage.download('file.txt');
      expect(downloaded.body).toEqual(data);

      await storage.disconnect();
    });

    it('should upload stream', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      const stream = Readable.from([Buffer.from('Hello '), Buffer.from('World')]);
      await storage.upload('file.txt', stream);

      const downloaded = await storage.download('file.txt');
      expect(downloaded.body.toString()).toBe('Hello World');

      await storage.disconnect();
    });
  });

  describe('Download Operations', () => {
    it('should download object', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      const data = Buffer.from('Test data');
      await storage.upload('file.txt', data);

      const downloaded = await storage.download('file.txt');

      expect(downloaded.key).toBe('file.txt');
      expect(downloaded.body).toEqual(data);

      await storage.disconnect();
    });

    it('should throw error for non-existent object', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await expect(storage.download('nonexistent.txt')).rejects.toThrow('Object not found');

      await storage.disconnect();
    });
  });

  describe('Delete Operations', () => {
    it('should delete object', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file.txt', Buffer.from('data'));
      await storage.delete('file.txt');

      const exists = await storage.exists('file.txt');
      expect(exists).toBe(false);

      await storage.disconnect();
    });
  });

  describe('Object Management', () => {
    it('should check if object exists', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file.txt', Buffer.from('data'));

      expect(await storage.exists('file.txt')).toBe(true);
      expect(await storage.exists('nonexistent.txt')).toBe(false);

      await storage.disconnect();
    });

    it('should list objects', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file1.txt', Buffer.from('data1'));
      await storage.upload('file2.txt', Buffer.from('data2'));
      await storage.upload('docs/file3.txt', Buffer.from('data3'));

      const all = await storage.list();
      expect(all).toHaveLength(3);

      const filtered = await storage.list('file');
      expect(filtered).toHaveLength(2);

      await storage.disconnect();
    });

    it('should list objects with limit', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file1.txt', Buffer.from('data1'));
      await storage.upload('file2.txt', Buffer.from('data2'));
      await storage.upload('file3.txt', Buffer.from('data3'));

      const limited = await storage.list(undefined, 2);
      expect(limited).toHaveLength(2);

      await storage.disconnect();
    });
  });

  describe('Metadata Operations', () => {
    it('should get object metadata', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file.txt', Buffer.from('data'), {
        contentType: 'text/plain',
      });

      const metadata = await storage.getMetadata('file.txt');
      expect(metadata.contentType).toBe('text/plain');

      await storage.disconnect();
    });
  });

  describe('Copy and Move Operations', () => {
    it('should copy object', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('source.txt', Buffer.from('data'));
      await storage.copy('source.txt', 'destination.txt');

      expect(await storage.exists('source.txt')).toBe(true);
      expect(await storage.exists('destination.txt')).toBe(true);

      await storage.disconnect();
    });

    it('should move object', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('source.txt', Buffer.from('data'));
      await storage.move('source.txt', 'destination.txt');

      expect(await storage.exists('source.txt')).toBe(false);
      expect(await storage.exists('destination.txt')).toBe(true);

      await storage.disconnect();
    });
  });

  describe('Signed URLs', () => {
    it('should generate signed URL', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      const url = await storage.getSignedUrl('file.txt', 'get', 3600);

      expect(url).toContain('signed-url');

      await storage.disconnect();
    });
  });

  describe('Bucket Prefix', () => {
    it('should use bucket prefix', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
        bucket: 'my-bucket',
      });

      await storage.connect();

      await storage.upload('file.txt', Buffer.from('data'));
      const exists = await storage.exists('file.txt');

      expect(exists).toBe(true);

      await storage.disconnect();
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      const health = await storage.healthCheck();

      expect(health).toBe('healthy');

      await storage.disconnect();
    });
  });

  describe('Statistics', () => {
    it('should track storage statistics', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await storage.connect();

      await storage.upload('file1.txt', Buffer.from('data1'));
      await storage.upload('file2.txt', Buffer.from('data2'));
      await storage.download('file1.txt');

      const stats = storage.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.failedRequests).toBe(0);

      await storage.disconnect();
    });
  });

  describe('Error Handling', () => {
    it('should throw error when not connected', async () => {
      const storage = new StorageResource({
        clientFactory: async () => new MockStorageClient(),
      });

      await expect(storage.upload('file.txt', Buffer.from('data'))).rejects.toThrow(
        'Storage not connected',
      );
    });
  });
});

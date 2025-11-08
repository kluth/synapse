/**
 * DatabaseResource - Database Connection Manager
 *
 * Manages database connections with:
 * - Connection pooling
 * - Query execution
 * - Transaction support
 * - Health monitoring
 */

import { Resource, type ResourceConfig } from './Resource';
import { ResourcePool, type PoolConfig } from './ResourcePool';

/**
 * Database connection interface
 */
export interface DatabaseConnection {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: number }>;
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  close(): Promise<void>;
  ping(): Promise<boolean>;
}

/**
 * Database configuration
 */
export interface DatabaseConfig extends ResourceConfig {
  poolMin?: number;
  poolMax?: number;
  connectionFactory: () => Promise<DatabaseConnection>;
  acquireTimeout?: number;
}

/**
 * Transaction interface
 */
export interface Transaction {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  execute(sql: string, params?: unknown[]): Promise<{ affectedRows: number; insertId?: number }>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

/**
 * Database resource for managing database connections
 */
export class DatabaseResource extends Resource {
  private pool: ResourcePool<DatabaseConnection> | null = null;
  private connectionFactory: () => Promise<DatabaseConnection>;
  private poolConfig: Pick<
    PoolConfig<DatabaseConnection>,
    'min' | 'max' | 'acquireTimeout' | 'idleTimeout'
  >;

  constructor(config: DatabaseConfig) {
    super(config);
    this.connectionFactory = config.connectionFactory;
    this.poolConfig = {
      min: config.poolMin ?? 2,
      max: config.poolMax ?? 10,
      acquireTimeout: config.acquireTimeout ?? 30000,
      idleTimeout: config.timeout ?? 60000,
    };
  }

  public getType(): string {
    return 'Database';
  }

  /**
   * Execute a query
   */
  public async query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
    if (!this.isConnected() || this.pool === null) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();
    const connection = await this.pool.acquire();

    try {
      this.stats.activeConnections++;
      const result = await connection.query<T>(sql, params);
      this.trackRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
      await this.pool.release(connection);
    }
  }

  /**
   * Execute a command (INSERT, UPDATE, DELETE)
   */
  public async execute(
    sql: string,
    params?: unknown[],
  ): Promise<{ affectedRows: number; insertId?: number }> {
    if (!this.isConnected() || this.pool === null) {
      throw new Error('Database not connected');
    }

    const startTime = Date.now();
    const connection = await this.pool.acquire();

    try {
      this.stats.activeConnections++;
      const result = await connection.execute(sql, params);
      this.trackRequest(Date.now() - startTime, true);
      return result;
    } catch (error) {
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    } finally {
      this.stats.activeConnections--;
      await this.pool.release(connection);
    }
  }

  /**
   * Begin a transaction
   */
  public async transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T> {
    if (!this.isConnected() || this.pool === null) {
      throw new Error('Database not connected');
    }

    const connection = await this.pool.acquire();

    try {
      this.stats.activeConnections++;
      await connection.beginTransaction();

      const tx: Transaction = {
        query: async <TResult = unknown>(sql: string, params?: unknown[]): Promise<TResult[]> =>
          connection.query<TResult>(sql, params),
        execute: async (
          sql: string,
          params?: unknown[],
        ): Promise<{ affectedRows: number; insertId?: number }> => connection.execute(sql, params),
        commit: async (): Promise<void> => connection.commit(),
        rollback: async (): Promise<void> => connection.rollback(),
      };

      const result = await callback(tx);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      this.stats.activeConnections--;
      await this.pool.release(connection);
    }
  }

  /**
   * Get a connection from the pool
   */
  public async getConnection(): Promise<DatabaseConnection> {
    if (!this.isConnected() || this.pool === null) {
      throw new Error('Database not connected');
    }

    return this.pool.acquire();
  }

  /**
   * Release a connection back to the pool
   */
  public async releaseConnection(connection: DatabaseConnection): Promise<void> {
    if (this.pool !== null) {
      await this.pool.release(connection);
    }
  }

  /**
   * Connect to database
   */
  protected async doConnect(): Promise<void> {
    this.pool = new ResourcePool<DatabaseConnection>({
      ...this.poolConfig,
      factory: this.connectionFactory,
      destroyer: async (conn): Promise<void> => conn.close(),
      validator: async (conn): Promise<boolean> => conn.ping(),
    });

    // Create minimum connections
    const promises: Array<Promise<void>> = [];
    for (let i = 0; i < (this.poolConfig.min ?? 2); i++) {
      promises.push(
        this.pool.acquire().then(async (conn) => {
          if (this.pool !== null) {
            await this.pool.release(conn);
          }
        }),
      );
    }

    await Promise.all(promises);
  }

  /**
   * Disconnect from database
   */
  protected async doDisconnect(): Promise<void> {
    if (this.pool !== null) {
      await this.pool.drain();
      this.pool = null;
    }
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<boolean> {
    if (this.pool === null) {
      return false;
    }

    try {
      const connection = await this.pool.acquire();
      const healthy = await connection.ping();
      await this.pool.release(connection);
      return healthy;
    } catch {
      return false;
    }
  }
}

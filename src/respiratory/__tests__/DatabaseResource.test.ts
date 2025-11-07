import { DatabaseResource, type DatabaseConnection } from '../resources/DatabaseResource';

// Mock database connection
class MockDatabaseConnection implements DatabaseConnection {
  private isOpen = true;
  private inTransaction = false;

  async query<T = unknown>(sql: string, _params?: unknown[]): Promise<T[]> {
    if (!this.isOpen) throw new Error('Connection closed');
    if (sql.includes('ERROR')) throw new Error('Query failed');
    return [{ id: 1, name: 'Test' }] as T[];
  }

  async execute(
    sql: string,
    _params?: unknown[],
  ): Promise<{ affectedRows: number; insertId?: number }> {
    if (!this.isOpen) throw new Error('Connection closed');
    if (sql.includes('ERROR')) throw new Error('Execute failed');
    return { affectedRows: 1, insertId: 1 };
  }

  async beginTransaction(): Promise<void> {
    if (!this.isOpen) throw new Error('Connection closed');
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.isOpen) throw new Error('Connection closed');
    if (!this.inTransaction) throw new Error('No transaction');
    this.inTransaction = false;
  }

  async rollback(): Promise<void> {
    if (!this.isOpen) throw new Error('Connection closed');
    if (!this.inTransaction) throw new Error('No transaction');
    this.inTransaction = false;
  }

  async close(): Promise<void> {
    this.isOpen = false;
  }

  async ping(): Promise<boolean> {
    return this.isOpen;
  }
}

describe('DatabaseResource', () => {
  describe('Connection Management', () => {
    it('should connect to database', async () => {
      const db = new DatabaseResource({
        name: 'TestDB',
        poolMin: 1,
        poolMax: 5,
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      expect(db.isConnected()).toBe(true);
      expect(db.getState()).toBe('connected');

      await db.disconnect();
    });

    it('should disconnect from database', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();
      await db.disconnect();

      expect(db.isConnected()).toBe(false);
      expect(db.getState()).toBe('disconnected');
    });
  });

  describe('Query Operations', () => {
    it('should execute query', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      const results = await db.query('SELECT * FROM users');

      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id');

      await db.disconnect();
    });

    it('should execute command', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      const result = await db.execute('INSERT INTO users VALUES (?, ?)', ['John', 30]);

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBe(1);

      await db.disconnect();
    });

    it('should throw error when not connected', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await expect(db.query('SELECT 1')).rejects.toThrow('Database not connected');
    });
  });

  describe('Transactions', () => {
    it('should execute transaction successfully', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      const result = await db.transaction(async (tx) => {
        await tx.execute('INSERT INTO users VALUES (?, ?)', ['John', 30]);
        const users = await tx.query('SELECT * FROM users');
        return users;
      });

      expect(result).toHaveLength(1);

      await db.disconnect();
    });

    it('should rollback transaction on error', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      await expect(
        db.transaction(async (tx) => {
          await tx.execute('INSERT INTO users VALUES (?, ?)', ['John', 30]);
          throw new Error('Transaction error');
        }),
      ).rejects.toThrow('Transaction error');

      await db.disconnect();
    });
  });

  describe('Connection Pool', () => {
    it('should manage connection pool', async () => {
      const db = new DatabaseResource({
        poolMin: 2,
        poolMax: 5,
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      // Execute multiple queries in parallel
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(db.query('SELECT 1'));
      }

      await Promise.all(promises);

      const stats = db.getStats();
      expect(stats.totalRequests).toBe(10);

      await db.disconnect();
    });
  });

  describe('Health Check', () => {
    it('should perform health check', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      const health = await db.healthCheck();

      expect(health).toBe('healthy');

      await db.disconnect();
    });
  });

  describe('Statistics', () => {
    it('should track database statistics', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      await db.query('SELECT 1');
      await db.execute('INSERT INTO users VALUES (1)');

      const stats = db.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.failedRequests).toBe(0);
      expect(stats.averageResponseTime).toBeGreaterThanOrEqual(0);

      await db.disconnect();
    });

    it('should track failed requests', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      try {
        await db.query('SELECT ERROR');
      } catch {
        // Expected
      }

      const stats = db.getStats();
      expect(stats.failedRequests).toBe(1);

      await db.disconnect();
    });
  });

  describe('Manual Connection Management', () => {
    it('should get and release connection manually', async () => {
      const db = new DatabaseResource({
        connectionFactory: async () => new MockDatabaseConnection(),
      });

      await db.connect();

      const conn = await db.getConnection();
      await conn.query('SELECT 1');
      await db.releaseConnection(conn);

      await db.disconnect();
    });
  });
});

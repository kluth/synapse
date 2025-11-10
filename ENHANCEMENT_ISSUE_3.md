# [ENHANCEMENT-3] Distributed State Synchronization

## Title
Implement Multi-Instance State Synchronization for Horizontal Scaling

## Problem Description

**The Pain Point:**

The Synapse Framework's Astrocyte (cache) is currently in-memory only, which works for single-instance deployments but creates challenges at scale:

1. **Cache Invalidation Hell**: Multiple instances have stale caches when data changes
2. **No Data Sharing**: Each instance maintains separate cache (duplication)
3. **Scaling Bottleneck**: Can't share expensive computations across instances
4. **State Persistence**: Cache is lost on restart

**Current Limitation:**

```typescript
// Today: Each instance has its own isolated cache
const cache1 = new Astrocyte({ maxSize: 1000 });
const cache2 = new Astrocyte({ maxSize: 1000 });

// Instance 1 caches user data
cache1.set('user:123', { name: 'Alice' });

// Instance 2 has no knowledge of this!
cache2.get('user:123'); // undefined
// Both instances must re-fetch and re-cache

// When user updates:
updateUser(123, { name: 'Alice Smith' });
// cache1 and cache2 are now inconsistent
// Who invalidates? What if instance 3 starts?
```

**Who Experiences This Pain:**

- **Hobby Users**: Running single instance, want to scale horizontally without major refactor
- **Professional (Backend)**: Need distributed cache for microservices, geographic distribution
- **Professional (DevOps)**: Want high availability without hot standby architecture

**Real-World Gap:**

Production systems need:
- **Distributed cache** (Redis, Memcached, DynamoDB)
- **Cache coherence** (CRDT-like, eventual consistency)
- **Change propagation** (cache invalidation across instances)
- **Failover support** (data persists when instance crashes)

---

## The Proposal

### Core Architecture

**Distributed Astrocyte System**

```typescript
// src/glial/DistributedAstrocyte.ts - NEW

import { createDistributedCache } from '@synapse-framework/core';

// === SIMPLE MODE: Central store ===

const cache = createDistributedCache({
  // Use Redis backend
  backend: 'redis',
  redisUrl: 'redis://localhost:6379',

  // Or use local SQLite for development
  backend: 'sqlite',
  dbPath: './cache.db',

  // Configuration
  maxSize: 10000,
  defaultTTL: 300000, // 5 minutes
  syncInterval: 1000, // Sync cache every 1 second

  // Instance identification
  instanceId: crypto.randomUUID(),
  nodeId: 'api-server-1',
});

// USE EXACTLY LIKE LOCAL ASTROCYTE (same API)

// Set value (automatically distributed)
await cache.set('user:123', { name: 'Alice' }, 60000);

// Get value (locally cached, but synced across instances)
const user = await cache.get('user:123');

// Pattern matching (across instances!)
const allUsers = await cache.getKeysByPattern('user:*');

// Delete (notifies all instances)
await cache.delete('user:123');

// Clear instance cache
await cache.clear();

// === ADVANCED: MULTI-LEVEL CACHING ===

const cache = createDistributedCache({
  backend: 'redis',
  redisUrl: process.env.REDIS_URL,

  // Local memory cache (hot data)
  localTTL: 60000, // Keep in memory for 1 minute
  localMaxSize: 1000, // Max 1000 items locally

  // Distributed cache (shared across instances)
  distributedTTL: 300000, // Keep in Redis for 5 minutes
  distributedMaxSize: 1000000, // Max 1M in Redis

  // Sync strategy
  syncStrategy: 'write-through' | 'write-behind' | 'on-demand',
  // write-through: Update distributed cache immediately
  // write-behind: Batch updates (faster, eventual consistency)
  // on-demand: Only sync on invalidation

  // Change notification
  onChange: (event) => {
    console.log(`Cache changed: ${event.key} (${event.operation})`);
    // 'set' | 'delete' | 'invalidate' | 'expire'
  },

  // Conflict resolution (for offline/partition scenarios)
  conflictResolver: (local, remote) => {
    // Return which value wins
    return local.timestamp > remote.timestamp ? local : remote;
  },
});

// === STRUCTURED DATA CACHING ===

// Define cache entry schema
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  updatedAt: z.date(),
});

const userCache = createDistributedCache<z.infer<typeof UserSchema>>({
  backend: 'redis',
  schema: UserSchema, // Validation and typing

  // Automatic invalidation rules
  invalidateOn: [
    // Invalidate when user service emits update event
    { event: 'user:updated', keyTemplate: 'user:${event.data.id}' },
    // Invalidate when user deleted
    { event: 'user:deleted', keyTemplate: 'user:*' },
    // Time-based
    { pattern: 'user:*', ttl: 300000 },
  ],
});

// Type-safe operations
await userCache.set('user:123', {
  id: '123',
  name: 'Alice',
  email: 'alice@example.com',
  updatedAt: new Date(),
});

const user = await userCache.get('user:123');
// user: typeof UserSchema ✓

// === CACHE INVALIDATION ===

// Manual invalidation
await cache.invalidate('user:123');

// Pattern-based invalidation
await cache.invalidatePattern('user:*');

// Time-based invalidation (TTL)
await cache.set('session:abc', sessionData, 3600000); // 1 hour

// Event-based invalidation
import { createInvalidationListener } from '@synapse-framework/core';

createInvalidationListener({
  cache,
  event: 'user:updated',
  keyTemplate: 'user:${id}', // Extract ID from event
});

// When 'user:updated' event fires, 'user:${id}' is automatically invalidated

// === CACHE WARMING ===

const cache = createDistributedCache({
  backend: 'redis',

  // Pre-populate cache on startup
  warmUp: async () => {
    const users = await database.getAllUsers();
    for (const user of users) {
      await cache.set(`user:${user.id}`, user);
    }
  },

  // Periodic refresh
  refreshInterval: 3600000, // 1 hour
  refreshFn: async (key) => {
    // Re-fetch and update cache
    const data = await fetchFreshData(key);
    await cache.set(key, data);
  },
});

// === STATISTICS & MONITORING ===

const stats = await cache.getStatistics();
console.log({
  localHitRate: stats.local.hitRate,        // % hits from local memory
  distributedHitRate: stats.distributed.hitRate, // % hits from Redis
  totalHitRate: stats.overall.hitRate,      // Combined hit rate
  localSize: stats.local.size,               // Items in local cache
  distributedSize: stats.distributed.size,  // Items in Redis
  instancesConnected: stats.cluster.instances, // # of instances syncing
  lastSync: stats.cluster.lastSyncTime,     // When last sync happened
});

// === MONITORING INTEGRATION ===

cache.on('hit', (event) => {
  metrics.record({
    name: 'cache.hit',
    key: event.key,
    source: event.source, // 'local' | 'distributed'
  });
});

cache.on('miss', (event) => {
  metrics.record({
    name: 'cache.miss',
    key: event.key,
  });
});

cache.on('eviction', (event) => {
  metrics.record({
    name: 'cache.eviction',
    key: event.key,
    reason: event.reason, // 'ttl' | 'memory' | 'explicit'
  });
});

// === BACKUP & PERSISTENCE ===

// Snapshot cache to disk
const snapshot = await cache.snapshot();
await fs.promises.writeFile('cache-backup.json', JSON.stringify(snapshot));

// Restore from snapshot
const backup = await fs.promises.readFile('cache-backup.json', 'utf-8');
await cache.restore(JSON.parse(backup));

// Automatic persistence (optional)
createDistributedCache({
  backend: 'redis',
  persistence: {
    enabled: true,
    path: '/data/cache-backups',
    interval: 3600000, // Hourly backups
  },
});
```

### Integration with Existing Systems

**Astrocyte Enhancement:**

```typescript
// src/glial/Astrocyte.ts - EXTEND

export class Astrocyte {
  private distributed?: DistributedCache;

  // New method: upgrade to distributed
  async enableDistribution(config: DistributedCacheConfig) {
    this.distributed = createDistributedCache(config);
    // Sync existing local data to distributed
    for (const [key, value] of this.cache) {
      await this.distributed.set(key, value);
    }
  }

  // All existing methods now work with distributed cache
  async get<T>(key: string): Promise<T | undefined> {
    // Check local first
    const local = this.cache.get(key);
    if (local) return local;

    // If distributed is enabled, fetch from shared store
    if (this.distributed) {
      const distributed = await this.distributed.get(key);
      if (distributed) {
        // Cache locally for next access
        this.cache.set(key, distributed);
        return distributed;
      }
    }

    return undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Update local cache
    this.cache.set(key, value);

    // If distributed enabled, sync to all instances
    if (this.distributed) {
      await this.distributed.set(key, value, ttl);
    }
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);

    if (this.distributed) {
      await this.distributed.delete(key);
    }
  }
}
```

**EventBus Integration:**

```typescript
// Automatic cache invalidation on events

const cache = createDistributedCache({
  backend: 'redis',
  eventBus: eventBus, // Hook EventBus

  // Define event-driven invalidation rules
  invalidationRules: [
    {
      event: 'user:updated',
      pattern: 'user:${event.data.userId}',
    },
    {
      event: 'user:deleted',
      pattern: 'user:*', // Invalidate all user caches
    },
    {
      event: 'product:*', // Wildcard events
      pattern: 'product:*',
    },
  ],
});

// Usage: When user:updated is emitted, cache is automatically invalidated
await eventBus.emit('user:updated', {
  data: { userId: '123', name: 'Alice' },
});
// 'user:123' is automatically invalidated across all instances!
```

**Microglia Integration:**

```typescript
// Cache metrics in health monitor

const microglia = new Microglia();
const cache = createDistributedCache({
  backend: 'redis',
  metrics: microglia, // Automatic metric recording
});

// Now Microglia tracks:
// - Cache hit rate
// - Cache eviction rate
// - Sync latency (distributed)
// - Instance connectivity

const health = microglia.getSystemHealth();
console.log({
  cacheHealthScore: health.cache.score, // 0-100
  syncLatency: health.cache.syncLatency,
  instancesHealthy: health.cluster.healthy,
});
```

---

## Component Architecture

```typescript
// src/glial/DistributedCache.ts

export interface DistributedCacheConfig {
  // Backend implementation
  backend: 'redis' | 'sqlite' | 'memory';
  redisUrl?: string; // For Redis
  dbPath?: string; // For SQLite
  maxSize: number;
  defaultTTL: number;

  // Local caching
  localTTL?: number;
  localMaxSize?: number;

  // Sync strategy
  syncStrategy?: 'write-through' | 'write-behind' | 'on-demand';
  syncInterval?: number;

  // Cluster
  instanceId?: string;
  nodeId?: string;

  // Schema validation
  schema?: z.ZodSchema;

  // Event integration
  eventBus?: EventBus;
  invalidationRules?: InvalidationRule[];

  // Monitoring
  metrics?: Microglia;
  onChange?: (event: CacheChangeEvent) => void;

  // Persistence
  persistence?: {
    enabled: boolean;
    path: string;
    interval: number;
  };
}

export class DistributedCache<T = any> {
  private localCache = new LRUMap<string, T>();
  private backendStore: BackendStore;

  async get(key: string): Promise<T | undefined> {
    // 1. Check local memory
    if (this.localCache.has(key)) {
      this.metrics?.recordHit('local');
      return this.localCache.get(key);
    }

    // 2. Check distributed store
    const value = await this.backendStore.get(key);
    if (value) {
      this.metrics?.recordHit('distributed');
      // 3. Cache locally
      this.localCache.set(key, value);
      return value;
    }

    this.metrics?.recordMiss();
    return undefined;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    // Validate against schema
    if (this.schema) {
      this.schema.parse(value);
    }

    // Update local
    this.localCache.set(key, value);

    // Update distributed
    if (this.syncStrategy === 'write-through') {
      await this.backendStore.set(key, value, ttl ?? this.config.defaultTTL);
    } else if (this.syncStrategy === 'write-behind') {
      this.queueForSync({ key, value, ttl });
    }

    // Notify listeners
    this.listeners.forEach(cb => cb({
      operation: 'set',
      key,
      instanceId: this.instanceId,
    }));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = Array.from(this.localCache.keys())
      .filter(key => minimatch(key, pattern));

    for (const key of keys) {
      await this.delete(key);
    }

    // Also invalidate in distributed store
    await this.backendStore.deletePattern(pattern);
  }

  private processSync = async () => {
    // Batch write pending changes to distributed store
    const pending = this.syncQueue.splice(0, 100);
    for (const item of pending) {
      await this.backendStore.set(item.key, item.value, item.ttl);
    }
  }

  async getStatistics() {
    return {
      local: {
        hitRate: this.localMetrics.hits / (this.localMetrics.hits + this.localMetrics.misses),
        size: this.localCache.size,
      },
      distributed: {
        hitRate: this.distributedMetrics.hitRate,
        size: await this.backendStore.size(),
      },
      overall: {
        hitRate: (this.localMetrics.hits + this.distributedMetrics.hits) /
                 (this.localMetrics.hits + this.localMetrics.misses +
                  this.distributedMetrics.hits + this.distributedMetrics.misses),
      },
      cluster: {
        instances: await this.backendStore.getInstanceCount(),
        lastSyncTime: this.lastSyncTime,
      },
    };
  }
}

// Backend implementations

export interface BackendStore {
  get(key: string): Promise<any | undefined>;
  set(key: string, value: any, ttl: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  size(): Promise<number>;
  getInstanceCount(): Promise<number>;
}

export class RedisBackend implements BackendStore {
  private client: RedisClient;

  async get(key: string): Promise<any | undefined> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : undefined;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const serialized = JSON.stringify(value);
    await this.client.setex(key, Math.ceil(ttl / 1000), serialized);
  }

  // ... other methods
}

export class SqliteBackend implements BackendStore {
  private db: Database;

  async get(key: string): Promise<any | undefined> {
    const row = this.db.prepare(
      'SELECT value FROM cache WHERE key = ?'
    ).get(key);
    return row ? JSON.parse(row.value) : undefined;
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    const expiresAt = Date.now() + ttl;
    this.db.prepare(
      'INSERT OR REPLACE INTO cache (key, value, expires_at) VALUES (?, ?, ?)'
    ).run(key, JSON.stringify(value), expiresAt);
  }

  // ... other methods
}
```

### Theater Integration

```typescript
// test-distributed-cache.ts

import { createHypothesis } from '@synapse-framework/core';
import { createDistributedCache } from '@synapse-framework/core';

const hypothesis = createHypothesis('Distributed Cache');

hypothesis.case('multi-instance cache hits', async (done) => {
  const cache1 = await createDistributedCache({
    backend: 'sqlite',
    dbPath: ':memory:',
    instanceId: 'instance-1',
  });

  const cache2 = await createDistributedCache({
    backend: 'sqlite',
    dbPath: ':memory:',
    instanceId: 'instance-2',
  });

  // Instance 1 sets value
  await cache1.set('key:1', { data: 'value' });

  // Instance 2 retrieves it (from distributed store)
  const value = await cache2.get('key:1');
  expect(value).toEqual({ data: 'value' });

  done();
});

hypothesis.case('cache invalidation propagates', async (done) => {
  const eventBus = new EventBus();

  const cache1 = await createDistributedCache({
    backend: 'sqlite',
    dbPath: ':memory:',
    eventBus,
    invalidationRules: [
      { event: 'item:updated', pattern: 'item:${id}' },
    ],
  });

  const cache2 = await createDistributedCache({
    backend: 'sqlite',
    dbPath: ':memory:',
    eventBus,
    invalidationRules: [
      { event: 'item:updated', pattern: 'item:${id}' },
    ],
  });

  // Both instances cache the item
  await cache1.set('item:1', { name: 'Item 1' });
  await cache2.set('item:1', { name: 'Item 1' });

  // Emit update event
  await eventBus.emit('item:updated', { data: { id: '1' } });

  // Both caches should have invalidated
  const value1 = await cache1.get('item:1');
  const value2 = await cache2.get('item:1');

  expect(value1).toBeUndefined();
  expect(value2).toBeUndefined();

  done();
});

hypothesis.case('sync strategy: write-through', async (done) => {
  const cache = await createDistributedCache({
    backend: 'sqlite',
    dbPath: ':memory:',
    syncStrategy: 'write-through',
  });

  const setTime = performance.now();
  await cache.set('key:1', { data: 'value' });
  const elapsed = performance.now() - setTime;

  // write-through includes distributed write, so overhead
  expect(elapsed).toBeGreaterThan(1); // At least 1ms
  expect(elapsed).toBeLessThan(50); // But not too much

  done();
});
```

---

## Persona Value

### Casual User
**Value**: "Scaling from 1 instance to 10 is just configuration, not code changes"

```typescript
// Development: Single instance, in-memory
const cache = createDistributedCache({ backend: 'memory' });

// Production: Multiple instances, Redis
const cache = createDistributedCache({
  backend: 'redis',
  redisUrl: process.env.REDIS_URL,
});

// Same code works everywhere!
```

### Hobbyist User
**Value**: "Understand cache behavior with detailed statistics and monitoring"

- See hit rate by source (local vs distributed)
- Monitor sync latency across instances
- Track cache evictions and hotspots
- **Dashboard**: Real-time cache performance

### Professional (Backend)
**Value**: "Enterprise-grade distributed caching with automatic cache invalidation"

- Multi-level caching (local + Redis)
- Automatic invalidation via event integration
- CRDT-like conflict resolution
- **Scaling**: Share expensive computations across instances

### Professional (DevOps)
**Value**: "High availability without losing cached data on instance restart"

- Persistent backends (SQLite, Redis)
- Automatic backup/restore
- Instance health tracking
- **HA**: Cache survives service restarts

---

## Acceptance Criteria

### GIVEN I have multiple instances with distributed cache enabled
**WHEN** instance A caches "user:123"
**THEN** instance B can immediately retrieve it (without re-fetching)
**AND** both instances have consistent data

### GIVEN I have an event-driven cache invalidation rule
**WHEN** "user:updated" event is emitted
**THEN** all "user:*" cache entries in all instances are invalidated
**AND** next access re-fetches fresh data

### GIVEN I use write-through sync strategy
**WHEN** I call cache.set()
**THEN** it waits for distributed write to complete
**AND** I have guarantee data is persisted

### GIVEN I use write-behind sync strategy
**WHEN** I call cache.set() multiple times
**THEN** updates are batched
**AND** throughput is higher than write-through

### GIVEN I query cache statistics
**WHEN** I call cache.getStatistics()
**THEN** I see hit rate, instance count, and sync latency
**AND** can detect performance issues

### GIVEN I use schema validation
**WHEN** I set invalid data
**THEN** error is thrown before writing to cache
**AND** data integrity is guaranteed

### GIVEN an instance crashes
**WHEN** it restarts
**THEN** cache is restored from Redis/persistent store
**AND** application recovers without data loss

### GIVEN I want to backup cache state
**WHEN** I call cache.snapshot()
**THEN** I get serializable snapshot of all cache entries
**AND** can restore later with cache.restore()

### GIVEN Microglia monitoring is enabled
**WHEN** cache operations occur
**THEN** Microglia records hit/miss/eviction metrics
**AND** health monitor shows cache statistics

---

## Implementation Guidance

### New Files to Create
```
src/glial/
  DistributedCache.ts        - Core implementation (300 lines)
  backends/
    RedisBackend.ts          - Redis persistence (150 lines)
    SqliteBackend.ts         - SQLite persistence (150 lines)
    MemoryBackend.ts         - In-memory fallback (80 lines)
  __tests__/
    DistributedCache.test.ts - Comprehensive tests (250+ lines)
    Backends.test.ts         - Backend-specific tests (150+ lines)
    Integration.test.ts      - Multi-instance tests (150+ lines)
```

### Dependencies
- Optional: `redis` (for Redis backend)
- Optional: `better-sqlite3` (for SQLite backend)
- Already has: `zod` (for schema validation)

### Test Strategy
- Unit tests: Single cache operations (60+ tests)
- Integration tests: Multi-instance scenarios (40+ tests)
- Persistence tests: Backup/restore flows (20+ tests)
- Performance tests: Hit rate, sync latency (15+ tests)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Cache hit rate | 90%+ for well-tuned workloads |
| Local hit latency | < 1ms |
| Distributed hit latency | < 10ms |
| Sync overhead | < 5% |
| Memory per cache entry | < 200 bytes |
| Test coverage | 95%+ |
| Documentation | 100% with examples |

---

## Dependencies
- `redis` (optional, for Redis backend)
- `better-sqlite3` (optional, for SQLite backend)
- No breaking changes to existing Astrocyte API

---

## Risk Assessment
- **Low Risk**: Opt-in feature, doesn't affect existing single-instance users
- **Compatibility**: Extends Astrocyte, maintains API compatibility
- **Complexity**: Backend abstraction handles implementation details

---

## Rollout Strategy
1. **Phase 1**: Core DistributedCache with memory backend
2. **Phase 2**: SQLite backend (for development/small deployments)
3. **Phase 3**: Redis backend (for production)
4. **Phase 4**: Event-driven invalidation and Microglia integration
5. **Phase 5**: Advanced features (snapshots, backup/restore)

---

## Future Enhancements
- Multi-region replication
- Cache-aside pattern helpers
- Automatic cache warming
- Consistency checkers
- Cache visualization dashboard
- Cost optimization (cache sizing recommendations)


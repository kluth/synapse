import { BloodCell } from '../core/BloodCell';
import { Bone } from '../../skeletal/core/Bone';
import { Schema } from '../../skeletal/core/Schema';
import { FieldSchema } from '../../skeletal/core/FieldSchema';

describe('BloodCell', () => {
  describe('Basic Functionality', () => {
    it('should create a blood cell with payload', () => {
      const cell = new BloodCell({ message: 'hello' });
      expect(cell.payload).toEqual({ message: 'hello' });
    });

    it('should have unique ID', () => {
      const cell1 = new BloodCell({ data: 1 });
      const cell2 = new BloodCell({ data: 2 });
      expect(cell1.id).toBeDefined();
      expect(cell2.id).toBeDefined();
      expect(cell1.id).not.toBe(cell2.id);
    });

    it('should have timestamp', () => {
      const before = Date.now();
      const cell = new BloodCell({ data: 1 });
      const after = Date.now();
      expect(cell.timestamp).toBeGreaterThanOrEqual(before);
      expect(cell.timestamp).toBeLessThanOrEqual(after);
    });

    it('should store source and destination', () => {
      const cell = new BloodCell(
        { data: 1 },
        {
          source: 'service-a',
          destination: 'service-b',
        }
      );
      expect(cell.source).toBe('service-a');
      expect(cell.destination).toBe('service-b');
    });
  });

  describe('Metadata', () => {
    it('should store correlation ID', () => {
      const cell = new BloodCell({ data: 1 }, { correlationId: 'corr-123' });
      expect(cell.correlationId).toBe('corr-123');
    });

    it('should store causation ID', () => {
      const cell = new BloodCell({ data: 1 }, { causationId: 'cause-123' });
      expect(cell.causationId).toBe('cause-123');
    });

    it('should store custom metadata', () => {
      const cell = new BloodCell(
        { data: 1 },
        {
          metadata: {
            userId: 'user-123',
            tenantId: 'tenant-456',
          },
        }
      );
      expect(cell.metadata.userId).toBe('user-123');
      expect(cell.metadata.tenantId).toBe('tenant-456');
    });

    it('should track message type', () => {
      const cell = new BloodCell({ data: 1 }, { type: 'UserCreated' });
      expect(cell.type).toBe('UserCreated');
    });

    it('should track message priority', () => {
      const cell = new BloodCell({ data: 1 }, { priority: 10 });
      expect(cell.priority).toBe(10);
    });
  });

  describe('Schema Validation', () => {
    it('should validate payload against schema', () => {
      const schema = new Bone(
        'Message',
        new Schema({
          message: new FieldSchema('string'),
          count: new FieldSchema('number'),
        })
      );

      const cell = new BloodCell({ message: 'hello', count: 5 }, { schema });
      expect(cell.payload).toEqual({ message: 'hello', count: 5 });
    });

    it('should throw on invalid payload', () => {
      const schema = new Bone(
        'Message',
        new Schema({
          message: new FieldSchema('string'),
        })
      );

      expect(() => {
        new BloodCell({ message: 123 }, { schema });
      }).toThrow();
    });
  });

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const cell = new BloodCell({ message: 'hello' }, { source: 'service-a' });
      const json = cell.toJSON();

      expect(json.id).toBe(cell.id);
      expect(json.payload).toEqual({ message: 'hello' });
      expect(json.source).toBe('service-a');
      expect(json.timestamp).toBe(cell.timestamp);
    });

    it('should deserialize from JSON', () => {
      const cell = new BloodCell({ message: 'hello' });
      const json = cell.toJSON();
      const restored = BloodCell.fromJSON(json);

      expect(restored.id).toBe(cell.id);
      expect(restored.payload).toEqual(cell.payload);
      expect(restored.timestamp).toBe(cell.timestamp);
    });
  });

  describe('Message Tracking', () => {
    it('should track message lineage', () => {
      const parent = new BloodCell({ data: 1 });
      const child = parent.createChild({ data: 2 });

      expect(child.correlationId).toBe(parent.id);
      expect(child.causationId).toBe(parent.id);
    });

    it('should preserve correlation ID in child messages', () => {
      const root = new BloodCell({ data: 1 });
      const child1 = root.createChild({ data: 2 });
      const child2 = child1.createChild({ data: 3 });

      expect(child1.correlationId).toBe(root.id);
      expect(child2.correlationId).toBe(root.id); // Same correlation ID
      expect(child2.causationId).toBe(child1.id); // But different causation
    });
  });

  describe('Message Cloning', () => {
    it('should clone blood cell', () => {
      const original = new BloodCell({ message: 'hello' }, { source: 'service-a' });
      const clone = original.clone();

      expect(clone.id).not.toBe(original.id); // New ID
      expect(clone.payload).toEqual(original.payload);
      expect(clone.source).toBe(original.source);
      expect(clone.correlationId).toBe(original.id); // Tracks original
    });

    it('should allow modifying cloned payload', () => {
      const original = new BloodCell({ message: 'hello' });
      const clone = original.clone({ message: 'goodbye' });

      expect(clone.payload).toEqual({ message: 'goodbye' });
      expect(original.payload).toEqual({ message: 'hello' });
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should support TTL', () => {
      const cell = new BloodCell({ data: 1 }, { ttl: 5000 });
      expect(cell.ttl).toBe(5000);
      expect(cell.expiresAt).toBeGreaterThan(Date.now());
    });

    it('should check if message is expired', () => {
      jest.useFakeTimers();
      const cell = new BloodCell({ data: 1 }, { ttl: 1000 });

      expect(cell.isExpired()).toBe(false);

      jest.advanceTimersByTime(1500);
      expect(cell.isExpired()).toBe(true);

      jest.useRealTimers();
    });

    it('should not expire without TTL', () => {
      jest.useFakeTimers();
      const cell = new BloodCell({ data: 1 });

      jest.advanceTimersByTime(10000);
      expect(cell.isExpired()).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('Message Status', () => {
    it('should track acknowledgment', () => {
      const cell = new BloodCell({ data: 1 });
      expect(cell.isAcknowledged()).toBe(false);

      cell.acknowledge();
      expect(cell.isAcknowledged()).toBe(true);
    });

    it('should track rejection', () => {
      const cell = new BloodCell({ data: 1 });
      expect(cell.isRejected()).toBe(false);

      cell.reject('Invalid data');
      expect(cell.isRejected()).toBe(true);
      expect(cell.rejectionReason).toBe('Invalid data');
    });

    it('should track retry count', () => {
      const cell = new BloodCell({ data: 1 });
      expect(cell.retryCount).toBe(0);

      cell.incrementRetry();
      expect(cell.retryCount).toBe(1);

      cell.incrementRetry();
      expect(cell.retryCount).toBe(2);
    });
  });
});

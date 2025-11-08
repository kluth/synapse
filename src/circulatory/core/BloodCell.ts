import type { Bone } from '../../skeletal/core/Bone';
import { randomUUID } from 'crypto';

/**
 * Blood Cell options
 */
export interface BloodCellOptions {
  source?: string | undefined;
  destination?: string | undefined;
  correlationId?: string | undefined;
  causationId?: string | undefined;
  type?: string | undefined;
  priority?: number | undefined;
  ttl?: number | undefined;
  schema?: Bone | undefined;
  metadata?: Record<string, unknown> | undefined;
}

/**
 * Blood Cell status
 */
type BloodCellStatus = 'pending' | 'acknowledged' | 'rejected';

/**
 * BloodCell - Message envelope for the Circulatory System
 *
 * Represents a message with:
 * - Typed message payload
 * - Metadata (timestamp, source, destination)
 * - Correlation IDs for tracking
 * - Causation tracking for message lineage
 * - Schema validation
 * - TTL support
 * - Acknowledgment tracking
 */
export class BloodCell<T = unknown> {
  public readonly id: string;
  public readonly payload: T;
  public readonly timestamp: number;
  public readonly source?: string | undefined;
  public readonly destination?: string | undefined;
  public readonly correlationId?: string | undefined;
  public readonly causationId?: string | undefined;
  public readonly type?: string | undefined;
  public readonly priority: number;
  public readonly ttl?: number | undefined;
  public readonly expiresAt?: number | undefined;
  public readonly metadata: Record<string, unknown>;

  private status: BloodCellStatus = 'pending';
  private _rejectionReason?: string;
  private _retryCount = 0;

  constructor(payload: T, options: BloodCellOptions = {}) {
    this.id = randomUUID();
    this.timestamp = Date.now();
    this.source = options.source;
    this.destination = options.destination;
    this.correlationId = options.correlationId;
    this.causationId = options.causationId;
    this.type = options.type;
    this.priority = options.priority ?? 0;
    this.ttl = options.ttl;
    this.metadata = options.metadata ?? {};

    if (this.ttl !== undefined) {
      this.expiresAt = this.timestamp + this.ttl;
    }

    // Validate payload if schema provided
    if (options.schema) {
      const validation = options.schema.validate(payload);
      if (!validation.valid) {
        throw new Error(`Payload validation failed: ${validation.errors.map(String).join(', ')}`);
      }
    }

    this.payload = payload;
  }

  /**
   * Check if message is expired
   */
  public isExpired(): boolean {
    if (this.expiresAt === undefined) {
      return false;
    }
    return Date.now() > this.expiresAt;
  }

  /**
   * Check if message is acknowledged
   */
  public isAcknowledged(): boolean {
    return this.status === 'acknowledged';
  }

  /**
   * Check if message is rejected
   */
  public isRejected(): boolean {
    return this.status === 'rejected';
  }

  /**
   * Get rejection reason
   */
  public get rejectionReason(): string | undefined {
    return this._rejectionReason;
  }

  /**
   * Get retry count
   */
  public get retryCount(): number {
    return this._retryCount;
  }

  /**
   * Acknowledge the message
   */
  public acknowledge(): void {
    this.status = 'acknowledged';
  }

  /**
   * Reject the message
   */
  public reject(reason: string): void {
    this.status = 'rejected';
    this._rejectionReason = reason;
  }

  /**
   * Increment retry count
   */
  public incrementRetry(): void {
    this._retryCount++;
  }

  /**
   * Create a child message (for message lineage tracking)
   */
  public createChild<U>(
    payload: U,
    options: Omit<BloodCellOptions, 'correlationId' | 'causationId'> = {},
  ): BloodCell<U> {
    return new BloodCell(payload, {
      ...options,
      correlationId: this.correlationId ?? this.id,
      causationId: this.id,
    });
  }

  /**
   * Clone the blood cell with optional new payload
   */
  public clone(newPayload?: T): BloodCell<T> {
    return new BloodCell(newPayload ?? this.payload, {
      source: this.source,
      destination: this.destination,
      correlationId: this.id, // Track original
      type: this.type,
      priority: this.priority,
      ttl: this.ttl,
      metadata: { ...this.metadata },
    });
  }

  /**
   * Serialize to JSON
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      payload: this.payload,
      timestamp: this.timestamp,
      source: this.source,
      destination: this.destination,
      correlationId: this.correlationId,
      causationId: this.causationId,
      type: this.type,
      priority: this.priority,
      ttl: this.ttl,
      expiresAt: this.expiresAt,
      metadata: this.metadata,
      status: this.status,
      rejectionReason: this._rejectionReason,
      retryCount: this._retryCount,
    };
  }

  /**
   * Deserialize from JSON
   */
  public static fromJSON<T>(json: Record<string, unknown>): BloodCell<T> {
    const cell = new BloodCell<T>(json['payload'] as T, {
      source: json['source'] as string | undefined,
      destination: json['destination'] as string | undefined,
      correlationId: json['correlationId'] as string | undefined,
      causationId: json['causationId'] as string | undefined,
      type: json['type'] as string | undefined,
      priority: json['priority'] as number | undefined,
      ttl: json['ttl'] as number | undefined,
      metadata: json['metadata'] as Record<string, unknown> | undefined,
    });

    // Restore internal state using type-safe assignments
    Object.assign(cell, {
      id: json['id'],
      timestamp: json['timestamp'],
      expiresAt: json['expiresAt'],
      status: json['status'],
      _rejectionReason: json['rejectionReason'],
      _retryCount: json['retryCount'],
    });

    return cell;
  }
}

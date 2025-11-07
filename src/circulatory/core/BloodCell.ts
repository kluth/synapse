import { Bone } from '../../skeletal/core/Bone';
import { randomUUID } from 'crypto';

/**
 * Blood Cell options
 */
export interface BloodCellOptions {
  source?: string;
  destination?: string;
  correlationId?: string;
  causationId?: string;
  type?: string;
  priority?: number;
  ttl?: number;
  schema?: Bone;
  metadata?: Record<string, any>;
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
export class BloodCell<T = any> {
  public readonly id: string;
  public readonly payload: T;
  public readonly timestamp: number;
  public readonly source?: string;
  public readonly destination?: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;
  public readonly type?: string;
  public readonly priority: number;
  public readonly ttl?: number;
  public readonly expiresAt?: number;
  public readonly metadata: Record<string, any>;

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
    this.metadata = options.metadata || {};

    if (this.ttl) {
      this.expiresAt = this.timestamp + this.ttl;
    }

    // Validate payload if schema provided
    if (options.schema) {
      const validation = options.schema.validate(payload);
      if (!validation.valid) {
        throw new Error(`Payload validation failed: ${validation.errors.join(', ')}`);
      }
    }

    this.payload = payload;
  }

  /**
   * Check if message is expired
   */
  public isExpired(): boolean {
    if (!this.expiresAt) {
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
  public createChild<U>(payload: U, options: Omit<BloodCellOptions, 'correlationId' | 'causationId'> = {}): BloodCell<U> {
    return new BloodCell(payload, {
      ...options,
      correlationId: this.correlationId || this.id,
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
  public toJSON(): any {
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
  public static fromJSON<T>(json: any): BloodCell<T> {
    const cell = new BloodCell<T>(json.payload, {
      source: json.source,
      destination: json.destination,
      correlationId: json.correlationId,
      causationId: json.causationId,
      type: json.type,
      priority: json.priority,
      ttl: json.ttl,
      metadata: json.metadata,
    });

    // Restore internal state
    (cell as any).id = json.id;
    (cell as any).timestamp = json.timestamp;
    (cell as any).expiresAt = json.expiresAt;
    (cell as any).status = json.status;
    (cell as any)._rejectionReason = json.rejectionReason;
    (cell as any)._retryCount = json.retryCount;

    return cell;
  }
}

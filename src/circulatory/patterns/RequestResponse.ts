/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/require-await, @typescript-eslint/strict-boolean-expressions, @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Heart } from '../core/Heart';
import { BloodCell } from '../core/BloodCell';
import { randomUUID } from 'crypto';

/**
 * Request options
 */
export interface RequestOptions {
  timeout?: number;
}

/**
 * Request handler
 */
type RequestHandler = (request: BloodCell) => Promise<any> | any;

/**
 * Pending request
 */
interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * RequestResponse - Request-Response messaging pattern (RPC-style)
 *
 * Features:
 * - Synchronous request-response communication
 * - Request correlation
 * - Timeout handling
 * - Error propagation
 */
export class RequestResponse {
  private heart: Heart;
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private handlers: Map<string, RequestHandler> = new Map();

  constructor(heart: Heart) {
    this.heart = heart;

    // Subscribe to response topic
    this.heart.subscribe('rr.response.*', async (cell) => {
      await this.handleResponse(cell);
    });

    // Subscribe to request topics
    this.heart.subscribe('rr.request.*', async (cell) => {
      await this.handleRequest(cell);
    });
  }

  /**
   * Send a request and wait for response
   */
  public async request(handler: string, payload: any, options: RequestOptions = {}): Promise<any> {
    const requestId = randomUUID();
    const timeout = options.timeout ?? 5000;

    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('Request timeout'));
      }, timeout);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timer,
      });
    });

    // Send request
    const request = new BloodCell(payload, {
      correlationId: requestId,
      type: 'Request',
      metadata: { handler },
    });

    await this.heart.publish(`rr.request.${handler}`, request);

    return promise;
  }

  /**
   * Register request handler
   */
  public onRequest(handler: string, callback: RequestHandler): void {
    this.handlers.set(handler, callback);
  }

  /**
   * Handle incoming request
   */
  private async handleRequest(cell: BloodCell): Promise<void> {
    const handler = cell.metadata['handler'] as string;

    if (!this.handlers.has(handler)) {
      return;
    }

    try {
      const callback = this.handlers.get(handler)!;
      const result = await callback(cell);

      // Send response
      const response = new BloodCell(result, {
        correlationId: cell.correlationId,
        causationId: cell.id,
        type: 'Response',
      });

      await this.heart.publish(`rr.response.${handler}`, response);
    } catch (error) {
      // Send error response
      const errorResponse = new BloodCell(
        {
          error: error instanceof Error ? error.message : String(error),
        },
        {
          correlationId: cell.correlationId,
          causationId: cell.id,
          type: 'ErrorResponse',
        },
      );

      await this.heart.publish(`rr.response.${handler}`, errorResponse);
    }
  }

  /**
   * Handle incoming response
   */
  private async handleResponse(cell: BloodCell): Promise<void> {
    const requestId = cell.correlationId;

    if (!requestId || !this.pendingRequests.has(requestId)) {
      return;
    }

    const pending = this.pendingRequests.get(requestId)!;
    clearTimeout(pending.timer);
    this.pendingRequests.delete(requestId);

    if (cell.type === 'ErrorResponse') {
      const error = cell.payload as { error: string };
      pending.reject(new Error(error.error));
    } else {
      pending.resolve(cell.payload);
    }
  }
}

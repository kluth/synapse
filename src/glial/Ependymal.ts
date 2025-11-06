/**
 * Ependymal - Data Flow and API Gateway
 *
 * Biological role: Ependymal cells line the ventricles and central canal of the CNS.
 * They produce cerebrospinal fluid (CSF) which carries nutrients, removes waste, and
 * provides a protective cushion for the brain and spinal cord.
 *
 * Software mapping: API Gateway and data flow management system. Handles request routing,
 * validation, transformation, rate limiting, and provides a central point for managing
 * data flow between external clients and internal neurons.
 */

interface EpenRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
  clientId?: string;
}

interface EpenResponse {
  status: number;
  headers?: Record<string, string>;
  body: unknown;
}

type RouteHandler = (request: EpenRequest) => Promise<EpenResponse>;
type Middleware = (request: EpenRequest, next: NextFunction) => Promise<EpenResponse>;
type NextFunction = (request: EpenRequest) => Promise<EpenResponse>;
type Transformer = (data: unknown) => unknown;
type Validator = (request: EpenRequest) => ValidationResult;

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface EpenConfig {
  readonly id: string;
  readonly rateLimit?: number; // Requests per window
  readonly rateLimitWindow?: number; // Window in ms
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface EpenStats {
  totalRequests: number;
  requestsByPath: Record<string, number>;
  statusCodes: Record<string, number>;
  rateLimitedRequests: number;
}

export class Ependymal {
  public readonly id: string;
  public isActive = false;

  private readonly rateLimit: number;
  private readonly rateLimitWindow: number;

  // Route management
  private routes: Map<string, RouteHandler> = new Map();

  // Middleware pipeline
  private middleware: Middleware[] = [];

  // Transformers
  private requestTransformers: Transformer[] = [];
  private responseTransformers: Transformer[] = [];

  // Validators
  private validators: Map<string, Validator> = new Map();

  // Rate limiting
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();

  // Statistics
  private totalRequests = 0;
  private requestsByPath: Map<string, number> = new Map();
  private statusCodes: Map<number, number> = new Map();
  private rateLimitedRequests = 0;

  constructor(config: EpenConfig) {
    this.id = config.id;
    this.rateLimit = config.rateLimit ?? 1000;
    this.rateLimitWindow = config.rateLimitWindow ?? 60000;
  }

  /**
   * LIFECYCLE MANAGEMENT
   */

  public async activate(): Promise<void> {
    if (this.isActive) {
      throw new Error('Ependymal is already active');
    }

    this.isActive = true;

    return Promise.resolve();
  }

  public async shutdown(): Promise<void> {
    this.isActive = false;

    this.routes.clear();
    this.middleware = [];
    this.requestTransformers = [];
    this.responseTransformers = [];
    this.validators.clear();
    this.rateLimitMap.clear();

    return Promise.resolve();
  }

  /**
   * ROUTE MANAGEMENT
   */

  public registerRoute(path: string, handler: RouteHandler): void {
    this.ensureActive();
    this.routes.set(path, handler);
  }

  public getRoutes(): string[] {
    this.ensureActive();
    return Array.from(this.routes.keys());
  }

  /**
   * MIDDLEWARE MANAGEMENT
   */

  public use(middleware: Middleware): void {
    this.ensureActive();
    this.middleware.push(middleware);
  }

  public getMiddleware(): Middleware[] {
    this.ensureActive();
    return [...this.middleware];
  }

  /**
   * REQUEST ROUTING
   */

  public async route(request: EpenRequest): Promise<EpenResponse> {
    this.ensureActive();

    this.totalRequests++;

    // Update request path statistics
    const pathCount = this.requestsByPath.get(request.path) ?? 0;
    this.requestsByPath.set(request.path, pathCount + 1);

    // Check rate limiting
    if (request.clientId !== undefined) {
      if (this.isRateLimited(request.clientId)) {
        this.rateLimitedRequests++;
        const response: EpenResponse = {
          status: 429,
          body: { error: 'Too many requests' },
        };
        this.trackStatusCode(response.status);
        return response;
      }

      this.recordRequest(request.clientId);
    }

    try {
      // Apply request transformers
      let transformedRequest = request;

      for (const transformer of this.requestTransformers) {
        transformedRequest = {
          ...transformedRequest,
          body: transformer(transformedRequest.body),
        };
      }

      // Validate request
      const validator = this.validators.get(request.path);

      if (validator !== undefined) {
        const validationResult = validator(transformedRequest);

        if (!validationResult.valid) {
          const response: EpenResponse = {
            status: 400,
            body: { error: 'Validation failed', details: validationResult.errors },
          };
          this.trackStatusCode(response.status);
          return response;
        }
      }

      // Execute middleware pipeline
      const response = await this.executeMiddleware(transformedRequest);

      // Apply response transformers
      let transformedResponse = response;

      for (const transformer of this.responseTransformers) {
        transformedResponse = {
          ...transformedResponse,
          body: transformer(transformedResponse.body),
        };
      }

      this.trackStatusCode(transformedResponse.status);

      return transformedResponse;
    } catch (error) {
      const response: EpenResponse = {
        status: 500,
        body: { error: 'Internal server error', message: (error as Error).message },
      };
      this.trackStatusCode(response.status);
      return response;
    }
  }

  /**
   * TRANSFORMERS
   */

  public addTransformer(type: 'request' | 'response', transformer: Transformer): void {
    this.ensureActive();

    if (type === 'request') {
      this.requestTransformers.push(transformer);
    } else {
      this.responseTransformers.push(transformer);
    }
  }

  /**
   * VALIDATORS
   */

  public addValidator(path: string, validator: Validator): void {
    this.ensureActive();
    this.validators.set(path, validator);
  }

  /**
   * STATISTICS
   */

  public getStats(): EpenStats {
    return {
      totalRequests: this.totalRequests,
      requestsByPath: Object.fromEntries(this.requestsByPath),
      statusCodes: Object.fromEntries(
        Array.from(this.statusCodes.entries()).map(([code, count]) => [code.toString(), count]),
      ),
      rateLimitedRequests: this.rateLimitedRequests,
    };
  }

  /**
   * INTERNAL METHODS
   */

  private ensureActive(): void {
    if (!this.isActive) {
      throw new Error('Ependymal is not active');
    }
  }

  private async executeMiddleware(request: EpenRequest): Promise<EpenResponse> {
    let index = 0;

    const next: NextFunction = async (req: EpenRequest): Promise<EpenResponse> => {
      if (index < this.middleware.length) {
        const currentMiddleware = this.middleware[index];
        index++;

        if (currentMiddleware === undefined) {
          return await this.handleRoute(req);
        }

        return await currentMiddleware(req, next);
      }

      return await this.handleRoute(req);
    };

    return await next(request);
  }

  private async handleRoute(request: EpenRequest): Promise<EpenResponse> {
    const handler = this.routes.get(request.path);

    if (handler === undefined) {
      return {
        status: 404,
        body: { error: 'Route not found' },
      };
    }

    return await handler(request);
  }

  private isRateLimited(clientId: string): boolean {
    const entry = this.rateLimitMap.get(clientId);

    if (entry === undefined) {
      return false;
    }

    const now = Date.now();

    // Check if window has expired
    if (now - entry.windowStart > this.rateLimitWindow) {
      return false;
    }

    return entry.count >= this.rateLimit;
  }

  private recordRequest(clientId: string): void {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientId);

    if (entry === undefined) {
      this.rateLimitMap.set(clientId, {
        count: 1,
        windowStart: now,
      });
      return;
    }

    // Check if window has expired
    if (now - entry.windowStart > this.rateLimitWindow) {
      this.rateLimitMap.set(clientId, {
        count: 1,
        windowStart: now,
      });
      return;
    }

    // Increment count in current window
    entry.count++;
  }

  private trackStatusCode(status: number): void {
    const count = this.statusCodes.get(status) ?? 0;
    this.statusCodes.set(status, count + 1);
  }
}

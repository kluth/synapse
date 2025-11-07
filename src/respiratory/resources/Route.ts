/**
 * Route - API Endpoint Definition
 *
 * Alveoli system for defining API routes with validation,
 * middleware, and automatic OpenAPI documentation generation.
 */

import type { Schema } from '../../skeletal/core/Schema';

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * Route parameter definition
 */
export interface RouteParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: Schema<unknown>;
  example?: unknown;
}

/**
 * Route request body definition
 */
export interface RouteRequestBody {
  description?: string;
  required?: boolean;
  schema: Schema<unknown>;
  examples?: Record<string, unknown>;
}

/**
 * Route response definition
 */
export interface RouteResponse {
  statusCode: number;
  description: string;
  schema?: Schema<unknown>;
  headers?: Record<string, RouteParameter>;
  examples?: Record<string, unknown>;
}

/**
 * Route context passed to handlers
 */
export interface RouteContext<TParams = unknown, TQuery = unknown, TBody = unknown> {
  params: TParams;
  query: TQuery;
  body: TBody;
  headers: Record<string, string>;
  method: HttpMethod;
  path: string;
  metadata: Record<string, unknown>;
}

/**
 * Route handler function
 */
export type RouteHandler<TResult = unknown> = (context: RouteContext) => Promise<TResult> | TResult;

/**
 * Middleware function
 */
export type RouteMiddleware = (
  context: RouteContext,
  next: () => Promise<unknown>,
) => Promise<unknown>;

/**
 * Route configuration
 */
export interface RouteConfig {
  method: HttpMethod;
  path: string;
  handler: RouteHandler;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: RouteParameter[];
  requestBody?: RouteRequestBody;
  responses?: RouteResponse[];
  middleware?: RouteMiddleware[];
  deprecated?: boolean;
  operationId?: string;
}

/**
 * Route definition for API endpoints
 */
export class Route {
  public readonly method: HttpMethod;
  public readonly path: string;
  public readonly handler: RouteHandler;
  public readonly summary?: string;
  public readonly description?: string;
  public readonly tags: string[];
  public readonly parameters: RouteParameter[];
  public readonly requestBody?: RouteRequestBody;
  public readonly responses: RouteResponse[];
  public readonly middleware: RouteMiddleware[];
  public readonly deprecated: boolean;
  public readonly operationId?: string;

  constructor(config: RouteConfig) {
    this.method = config.method;
    this.path = config.path;
    this.handler = config.handler;
    if (config.summary !== undefined) {
      this.summary = config.summary;
    }
    if (config.description !== undefined) {
      this.description = config.description;
    }
    this.tags = config.tags ?? [];
    this.parameters = config.parameters ?? [];
    if (config.requestBody !== undefined) {
      this.requestBody = config.requestBody;
    }
    this.responses = config.responses ?? [];
    this.middleware = config.middleware ?? [];
    this.deprecated = config.deprecated ?? false;
    if (config.operationId !== undefined) {
      this.operationId = config.operationId;
    }
  }

  /**
   * Check if route matches a path
   */
  public matches(path: string): boolean {
    const routePattern = this.pathToRegex(this.path);
    return routePattern.test(path);
  }

  /**
   * Extract parameters from path
   */
  public extractParams(path: string): Record<string, string> {
    const routePattern = this.pathToRegex(this.path);
    const paramNames = this.extractParamNames(this.path);
    const match = path.match(routePattern);

    if (match === null) {
      return {};
    }

    const params: Record<string, string> = {};
    paramNames.forEach((name, index) => {
      const value = match[index + 1];
      if (value !== undefined) {
        params[name] = value;
      }
    });

    return params;
  }

  /**
   * Convert route path to regex
   */
  private pathToRegex(path: string): RegExp {
    const pattern = path.replace(/:[^/]+/g, '([^/]+)').replace(/\//g, '\\/');
    return new RegExp(`^${pattern}$`);
  }

  /**
   * Extract parameter names from path
   */
  private extractParamNames(path: string): string[] {
    const matches = path.match(/:[^/]+/g);
    if (matches === null) {
      return [];
    }
    return matches.map((match) => match.slice(1));
  }

  /**
   * Create a GET route
   */
  public static get(path: string, handler: RouteHandler, config?: Partial<RouteConfig>): Route {
    return new Route({ method: 'GET', path, handler, ...config });
  }

  /**
   * Create a POST route
   */
  public static post(path: string, handler: RouteHandler, config?: Partial<RouteConfig>): Route {
    return new Route({ method: 'POST', path, handler, ...config });
  }

  /**
   * Create a PUT route
   */
  public static put(path: string, handler: RouteHandler, config?: Partial<RouteConfig>): Route {
    return new Route({ method: 'PUT', path, handler, ...config });
  }

  /**
   * Create a PATCH route
   */
  public static patch(path: string, handler: RouteHandler, config?: Partial<RouteConfig>): Route {
    return new Route({ method: 'PATCH', path, handler, ...config });
  }

  /**
   * Create a DELETE route
   */
  public static delete(path: string, handler: RouteHandler, config?: Partial<RouteConfig>): Route {
    return new Route({ method: 'DELETE', path, handler, ...config });
  }
}

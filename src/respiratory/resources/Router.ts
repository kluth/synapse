/**
 * Router - API Route Manager
 *
 * Manages API routes with validation, middleware execution,
 * and request handling.
 */

import { Route, type HttpMethod, type RouteContext, type RouteMiddleware } from './Route';
import type { ValidationResult } from '../../skeletal/core/ValidationResult';

/**
 * Router request
 */
export interface RouterRequest {
  method: HttpMethod;
  path: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Router response
 */
export interface RouterResponse<T = unknown> {
  statusCode: number;
  data: T;
  headers?: Record<string, string>;
}

/**
 * Router error
 */
export class RouterError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'RouterError';
  }
}

/**
 * Router configuration
 */
export interface RouterConfig {
  basePath?: string;
  globalMiddleware?: RouteMiddleware[];
  notFoundHandler?: (request: RouterRequest) => RouterResponse;
  errorHandler?: (error: Error, request: RouterRequest) => RouterResponse;
}

/**
 * Router for managing and executing API routes
 */
export class Router {
  private routes: Route[] = [];
  private basePath: string;
  private globalMiddleware: RouteMiddleware[];
  private notFoundHandler: (request: RouterRequest) => RouterResponse;
  private errorHandler: (error: Error, request: RouterRequest) => RouterResponse;

  constructor(config: RouterConfig = {}) {
    this.basePath = config.basePath ?? '';
    this.globalMiddleware = config.globalMiddleware ?? [];
    this.notFoundHandler =
      config.notFoundHandler ??
      ((request): RouterResponse => ({
        statusCode: 404,
        data: { error: 'Not Found', path: request.path },
      }));
    this.errorHandler =
      config.errorHandler ??
      ((error, request): RouterResponse => ({
        statusCode: error instanceof RouterError ? error.statusCode : 500,
        data: {
          error: error.message,
          path: request.path,
          ...(error instanceof RouterError && error.details !== undefined
            ? { details: error.details }
            : {}),
        },
      }));
  }

  /**
   * Register a route
   */
  public route(route: Route): void {
    // If basePath is set, create a new route with the full path
    if (this.basePath !== '') {
      const fullPath = this.basePath + route.path;
      const routeWithBasePath = new Route({
        method: route.method,
        path: fullPath,
        handler: route.handler,
        ...(route.summary !== undefined && { summary: route.summary }),
        ...(route.description !== undefined && { description: route.description }),
        tags: route.tags,
        parameters: route.parameters,
        ...(route.requestBody !== undefined && { requestBody: route.requestBody }),
        responses: route.responses,
        middleware: route.middleware,
        deprecated: route.deprecated,
        ...(route.operationId !== undefined && { operationId: route.operationId }),
      });
      this.routes.push(routeWithBasePath);
    } else {
      this.routes.push(route);
    }
  }

  /**
   * Register multiple routes
   */
  public addRoutes(...routesToAdd: Route[]): void {
    routesToAdd.forEach((route) => this.route(route));
  }

  /**
   * Add global middleware
   */
  public use(middleware: RouteMiddleware): void {
    this.globalMiddleware.push(middleware);
  }

  /**
   * Handle a request
   */
  public async handle(request: RouterRequest): Promise<RouterResponse> {
    try {
      // Find matching route (basePath already applied during route registration)
      const path = this.basePath !== '' ? this.basePath + request.path : request.path;
      const route = this.findRoute(request.method, path);

      if (route === null) {
        return this.notFoundHandler(request);
      }

      // Extract path parameters
      const params = route.extractParams(path);

      // Build context
      const context: RouteContext<Record<string, unknown>, Record<string, unknown>, unknown> = {
        params: { ...params, ...request.params },
        query: request.query ?? {},
        body: request.body,
        headers: request.headers ?? {},
        method: request.method,
        path: request.path,
        metadata: {},
      };

      // Validate request
      this.validateRequest(route, context);

      // Execute middleware chain
      const result = await this.executeMiddleware(
        [...this.globalMiddleware, ...route.middleware],
        context,
        () => route.handler(context),
      );

      // Return success response
      return {
        statusCode: 200,
        data: result,
      };
    } catch (error) {
      return this.errorHandler(error as Error, request);
    }
  }

  /**
   * Find route matching method and path
   */
  private findRoute(method: HttpMethod, path: string): Route | null {
    return this.routes.find((route) => route.method === method && route.matches(path)) ?? null;
  }

  /**
   * Validate request against route definition
   */
  private validateRequest(
    route: Route,
    context: RouteContext<Record<string, unknown>, Record<string, unknown>, unknown>,
  ): void {
    // Validate path parameters
    const pathParams = route.parameters.filter((p) => p.in === 'path');
    for (const param of pathParams) {
      if (param.required === true && context.params[param.name] === undefined) {
        throw new RouterError(`Missing required path parameter: ${param.name}`, 400);
      }

      if (param.schema !== undefined && context.params[param.name] !== undefined) {
        const result = param.schema.validate(context.params[param.name]);
        if (!result.valid) {
          throw new RouterError(`Invalid path parameter: ${param.name}`, 400, result.errors);
        }
      }
    }

    // Validate query parameters
    const queryParams = route.parameters.filter((p) => p.in === 'query');
    for (const param of queryParams) {
      if (param.required === true && context.query[param.name] === undefined) {
        throw new RouterError(`Missing required query parameter: ${param.name}`, 400);
      }

      if (param.schema !== undefined && context.query[param.name] !== undefined) {
        const result = param.schema.validate(context.query[param.name]);
        if (!result.valid) {
          throw new RouterError(`Invalid query parameter: ${param.name}`, 400, result.errors);
        }
      }
    }

    // Validate request body
    if (route.requestBody !== undefined) {
      if (route.requestBody.required === true && context.body === undefined) {
        throw new RouterError('Missing required request body', 400);
      }

      if (context.body !== undefined) {
        const result: ValidationResult<unknown> = route.requestBody.schema.validate(context.body);

        if (!result.valid) {
          throw new RouterError('Invalid request body', 400, result.errors);
        }
      }
    }
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddleware(
    middleware: RouteMiddleware[],
    context: RouteContext,
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    handler: () => Promise<unknown> | unknown,
  ): Promise<unknown> {
    let index = 0;

    const next = async (): Promise<unknown> => {
      if (index >= middleware.length) {
        return handler();
      }

      const currentMiddleware = middleware[index];
      if (currentMiddleware === undefined) {
        return handler();
      }
      index++;

      return currentMiddleware(context, next);
    };

    return next();
  }

  /**
   * Get all registered routes
   */
  public getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Get routes by tag
   */
  public getRoutesByTag(tag: string): Route[] {
    return this.routes.filter((route) => route.tags.includes(tag));
  }
}

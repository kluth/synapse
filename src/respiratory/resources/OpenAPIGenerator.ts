/**
 * OpenAPIGenerator - OpenAPI/Swagger Documentation Generator
 *
 * Generates OpenAPI 3.0 specification from Route definitions.
 */

import type { Route, RouteParameter, RouteResponse } from './Route';
import type { Router } from './Router';

/**
 * OpenAPI specification
 */
export interface OpenAPISpec {
  openapi: string;
  info: OpenAPIInfo;
  servers?: OpenAPIServer[];
  paths: Record<string, OpenAPIPathItem>;
  components?: OpenAPIComponents;
  tags?: OpenAPITag[];
}

/**
 * OpenAPI info
 */
export interface OpenAPIInfo {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

/**
 * OpenAPI server
 */
export interface OpenAPIServer {
  url: string;
  description?: string;
}

/**
 * OpenAPI path item
 */
export interface OpenAPIPathItem {
  get?: OpenAPIOperation;
  post?: OpenAPIOperation;
  put?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  head?: OpenAPIOperation;
  options?: OpenAPIOperation;
}

/**
 * OpenAPI operation
 */
export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses: Record<string, OpenAPIResponse>;
  deprecated?: boolean;
}

/**
 * OpenAPI parameter
 */
export interface OpenAPIParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema?: unknown;
  example?: unknown;
}

/**
 * OpenAPI request body
 */
export interface OpenAPIRequestBody {
  description?: string;
  required?: boolean;
  content: Record<string, { schema?: unknown; examples?: Record<string, unknown> }>;
}

/**
 * OpenAPI response
 */
export interface OpenAPIResponse {
  description: string;
  content?: Record<string, { schema?: unknown; examples?: Record<string, unknown> }>;
  headers?: Record<string, OpenAPIParameter>;
}

/**
 * OpenAPI components
 */
export interface OpenAPIComponents {
  schemas?: Record<string, unknown>;
  responses?: Record<string, OpenAPIResponse>;
  parameters?: Record<string, OpenAPIParameter>;
}

/**
 * OpenAPI tag
 */
export interface OpenAPITag {
  name: string;
  description?: string;
}

/**
 * OpenAPI generator configuration
 */
export interface OpenAPIGeneratorConfig {
  title: string;
  version: string;
  description?: string;
  servers?: OpenAPIServer[];
  termsOfService?: string;
  contact?: {
    name?: string;
    email?: string;
    url?: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

/**
 * Generate OpenAPI specification from routes
 */
export class OpenAPIGenerator {
  private config: OpenAPIGeneratorConfig;

  constructor(config: OpenAPIGeneratorConfig) {
    this.config = config;
  }

  /**
   * Generate OpenAPI spec from router
   */
  public generate(router: Router): OpenAPISpec {
    const routes = router.getRoutes();
    const paths: Record<string, OpenAPIPathItem> = {};
    const tags = new Set<string>();

    // Process each route
    routes.forEach((route) => {
      paths[route.path] ??= {};

      const operation = this.routeToOperation(route);
      const method = route.method.toLowerCase() as keyof OpenAPIPathItem;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      paths[route.path]![method] = operation;

      // Collect tags
      route.tags.forEach((tag) => tags.add(tag));
    });

    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        ...(this.config.description !== undefined && { description: this.config.description }),
        ...(this.config.termsOfService !== undefined && {
          termsOfService: this.config.termsOfService,
        }),
        ...(this.config.contact !== undefined && { contact: this.config.contact }),
        ...(this.config.license !== undefined && { license: this.config.license }),
      },
      ...(this.config.servers !== undefined && { servers: this.config.servers }),
      paths,
      tags: Array.from(tags).map((tag) => ({ name: tag })),
    };
  }

  /**
   * Convert route to OpenAPI operation
   */
  private routeToOperation(route: Route): OpenAPIOperation {
    const operation: OpenAPIOperation = {
      ...(route.operationId !== undefined && { operationId: route.operationId }),
      ...(route.summary !== undefined && { summary: route.summary }),
      ...(route.description !== undefined && { description: route.description }),
      ...(route.tags.length > 0 && { tags: route.tags }),
      ...(route.deprecated && { deprecated: route.deprecated }),
      responses: {},
    };

    // Add parameters
    if (route.parameters.length > 0) {
      operation.parameters = route.parameters.map((param) => this.parameterToOpenAPI(param));
    }

    // Add request body
    if (route.requestBody !== undefined) {
      operation.requestBody = {
        ...(route.requestBody.description !== undefined && {
          description: route.requestBody.description,
        }),
        ...(route.requestBody.required !== undefined && { required: route.requestBody.required }),
        content: {
          'application/json': {
            schema: this.schemaToOpenAPI(route.requestBody.schema),
            ...(route.requestBody.examples !== undefined && {
              examples: route.requestBody.examples,
            }),
          },
        },
      };
    }

    // Add responses
    if (route.responses.length > 0) {
      route.responses.forEach((response) => {
        operation.responses[response.statusCode.toString()] = this.responseToOpenAPI(response);
      });
    } else {
      // Default response
      operation.responses['200'] = {
        description: 'Successful response',
      };
    }

    return operation;
  }

  /**
   * Convert route parameter to OpenAPI parameter
   */
  private parameterToOpenAPI(param: RouteParameter): OpenAPIParameter {
    return {
      name: param.name,
      in: param.in,
      ...(param.description !== undefined && { description: param.description }),
      ...(param.required !== undefined && { required: param.required }),
      ...(param.schema !== undefined && { schema: this.schemaToOpenAPI(param.schema) }),
      ...(param.example !== undefined && { example: param.example }),
    };
  }

  /**
   * Convert route response to OpenAPI response
   */
  private responseToOpenAPI(response: RouteResponse): OpenAPIResponse {
    const openAPIResponse: OpenAPIResponse = {
      description: response.description,
    };

    if (response.schema !== undefined) {
      openAPIResponse.content = {
        'application/json': {
          schema: this.schemaToOpenAPI(response.schema),
          ...(response.examples !== undefined && { examples: response.examples }),
        },
      };
    }

    if (response.headers !== undefined) {
      openAPIResponse.headers = {};
      Object.entries(response.headers).forEach(([name, param]) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        openAPIResponse.headers![name] = this.parameterToOpenAPI(param);
      });
    }

    return openAPIResponse;
  }

  /**
   * Convert Schema to OpenAPI schema
   * Note: This is a simplified conversion - real implementation would need
   * to extract field information from the Schema
   */

  private schemaToOpenAPI(_schema: unknown): unknown {
    // For now, return a basic object schema
    // In a real implementation, this would introspect the Schema
    // and generate proper OpenAPI schema definitions
    return {
      type: 'object',
      description: 'Schema definition',
    };
  }

  /**
   * Generate OpenAPI spec as JSON string
   */
  public generateJSON(router: Router): string {
    return JSON.stringify(this.generate(router), null, 2);
  }

  /**
   * Generate OpenAPI spec as YAML string
   */
  public generateYAML(router: Router): string {
    // Simple YAML generation (in production, use a proper YAML library)
    const spec = this.generate(router);
    return this.objectToYAML(spec);
  }

  /**
   * Simple object to YAML converter
   */
  private objectToYAML(obj: unknown, indent: number = 0): string {
    const spaces = ' '.repeat(indent);
    let yaml = '';

    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        yaml += `${spaces}- ${this.objectToYAML(item, indent + 2).trim()}\n`;
      });
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        if (value === undefined) return;

        if (typeof value === 'object' && value !== null) {
          yaml += `${spaces}${key}:\n${this.objectToYAML(value, indent + 2)}`;
        } else {
          yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
        }
      });
    } else {
      return JSON.stringify(obj);
    }

    return yaml;
  }
}

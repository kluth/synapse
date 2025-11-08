/**
 * GraphQLAdapter - GraphQL Protocol Adapter
 *
 * Provides GraphQL query, mutation, and subscription support:
 * - Query execution
 * - Mutation execution
 * - Variable handling
 * - Error parsing
 * - Batched queries
 */

import { BaseProtocolAdapter, type ProtocolAdapterConfig } from './ProtocolAdapter';
import type { Lung } from '../core/Lung';

/**
 * GraphQL adapter configuration
 */
export interface GraphQLAdapterConfig extends ProtocolAdapterConfig {
  endpoint?: string;
}

/**
 * GraphQL operation type
 */
export type GraphQLOperationType = 'query' | 'mutation' | 'subscription';

/**
 * GraphQL variables
 */
export type GraphQLVariables = Record<string, unknown>;

/**
 * GraphQL error
 */
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL response
 */
export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, unknown>;
}

/**
 * GraphQL request
 */
export interface GraphQLRequest {
  query: string;
  variables?: GraphQLVariables;
  operationName?: string;
}

/**
 * GraphQL adapter for GraphQL APIs
 */
export class GraphQLAdapter extends BaseProtocolAdapter {
  private endpoint: string;

  constructor(lung: Lung, config: GraphQLAdapterConfig = {}) {
    super(lung, config);
    this.endpoint = config.endpoint ?? '/graphql';
  }

  public getName(): string {
    return 'GraphQLAdapter';
  }

  public getProtocol(): string {
    return 'GraphQL';
  }

  /**
   * Execute a GraphQL query
   */
  public async query<T = unknown>(
    query: string,
    variables?: GraphQLVariables,
    operationName?: string,
  ): Promise<GraphQLResponse<T>> {
    const request: GraphQLRequest = { query };
    if (variables !== undefined) request.variables = variables;
    if (operationName !== undefined) request.operationName = operationName;
    return this.execute<T>(request);
  }

  /**
   * Execute a GraphQL mutation
   */
  public async mutate<T = unknown>(
    mutation: string,
    variables?: GraphQLVariables,
    operationName?: string,
  ): Promise<GraphQLResponse<T>> {
    const request: GraphQLRequest = { query: mutation };
    if (variables !== undefined) request.variables = variables;
    if (operationName !== undefined) request.operationName = operationName;
    return this.execute<T>(request);
  }

  /**
   * Execute multiple GraphQL operations in a batch
   */
  public async batch<T = unknown>(
    operations: GraphQLRequest[],
  ): Promise<Array<GraphQLResponse<T>>> {
    const response = await this.lung.post<Array<GraphQLResponse<T>>>(this.endpoint, operations, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GraphQL batch request failed: ${response.statusText}`);
    }

    return response.data;
  }

  /**
   * Execute a single GraphQL operation
   */
  private async execute<T>(request: GraphQLRequest): Promise<GraphQLResponse<T>> {
    const response = await this.lung.post<GraphQLResponse<T>>(this.endpoint, request, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = response.data;

    // Check for GraphQL errors
    if (result.errors !== undefined && result.errors.length > 0) {
      const error = new Error(
        `GraphQL Error: ${result.errors.map((e) => e.message).join(', ')}`,
      ) as Error & { graphqlErrors: GraphQLError[] };
      error.graphqlErrors = result.errors;
      throw error;
    }

    return result;
  }

  /**
   * Build a GraphQL query from a template
   */
  public static buildQuery(
    operation: GraphQLOperationType,
    name: string,
    fields: string,
    args?: string,
  ): string {
    const argsStr = args !== undefined ? `(${args})` : '';
    return `${operation} { ${name}${argsStr} { ${fields} } }`;
  }

  /**
   * Build a GraphQL mutation
   */
  public static buildMutation(name: string, args: string, fields: string): string {
    return GraphQLAdapter.buildQuery('mutation', name, fields, args);
  }
}

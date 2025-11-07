/**
 * Respiratory System - External I/O & API Integration
 *
 * Phase 5 implementation for handling external communication,
 * resource management, and API integrations.
 */

// Core components
export { Diaphragm } from './core/Diaphragm';
export type {
  RetryOptions,
  CircuitBreakerOptions,
  ThrottleOptions,
  BulkheadOptions,
  DiaphragmStats,
} from './core/Diaphragm';

export { Lung } from './core/Lung';
export type {
  HttpMethod,
  RequestOptions,
  HttpResponse,
  LungConfig,
  RequestInterceptor,
  ResponseInterceptor,
} from './core/Lung';

// Protocol adapters (Bronchi)
export { BaseProtocolAdapter } from './protocols/ProtocolAdapter';
export type { ProtocolAdapter, ProtocolAdapterConfig } from './protocols/ProtocolAdapter';

export { RestAdapter } from './protocols/RestAdapter';
export type { RestAdapterConfig, QueryParams, RestResponse } from './protocols/RestAdapter';

export { GraphQLAdapter } from './protocols/GraphQLAdapter';
export type {
  GraphQLAdapterConfig,
  GraphQLOperationType,
  GraphQLVariables,
  GraphQLError,
  GraphQLResponse,
  GraphQLRequest,
} from './protocols/GraphQLAdapter';

export { WebSocketAdapter } from './protocols/WebSocketAdapter';
export type {
  WebSocketAdapterConfig,
  WebSocketState,
  WebSocketMessage,
} from './protocols/WebSocketAdapter';

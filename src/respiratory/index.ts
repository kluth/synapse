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

// API endpoints (Alveoli)
export { Route } from './resources/Route';
export type {
  RouteParameter,
  RouteRequestBody,
  RouteResponse,
  RouteContext,
  RouteHandler,
  RouteMiddleware,
  RouteConfig,
} from './resources/Route';

export { Router, RouterError } from './resources/Router';
export type { RouterRequest, RouterResponse, RouterConfig } from './resources/Router';

export { OpenAPIGenerator } from './resources/OpenAPIGenerator';
export type {
  OpenAPISpec,
  OpenAPIInfo,
  OpenAPIServer,
  OpenAPIPathItem,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPIComponents,
  OpenAPITag,
  OpenAPIGeneratorConfig,
} from './resources/OpenAPIGenerator';

// Resource management (Oxygen)
export { Resource } from './resources/Resource';
export type {
  ResourceConfig,
  ResourceHealth,
  ResourceState,
  ResourceStats,
} from './resources/Resource';

export { ResourcePool } from './resources/ResourcePool';
export type { PoolConfig, PoolStats } from './resources/ResourcePool';

export { DatabaseResource } from './resources/DatabaseResource';
export type { DatabaseConfig, DatabaseConnection, Transaction } from './resources/DatabaseResource';

export { CacheResource } from './resources/CacheResource';
export type { CacheConfig, CacheClient } from './resources/CacheResource';

export { StorageResource } from './resources/StorageResource';
export type {
  StorageConfig,
  StorageClient,
  StorageObject,
  StorageObjectMetadata,
  UploadOptions,
} from './resources/StorageResource';

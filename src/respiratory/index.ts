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

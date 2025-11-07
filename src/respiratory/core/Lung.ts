/**
 * Lung - HTTP Client with Resilience Patterns
 *
 * A resilient HTTP client that uses Diaphragm for:
 * - Automatic retries with exponential backoff
 * - Circuit breaker for failing services
 * - Request throttling
 * - Connection pooling via bulkhead
 */

import { Diaphragm } from './Diaphragm';
import type {
  RetryOptions,
  CircuitBreakerOptions,
  ThrottleOptions,
  BulkheadOptions,
  DiaphragmStats,
} from './Diaphragm';

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * HTTP request options
 */
export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

/**
 * HTTP response
 */
export interface HttpResponse<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  ok: boolean;
}

/**
 * Lung configuration
 */
export interface LungConfig {
  baseURL?: string;
  timeout?: number;
  headers?: Record<string, string>;
  retry?: RetryOptions;
  circuitBreaker?: CircuitBreakerOptions;
  throttle?: ThrottleOptions;
  bulkhead?: BulkheadOptions;
}

/**
 * Request interceptor
 */
export type RequestInterceptor = (
  url: string,
  options: RequestOptions,
) => Promise<{ url: string; options: RequestOptions }>;

/**
 * Response interceptor
 */
export type ResponseInterceptor = <T>(response: HttpResponse<T>) => Promise<HttpResponse<T>>;

/**
 * Lung - Resilient HTTP Client
 */
export class Lung {
  private config: Required<LungConfig>;
  private diaphragm: Diaphragm;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: LungConfig = {}) {
    this.config = {
      baseURL: config.baseURL ?? '',
      timeout: config.timeout ?? 30000,
      headers: config.headers ?? {},
      retry: config.retry ?? {},
      circuitBreaker: config.circuitBreaker ?? {},
      throttle: config.throttle ?? {},
      bulkhead: config.bulkhead ?? {},
    };

    // Initialize Diaphragm for resilience patterns
    this.diaphragm = new Diaphragm(
      this.config.retry,
      this.config.circuitBreaker,
      this.config.throttle,
      this.config.bulkhead,
    );
  }

  /**
   * Make a GET request
   */
  public async get<T = unknown>(
    url: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  public async post<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  public async put<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * Make a PATCH request
   */
  public async patch<T = unknown>(
    url: string,
    body?: unknown,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', body });
  }

  /**
   * Make a DELETE request
   */
  public async delete<T = unknown>(
    url: string,
    options: Omit<RequestOptions, 'method' | 'body'> = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make a generic HTTP request with full resilience
   */
  public async request<T = unknown>(
    url: string,
    options: RequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.buildURL(url);
    const requestOptions = this.mergeOptions(options);

    // Apply request interceptors
    let interceptedUrl = fullUrl;
    let interceptedOptions = requestOptions;
    for (const interceptor of this.requestInterceptors) {
      const result = await interceptor(interceptedUrl, interceptedOptions);
      interceptedUrl = result.url;
      interceptedOptions = result.options;
    }

    // Execute request with all resilience patterns
    const response = await this.diaphragm.breathe(
      () => this.executeRequest<T>(interceptedUrl, interceptedOptions),
      `${interceptedOptions.method}:${interceptedUrl}`,
    );

    // Apply response interceptors
    let interceptedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      interceptedResponse = await interceptor(interceptedResponse);
    }

    return interceptedResponse;
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Get Diaphragm statistics
   */
  public getStats(): DiaphragmStats {
    return this.diaphragm.getStats();
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.diaphragm.resetStats();
  }

  /**
   * Get circuit breaker state
   */
  public getCircuitState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.diaphragm.getCircuitState();
  }

  /**
   * Reset circuit breaker
   */
  public resetCircuit(): void {
    this.diaphragm.resetCircuit();
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(url: string, options: RequestOptions): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout ?? this.config.timeout);

    try {
      const fetchOptions: RequestInit = {
        method: options.method ?? 'GET',
        headers: options.headers,
        signal: options.signal ?? controller.signal,
      };

      // Add body for methods that support it
      if (options.body !== undefined && options.method !== 'GET' && options.method !== 'HEAD') {
        if (typeof options.body === 'string') {
          fetchOptions.body = options.body;
        } else {
          fetchOptions.body = JSON.stringify(options.body);
          fetchOptions.headers = {
            ...fetchOptions.headers,
            'Content-Type': 'application/json',
          };
        }
      }

      const response = await fetch(url, fetchOptions);

      // Parse response body
      let data: T;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json') ?? false) {
        data = (await response.json()) as T;
      } else {
        data = (await response.text()) as T;
      }

      // Convert headers to plain object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const httpResponse: HttpResponse<T> = {
        status: response.status,
        statusText: response.statusText,
        headers,
        data,
        ok: response.ok,
      };

      // Throw error for non-2xx responses
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
          response: HttpResponse<T>;
        };
        error.response = httpResponse;
        throw error;
      }

      return httpResponse;
    } catch (error) {
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('ETIMEDOUT');
        throw timeoutError;
      }

      // Handle network errors
      if (error instanceof TypeError) {
        const networkError = new Error('ECONNREFUSED');
        throw networkError;
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Build full URL
   */
  private buildURL(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    const base = this.config.baseURL.endsWith('/')
      ? this.config.baseURL.slice(0, -1)
      : this.config.baseURL;
    const path = url.startsWith('/') ? url : `/${url}`;

    return `${base}${path}`;
  }

  /**
   * Merge request options with defaults
   */
  private mergeOptions(options: RequestOptions): RequestOptions {
    return {
      method: options.method ?? 'GET',
      headers: {
        ...this.config.headers,
        ...options.headers,
      },
      body: options.body,
      timeout: options.timeout ?? this.config.timeout,
      ...(options.signal !== undefined && { signal: options.signal }),
    };
  }
}

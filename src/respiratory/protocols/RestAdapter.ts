/**
 * RestAdapter - RESTful API Protocol Adapter
 *
 * Provides a resource-oriented interface for REST APIs with:
 * - CRUD operations (create, read, update, delete)
 * - Resource-based routing
 * - Query parameter handling
 * - Response transformation
 */

import { BaseProtocolAdapter, type ProtocolAdapterConfig } from './ProtocolAdapter';
import type { Lung } from '../core/Lung';
import type { HttpResponse } from '../core/Lung';

/**
 * REST adapter configuration
 */
export interface RestAdapterConfig extends ProtocolAdapterConfig {
  resourcePrefix?: string;
  defaultHeaders?: Record<string, string>;
  querySerializer?: (params: Record<string, unknown>) => string;
}

/**
 * Query parameters
 */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/**
 * REST resource response
 */
export interface RestResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * REST adapter for RESTful APIs
 */
export class RestAdapter extends BaseProtocolAdapter {
  private resourcePrefix: string;
  private defaultHeaders: Record<string, string>;
  private querySerializer: (params: Record<string, unknown>) => string;

  constructor(lung: Lung, config: RestAdapterConfig = {}) {
    super(lung, config);
    this.resourcePrefix = config.resourcePrefix ?? '';
    this.defaultHeaders = config.defaultHeaders ?? {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    this.querySerializer = config.querySerializer ?? this.defaultQuerySerializer.bind(this);
  }

  public getName(): string {
    return 'RestAdapter';
  }

  public getProtocol(): string {
    return 'REST';
  }

  /**
   * Get a single resource
   */
  public async get<T = unknown>(
    resource: string,
    id?: string | number,
    query?: QueryParams,
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource, id, query);
    const response = await this.lung.get<T>(url, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * List resources with optional query parameters
   */
  public async list<T = unknown>(
    resource: string,
    query?: QueryParams,
  ): Promise<RestResponse<T[]>> {
    const url = this.buildResourceURL(resource, undefined, query);
    const response = await this.lung.get<T[]>(url, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * Create a new resource
   */
  public async create<T = unknown, D = unknown>(
    resource: string,
    data: D,
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource);
    const response = await this.lung.post<T>(url, data, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * Update an existing resource
   */
  public async update<T = unknown, D = unknown>(
    resource: string,
    id: string | number,
    data: D,
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource, id);
    const response = await this.lung.put<T>(url, data, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * Partially update a resource
   */
  public async patch<T = unknown, D = unknown>(
    resource: string,
    id: string | number,
    data: Partial<D>,
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource, id);
    const response = await this.lung.patch<T>(url, data, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * Delete a resource
   */
  public async delete<T = unknown>(
    resource: string,
    id: string | number,
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource, id);
    const response = await this.lung.delete<T>(url, {
      headers: this.defaultHeaders,
    });

    return this.transformResponse(response);
  }

  /**
   * Execute custom HTTP request
   */
  public async request<T = unknown>(
    method: string,
    resource: string,
    options: {
      id?: string | number;
      query?: QueryParams;
      body?: unknown;
      headers?: Record<string, string>;
    } = {},
  ): Promise<RestResponse<T>> {
    const url = this.buildResourceURL(resource, options.id, options.query);
    const response = await this.lung.request<T>(url, {
      method: method.toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      body: options.body,
    });

    return this.transformResponse(response);
  }

  /**
   * Build resource URL
   */
  private buildResourceURL(resource: string, id?: string | number, query?: QueryParams): string {
    let url = this.resourcePrefix ? `${this.resourcePrefix}/${resource}` : resource;

    if (id !== undefined) {
      url = `${url}/${id}`;
    }

    if (query !== undefined && Object.keys(query).length > 0) {
      const queryString = this.querySerializer(query);
      url = `${url}?${queryString}`;
    }

    return url;
  }

  /**
   * Transform HTTP response to REST response
   */
  private transformResponse<T>(response: HttpResponse<T>): RestResponse<T> {
    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }

  /**
   * Default query parameter serializer
   */
  private defaultQuerySerializer(params: Record<string, unknown>): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');
  }
}

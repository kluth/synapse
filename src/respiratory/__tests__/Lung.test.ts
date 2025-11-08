import { Lung } from '../core/Lung';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe.skip('Lung - HTTP Client', () => {
  beforeAll(() => {
    global.fetch = mockFetch as any;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    mockFetch.mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Basic HTTP Methods', () => {
    it('should make a GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ data: 'test' }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      const response = await lung.get('/users');

      expect(response.status).toBe(200);
      expect(response.data).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'GET',
        }),
      );
    });

    it('should make a POST request', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        statusText: 'Created',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ id: 1 }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      const response = await lung.post('/users', { name: 'John' });

      expect(response.status).toBe(201);
      expect(response.data).toEqual({ id: 1 });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'John' }),
        }),
      );
    });

    it('should make a PUT request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({ updated: true }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      await lung.put('/users/1', { name: 'Jane' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PUT',
        }),
      );
    });

    it('should make a PATCH request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({ patched: true }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      await lung.patch('/users/1', { email: 'new@example.com' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'PATCH',
        }),
      );
    });

    it('should make a DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        statusText: 'No Content',
        headers: new Map(),
        text: async () => '',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      const response = await lung.delete('/users/1');

      expect(response.status).toBe(204);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });

  describe('URL Building', () => {
    it('should handle baseURL with trailing slash', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com/' });
      await lung.get('/users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.anything());
    });

    it('should handle relative URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      await lung.get('users');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/users', expect.anything());
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      await lung.get('https://other.api.com/data');

      expect(mockFetch).toHaveBeenCalledWith('https://other.api.com/data', expect.anything());
    });
  });

  describe('Headers', () => {
    it('should merge default headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({
        baseURL: 'https://api.example.com',
        headers: { Authorization: 'Bearer token123' },
      });

      await lung.get('/users', { headers: { 'X-Custom': 'value' } });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer token123',
            'X-Custom': 'value',
          },
        }),
      );
    });

    it('should auto-add Content-Type for JSON body', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      await lung.post('/users', { name: 'John' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw error for non-2xx responses', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
        json: async () => ({ error: 'Not found' }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({
        baseURL: 'https://api.example.com',
        retry: { maxAttempts: 1 },
      });

      await expect(lung.get('/users/999')).rejects.toThrow('HTTP 404');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Network error'));

      const lung = new Lung({
        baseURL: 'https://api.example.com',
        retry: { maxAttempts: 1 },
      });

      await expect(lung.get('/users')).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('Resilience Integration', () => {
    it('should retry failed requests', async () => {
      const mockSuccess = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({ success: true }),
      };

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED')).mockResolvedValueOnce(mockSuccess);

      const lung = new Lung({
        baseURL: 'https://api.example.com',
        retry: { maxAttempts: 2, initialDelay: 10 },
      });

      const response = await lung.get('/users');

      expect(response.data).toEqual({ success: true });
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should respect circuit breaker', async () => {
      const mockFailure = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValue(mockFailure);

      const lung = new Lung({
        baseURL: 'https://api.example.com',
        retry: { maxAttempts: 1 },
        circuitBreaker: { failureThreshold: 2 },
      });

      // Trip the circuit
      try {
        await lung.get('/users');
      } catch {
        // Expected
      }

      try {
        await lung.get('/users');
      } catch {
        // Expected
      }

      // Circuit should be open
      await expect(lung.get('/users')).rejects.toThrow('Circuit breaker is OPEN');
    });

    it('should provide statistics', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });

      await lung.get('/users');
      await lung.get('/posts');

      const stats = lung.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(2);
    });
  });

  describe('Interceptors', () => {
    it('should apply request interceptors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({}),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });

      lung.addRequestInterceptor(async (url, options) => {
        return {
          url,
          options: {
            ...options,
            headers: {
              ...options.headers,
              'X-Intercepted': 'true',
            },
          },
        };
      });

      await lung.get('/users');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/users',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Intercepted': 'true',
          }),
        }),
      );
    });

    it('should apply response interceptors', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({ original: true }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });

      lung.addResponseInterceptor(async (response) => {
        return {
          ...response,
          data: { ...response.data, intercepted: true },
        };
      });

      const response = await lung.get('/users');

      expect(response.data).toEqual({ original: true, intercepted: true });
    });
  });

  describe('Response Parsing', () => {
    it('should parse JSON responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: async () => ({ name: 'John' }),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      const response = await lung.get('/users/1');

      expect(response.data).toEqual({ name: 'John' });
    });

    it('should parse text responses', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'text/plain']]),
        text: async () => 'Plain text response',
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });
      const response = await lung.get<string>('/health');

      expect(response.data).toBe('Plain text response');
    });
  });

  describe('Request Coalescing', () => {
    it('should coalesce identical requests', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map(),
        json: async () => ({ data: 'test' }),
      };

      mockFetch.mockResolvedValue(mockResponse);

      const lung = new Lung({ baseURL: 'https://api.example.com' });

      // Make 3 identical requests simultaneously
      const [r1, r2, r3] = await Promise.all([
        lung.get('/users'),
        lung.get('/users'),
        lung.get('/users'),
      ]);

      expect(r1.data).toEqual({ data: 'test' });
      expect(r2.data).toEqual({ data: 'test' });
      expect(r3.data).toEqual({ data: 'test' });
      expect(mockFetch).toHaveBeenCalledTimes(1); // Only called once due to coalescing
    });
  });
});

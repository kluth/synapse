import { RestAdapter } from '../protocols/RestAdapter';
import { Lung } from '../core/Lung';

// Mock Lung
jest.mock('../core/Lung');

describe('RestAdapter', () => {
  let lung: jest.Mocked<Lung>;
  let adapter: RestAdapter;

  beforeEach(() => {
    lung = new Lung() as jest.Mocked<Lung>;
    adapter = new RestAdapter(lung, {
      resourcePrefix: '/api/v1',
    });
  });

  describe('Initialization', () => {
    it('should create adapter with correct name', () => {
      expect(adapter.getName()).toBe('RestAdapter');
    });

    it('should have REST protocol', () => {
      expect(adapter.getProtocol()).toBe('REST');
    });

    it('should expose underlying Lung client', () => {
      expect(adapter.getLung()).toBe(lung);
    });
  });

  describe('GET Operations', () => {
    it('should get a single resource by ID', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1, name: 'Test' },
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      const result = await adapter.get('users', 1);

      expect(lung.get).toHaveBeenCalledWith('/api/v1/users/1', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      expect(result.data).toEqual({ id: 1, name: 'Test' });
      expect(result.status).toBe(200);
    });

    it('should get a resource with query parameters', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1 },
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      await adapter.get('users', 1, { include: 'posts', limit: 10 });

      expect(lung.get).toHaveBeenCalledWith('/api/v1/users/1?include=posts&limit=10', {
        headers: expect.any(Object),
      });
    });

    it('should list resources', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
        ],
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      const result = await adapter.list('users');

      expect(lung.get).toHaveBeenCalledWith('/api/v1/users', {
        headers: expect.any(Object),
      });
      expect(result.data).toHaveLength(2);
    });

    it('should list resources with query parameters', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [],
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      await adapter.list('users', { page: 2, limit: 20 });

      expect(lung.get).toHaveBeenCalledWith('/api/v1/users?page=2&limit=20', {
        headers: expect.any(Object),
      });
    });
  });

  describe('POST Operations', () => {
    it('should create a new resource', async () => {
      const mockResponse = {
        status: 201,
        statusText: 'Created',
        headers: {},
        data: { id: 1, name: 'New User' },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      const result = await adapter.create('users', { name: 'New User' });

      expect(lung.post).toHaveBeenCalledWith(
        '/api/v1/users',
        { name: 'New User' },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      expect(result.data).toEqual({ id: 1, name: 'New User' });
      expect(result.status).toBe(201);
    });
  });

  describe('PUT Operations', () => {
    it('should update an existing resource', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1, name: 'Updated User' },
        ok: true,
      };

      lung.put.mockResolvedValueOnce(mockResponse);

      const result = await adapter.update('users', 1, { name: 'Updated User' });

      expect(lung.put).toHaveBeenCalledWith(
        '/api/v1/users/1',
        { name: 'Updated User' },
        {
          headers: expect.any(Object),
        },
      );
      expect(result.data.name).toBe('Updated User');
    });
  });

  describe('PATCH Operations', () => {
    it('should partially update a resource', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { id: 1, email: 'new@example.com' },
        ok: true,
      };

      lung.patch.mockResolvedValueOnce(mockResponse);

      const result = await adapter.patch('users', 1, { email: 'new@example.com' });

      expect(lung.patch).toHaveBeenCalledWith(
        '/api/v1/users/1',
        { email: 'new@example.com' },
        {
          headers: expect.any(Object),
        },
      );
      expect(result.data.email).toBe('new@example.com');
    });
  });

  describe('DELETE Operations', () => {
    it('should delete a resource', async () => {
      const mockResponse = {
        status: 204,
        statusText: 'No Content',
        headers: {},
        data: null as unknown,
        ok: true,
      };

      lung.delete.mockResolvedValueOnce(mockResponse);

      const result = await adapter.delete('users', 1);

      expect(lung.delete).toHaveBeenCalledWith('/api/v1/users/1', {
        headers: expect.any(Object),
      });
      expect(result.status).toBe(204);
    });
  });

  describe('Custom Requests', () => {
    it('should execute custom HTTP request', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { result: 'success' },
        ok: true,
      };

      lung.request.mockResolvedValueOnce(mockResponse);

      await adapter.request('GET', 'users', {
        id: 1,
        query: { include: 'posts' },
        headers: { 'X-Custom': 'header' },
      });

      expect(lung.request).toHaveBeenCalledWith('/api/v1/users/1?include=posts', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Custom': 'header',
        },
        body: undefined,
      });
    });
  });

  describe('Query Parameter Serialization', () => {
    it('should serialize query parameters correctly', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [],
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      await adapter.list('users', {
        name: 'John Doe',
        age: 30,
        active: true,
      });

      expect(lung.get).toHaveBeenCalledWith(
        '/api/v1/users?name=John%20Doe&age=30&active=true',
        expect.any(Object),
      );
    });

    it('should omit undefined query parameters', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [],
        ok: true,
      };

      lung.get.mockResolvedValueOnce(mockResponse);

      await adapter.list('users', {
        name: 'John',
        email: undefined,
      });

      expect(lung.get).toHaveBeenCalledWith('/api/v1/users?name=John', expect.any(Object));
    });
  });

  describe('Connection Management', () => {
    it('should connect successfully', async () => {
      await adapter.connect();
      expect(adapter.isConnected()).toBe(true);
    });

    it('should disconnect successfully', async () => {
      await adapter.connect();
      await adapter.disconnect();
      expect(adapter.isConnected()).toBe(false);
    });
  });
});

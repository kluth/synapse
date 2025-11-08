import { GraphQLAdapter } from '../protocols/GraphQLAdapter';
import { Lung } from '../core/Lung';

// Mock Lung
jest.mock('../core/Lung');

describe('GraphQLAdapter', () => {
  let lung: jest.Mocked<Lung>;
  let adapter: GraphQLAdapter;

  beforeEach(() => {
    lung = new Lung() as jest.Mocked<Lung>;
    adapter = new GraphQLAdapter(lung, {
      endpoint: '/graphql',
    });
  });

  describe('Initialization', () => {
    it('should create adapter with correct name', () => {
      expect(adapter.getName()).toBe('GraphQLAdapter');
    });

    it('should have GraphQL protocol', () => {
      expect(adapter.getProtocol()).toBe('GraphQL');
    });

    it('should expose underlying Lung client', () => {
      expect(adapter.getLung()).toBe(lung);
    });
  });

  describe('Query Execution', () => {
    it('should execute a simple query', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          data: { user: { id: '1', name: 'John' } },
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      const result = await adapter.query('{ user(id: "1") { id name } }');

      expect(lung.post).toHaveBeenCalledWith(
        '/graphql',
        {
          query: '{ user(id: "1") { id name } }',
          variables: undefined,
          operationName: undefined,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      expect(result.data).toEqual({ user: { id: '1', name: 'John' } });
    });

    it('should execute query with variables', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          data: { user: { id: '1', name: 'John' } },
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      const variables = { id: '1' };
      await adapter.query('query GetUser($id: ID!) { user(id: $id) { id name } }', variables);

      expect(lung.post).toHaveBeenCalledWith(
        '/graphql',
        {
          query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
          variables: { id: '1' },
          operationName: undefined,
        },
        expect.any(Object),
      );
    });

    it('should execute named query', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          data: { user: { id: '1' } },
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      await adapter.query('query GetUser { user { id } }', undefined, 'GetUser');

      expect(lung.post).toHaveBeenCalledWith(
        '/graphql',
        {
          query: 'query GetUser { user { id } }',
          variables: undefined,
          operationName: 'GetUser',
        },
        expect.any(Object),
      );
    });
  });

  describe('Mutation Execution', () => {
    it('should execute a mutation', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          data: { createUser: { id: '1', name: 'John' } },
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      const variables = { name: 'John' };
      const result = await adapter.mutate(
        'mutation CreateUser($name: String!) { createUser(name: $name) { id name } }',
        variables,
      );

      expect(lung.post).toHaveBeenCalledWith(
        '/graphql',
        {
          query: 'mutation CreateUser($name: String!) { createUser(name: $name) { id name } }',
          variables: { name: 'John' },
          operationName: undefined,
        },
        expect.any(Object),
      );
      expect(result.data).toEqual({ createUser: { id: '1', name: 'John' } });
    });
  });

  describe('Batch Operations', () => {
    it('should execute batched queries', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [
          { data: { user: { id: '1', name: 'John' } } },
          { data: { post: { id: '1', title: 'Hello' } } },
        ],
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      const operations = [
        { query: '{ user(id: "1") { id name } }' },
        { query: '{ post(id: "1") { id title } }' },
      ];

      const results = await adapter.batch(operations);

      expect(lung.post).toHaveBeenCalledWith('/graphql', operations, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      expect(results).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    it('should throw on GraphQL errors', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          errors: [
            { message: 'User not found', path: ['user'], locations: [{ line: 1, column: 3 }] },
          ],
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      await expect(adapter.query('{ user(id: "999") { id } }')).rejects.toThrow(
        'GraphQL Error: User not found',
      );
    });

    it('should throw on HTTP errors', async () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        data: null as unknown,
        ok: false,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      await expect(adapter.query('{ user { id } }')).rejects.toThrow(
        'GraphQL request failed: Internal Server Error',
      );
    });

    it('should include graphqlErrors in error object', async () => {
      const mockResponse = {
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          errors: [{ message: 'Error 1' }, { message: 'Error 2' }],
        },
        ok: true,
      };

      lung.post.mockResolvedValueOnce(mockResponse);

      try {
        await adapter.query('{ user { id } }');
        fail('Should have thrown');
      } catch (error) {
        expect(error).toHaveProperty('graphqlErrors');
        expect((error as { graphqlErrors: unknown[] }).graphqlErrors).toHaveLength(2);
      }
    });
  });

  describe('Query Builder', () => {
    it('should build a simple query', () => {
      const query = GraphQLAdapter.buildQuery('query', 'users', 'id name');

      expect(query).toBe('query { users { id name } }');
    });

    it('should build query with arguments', () => {
      const query = GraphQLAdapter.buildQuery('query', 'user', 'id name', 'id: "1"');

      expect(query).toBe('query { user(id: "1") { id name } }');
    });

    it('should build a mutation', () => {
      const mutation = GraphQLAdapter.buildMutation('createUser', 'name: "John"', 'id name');

      expect(mutation).toBe('mutation { createUser(name: "John") { id name } }');
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

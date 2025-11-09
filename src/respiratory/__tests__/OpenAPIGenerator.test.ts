import { OpenAPIGenerator } from '../resources/OpenAPIGenerator';
import { Router } from '../resources/Router';
import { Route } from '../resources/Route';
import { Schema } from '../../skeletal/core/Schema';
import { FieldSchema } from '../../skeletal/core/FieldSchema';

describe('OpenAPIGenerator', () => {
  let generator: OpenAPIGenerator;
  let router: Router;

  beforeEach(() => {
    generator = new OpenAPIGenerator({
      title: 'Test API',
      version: '1.0.0',
      description: 'A test API',
    });
    router = new Router();
  });

  describe('Basic Generation', () => {
    it('should generate OpenAPI spec with info', () => {
      const spec = generator.generate(router);

      expect(spec.openapi).toBe('3.0.0');
      expect(spec.info).toEqual({
        title: 'Test API',
        version: '1.0.0',
        description: 'A test API',
      });
    });

    it('should include servers if provided', () => {
      const genWithServers = new OpenAPIGenerator({
        title: 'Test API',
        version: '1.0.0',
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
          { url: 'https://staging.example.com', description: 'Staging' },
        ],
      });

      const spec = genWithServers.generate(router);

      expect(spec.servers).toHaveLength(2);
      expect(spec.servers?.[0]!.url).toBe('https://api.example.com');
    });

    it('should include contact and license', () => {
      const genWithMeta = new OpenAPIGenerator({
        title: 'Test API',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      });

      const spec = genWithMeta.generate(router);

      expect(spec.info.contact).toEqual({
        name: 'API Support',
        email: 'support@example.com',
      });
      expect(spec.info.license).toEqual({
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      });
    });
  });

  describe('Path Generation', () => {
    it('should generate paths for routes', () => {
      router.route(Route.get('/users', async () => ({ users: [] })));
      router.route(Route.post('/users', async () => ({ id: 1 })));

      const spec = generator.generate(router);

      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users']!.get).toBeDefined();
      expect(spec.paths['/users']!.post).toBeDefined();
    });

    it('should include route summary and description', () => {
      router.route(
        Route.get('/users', async () => ({ users: [] }), {
          summary: 'List users',
          description: 'Get a list of all users',
        }),
      );

      const spec = generator.generate(router);

      expect(spec.paths['/users']!.get?.summary).toBe('List users');
      expect(spec.paths['/users']!.get?.description).toBe('Get a list of all users');
    });

    it('should include operationId', () => {
      router.route(
        Route.get('/users', async () => ({ users: [] }), {
          operationId: 'listUsers',
        }),
      );

      const spec = generator.generate(router);

      expect(spec.paths['/users']!.get?.operationId).toBe('listUsers');
    });

    it('should mark deprecated routes', () => {
      router.route(
        Route.get('/legacy', async () => ({}), {
          deprecated: true,
        }),
      );

      const spec = generator.generate(router);

      expect(spec.paths['/legacy']!.get?.deprecated).toBe(true);
    });
  });

  describe('Parameters', () => {
    it('should include path parameters', () => {
      router.route(
        Route.get('/users/:id', async () => ({}), {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'User ID',
            },
          ],
        }),
      );

      const spec = generator.generate(router);

      const params = spec.paths['/users/:id']!.get?.parameters;
      expect(params).toBeDefined();
      expect(params?.[0]!).toMatchObject({
        name: 'id',
        in: 'path',
        required: true,
        description: 'User ID',
      });
    });

    it('should include query parameters', () => {
      router.route(
        Route.get('/users', async () => ({}), {
          parameters: [
            {
              name: 'page',
              in: 'query',
              description: 'Page number',
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Page size',
            },
          ],
        }),
      );

      const spec = generator.generate(router);

      const params = spec.paths['/users']!.get?.parameters;
      expect(params).toHaveLength(2);
      expect(params?.[0]!.name).toBe('page');
      expect(params?.[1]!.name).toBe('limit');
    });

    it('should include parameter examples', () => {
      router.route(
        Route.get('/users/:id', async () => ({}), {
          parameters: [
            {
              name: 'id',
              in: 'path',
              example: '123',
            },
          ],
        }),
      );

      const spec = generator.generate(router);

      const params = spec.paths['/users/:id']!.get?.parameters;
      expect(params?.[0]!.example).toBe('123');
    });
  });

  describe('Request Body', () => {
    it('should include request body schema', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
      });

      router.route(
        Route.post('/users', async () => ({}), {
          requestBody: {
            description: 'User to create',
            required: true,
            schema: userSchema,
          },
        }),
      );

      const spec = generator.generate(router);

      const requestBody = spec.paths['/users']!.post?.requestBody;
      expect(requestBody).toBeDefined();
      expect(requestBody?.description).toBe('User to create');
      expect(requestBody?.required).toBe(true);
      expect(requestBody?.content).toHaveProperty('application/json');
    });

    it('should include request body examples', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
      });

      router.route(
        Route.post('/users', async () => ({}), {
          requestBody: {
            schema: userSchema,
            examples: {
              john: { name: 'John Doe' },
              jane: { name: 'Jane Doe' },
            },
          },
        }),
      );

      const spec = generator.generate(router);

      const examples =
        spec.paths['/users']!.post?.requestBody?.content!['application/json']!.examples;
      expect(examples).toBeDefined();
      expect(examples?.['john']).toEqual({ name: 'John Doe' });
    });
  });

  describe('Responses', () => {
    it('should include default 200 response', () => {
      router.route(Route.get('/users', async () => ({ users: [] })));

      const spec = generator.generate(router);

      expect(spec.paths['/users']!.get?.responses['200']).toBeDefined();
      expect(spec.paths['/users']!.get?.responses!['200']!.description).toBe('Successful response');
    });

    it('should include custom responses', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
      });

      router.route(
        Route.post('/users', async () => ({}), {
          responses: [
            {
              statusCode: 201,
              description: 'User created',
              schema: userSchema,
            },
            {
              statusCode: 400,
              description: 'Invalid input',
            },
          ],
        }),
      );

      const spec = generator.generate(router);

      expect(spec.paths['/users']!.post?.responses!['201']).toBeDefined();
      expect(spec.paths['/users']!.post?.responses!['201']!.description).toBe('User created');
      expect(spec.paths['/users']!.post?.responses!['400']).toBeDefined();
    });

    it('should include response examples', () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
      });

      router.route(
        Route.get('/users/:id', async () => ({}), {
          responses: [
            {
              statusCode: 200,
              description: 'User found',
              schema: userSchema,
              examples: {
                john: { id: 1, name: 'John Doe' },
              },
            },
          ],
        }),
      );

      const spec = generator.generate(router);

      const response = spec.paths['/users/:id']!.get?.responses!['200'];
      const examples = response?.content?.['application/json']!.examples;
      expect(examples?.['john']).toEqual({ id: 1, name: 'John Doe' });
    });
  });

  describe('Tags', () => {
    it('should collect tags from routes', () => {
      router.route(Route.get('/users', async () => ({}), { tags: ['users'] }));
      router.route(Route.get('/posts', async () => ({}), { tags: ['posts'] }));
      router.route(Route.get('/admin', async () => ({}), { tags: ['users', 'admin'] }));

      const spec = generator.generate(router);

      expect(spec.tags).toBeDefined();
      expect(spec.tags?.length).toBe(3);
      expect(spec.tags?.map((t) => t.name)).toContain('users');
      expect(spec.tags?.map((t) => t.name)).toContain('posts');
      expect(spec.tags?.map((t) => t.name)).toContain('admin');
    });

    it('should include tags in operations', () => {
      router.route(
        Route.get('/users', async () => ({}), {
          tags: ['users', 'public'],
        }),
      );

      const spec = generator.generate(router);

      expect(spec.paths['/users']!.get?.tags).toEqual(['users', 'public']);
    });
  });

  describe('JSON Generation', () => {
    it('should generate valid JSON', () => {
      router.route(Route.get('/users', async () => ({})));

      const json = generator.generateJSON(router);
      const parsed = JSON.parse(json);

      expect(parsed.openapi).toBe('3.0.0');
      expect(parsed.info.title).toBe('Test API');
    });

    it('should format JSON with indentation', () => {
      router.route(Route.get('/users', async () => ({})));

      const json = generator.generateJSON(router);

      // Should be pretty-printed
      expect(json).toContain('\n');
      expect(json).toContain('  ');
    });
  });

  describe('YAML Generation', () => {
    it('should generate YAML', () => {
      router.route(Route.get('/users', async () => ({})));

      const yaml = generator.generateYAML(router);

      expect(yaml).toContain('openapi:');
      expect(yaml).toContain('info:');
      expect(yaml).toContain('title:');
      expect(yaml).toContain('Test API');
    });

    it('should include paths in YAML', () => {
      router.route(Route.get('/users', async () => ({})));

      const yaml = generator.generateYAML(router);

      expect(yaml).toContain('paths:');
      expect(yaml).toContain('/users:');
      expect(yaml).toContain('get:');
    });
  });

  describe('Multiple HTTP Methods', () => {
    it('should handle all HTTP methods', () => {
      router.route(Route.get('/resource', async () => ({})));
      router.route(Route.post('/resource', async () => ({})));
      router.route(Route.put('/resource', async () => ({})));
      router.route(Route.patch('/resource', async () => ({})));
      router.route(Route.delete('/resource', async () => ({})));

      const spec = generator.generate(router);

      expect(spec.paths['/resource']!.get).toBeDefined();
      expect(spec.paths['/resource']!.post).toBeDefined();
      expect(spec.paths['/resource']!.put).toBeDefined();
      expect(spec.paths['/resource']!.patch).toBeDefined();
      expect(spec.paths['/resource']!.delete).toBeDefined();
    });
  });
});

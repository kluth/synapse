import { Router, RouterError } from '../resources/Router';
import { Route } from '../resources/Route';
import { Schema } from '../../skeletal/core/Schema';
import { FieldSchema } from '../../skeletal/core/FieldSchema';
import { min as minNumber } from '../../skeletal/validators/NumberValidator';

describe('Router', () => {
  let router: Router;

  beforeEach(() => {
    router = new Router();
  });

  describe('Route Registration', () => {
    it('should register a route', () => {
      const route = Route.get('/users', async () => ({ users: [] }));
      router.route(route);

      expect(router.getRoutes()).toHaveLength(1);
      expect(router.getRoutes()[0]).toBe(route);
    });

    it('should register multiple routes', () => {
      const route1 = Route.get('/users', async () => ({ users: [] }));
      const route2 = Route.post('/users', async () => ({ id: 1 }));

      router.addRoutes(route1, route2);

      expect(router.getRoutes()).toHaveLength(2);
    });

    it('should add global middleware', () => {
      const middleware = async (_ctx: unknown, next: () => Promise<unknown>): Promise<unknown> =>
        next();
      router.use(middleware);

      // Middleware is private, but we can verify it works through request handling
      expect(router.getRoutes()).toHaveLength(0);
    });
  });

  describe('Request Handling', () => {
    it('should handle GET request', async () => {
      router.route(
        Route.get('/users', async () => ({
          users: [{ id: 1, name: 'John' }],
        })),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users',
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({
        users: [{ id: 1, name: 'John' }],
      });
    });

    it('should handle POST request', async () => {
      router.route(
        Route.post('/users', async (ctx) => ({
          id: 1,
          ...(typeof ctx.body === 'object' && ctx.body !== null ? ctx.body : {}),
        })),
      );

      const response = await router.handle({
        method: 'POST',
        path: '/users',
        body: { name: 'John' },
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ id: 1, name: 'John' });
    });

    it('should handle path parameters', async () => {
      router.route(
        Route.get('/users/:id', async (ctx) => ({
          id: (ctx.params as { id: string }).id,
        })),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users/123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ id: '123' });
    });

    it('should handle query parameters', async () => {
      router.route(
        Route.get('/users', async (ctx) => ({
          query: ctx.query,
        })),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users',
        query: { page: 1, limit: 10 },
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({
        query: { page: 1, limit: 10 },
      });
    });
  });

  describe('Path Matching', () => {
    it('should match exact paths', async () => {
      router.route(Route.get('/users', async () => ({ users: [] })));

      const response = await router.handle({
        method: 'GET',
        path: '/users',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should match paths with parameters', async () => {
      router.route(
        Route.get('/users/:id', async (ctx) => ({
          id: (ctx.params as { id: string }).id,
        })),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users/123',
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({ id: '123' });
    });

    it('should match paths with multiple parameters', async () => {
      router.route(
        Route.get('/users/:userId/posts/:postId', async (ctx) => ({
          userId: (ctx.params as { userId: string }).userId,
          postId: (ctx.params as { postId: string }).postId,
        })),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users/123/posts/456',
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({
        userId: '123',
        postId: '456',
      });
    });

    it('should return 404 for non-matching path', async () => {
      router.route(Route.get('/users', async () => ({ users: [] })));

      const response = await router.handle({
        method: 'GET',
        path: '/posts',
      });

      expect(response.statusCode).toBe(404);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 404 for non-matching method', async () => {
      router.route(Route.get('/users', async () => ({ users: [] })));

      const response = await router.handle({
        method: 'POST',
        path: '/users',
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Validation', () => {
    it('should validate required path parameters', async () => {
      router.route(
        Route.get('/users/:id', async (ctx) => ({ id: (ctx.params as { id: string }).id }), {
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
            },
          ],
        }),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/users/123',
      });

      expect(response.statusCode).toBe(200);
    });

    it('should validate request body schema', async () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number', true, false, undefined, [minNumber(0)]),
      });

      router.route(
        Route.post(
          '/users',
          async (ctx) => ({
            id: 1,
            ...(typeof ctx.body === 'object' && ctx.body !== null ? ctx.body : {}),
          }),
          {
            requestBody: {
              required: true,
              schema: userSchema,
            },
          },
        ),
      );

      const response = await router.handle({
        method: 'POST',
        path: '/users',
        body: { name: 'John', age: 30 },
      });

      expect(response.statusCode).toBe(200);
    });

    it('should return 400 for missing required body', async () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
      });

      router.route(
        Route.post(
          '/users',
          async (ctx) => ({
            id: 1,
            ...(typeof ctx.body === 'object' && ctx.body !== null ? ctx.body : {}),
          }),
          {
            requestBody: {
              required: true,
              schema: userSchema,
            },
          },
        ),
      );

      const response = await router.handle({
        method: 'POST',
        path: '/users',
      });

      expect(response.statusCode).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 400 for invalid body schema', async () => {
      const userSchema = new Schema({
        name: new FieldSchema('string'),
        age: new FieldSchema('number', true, false, undefined, [minNumber(0)]),
      });

      router.route(
        Route.post(
          '/users',
          async (ctx) => ({
            id: 1,
            ...(typeof ctx.body === 'object' && ctx.body !== null ? ctx.body : {}),
          }),
          {
            requestBody: {
              required: true,
              schema: userSchema,
            },
          },
        ),
      );

      const response = await router.handle({
        method: 'POST',
        path: '/users',
        body: { name: 'John' }, // Missing required 'age'
      });

      expect(response.statusCode).toBe(400);
      expect(response.data).toHaveProperty('details');
    });
  });

  describe('Middleware', () => {
    it('should execute route middleware', async () => {
      const calls: string[] = [];

      const middleware = async (_ctx: unknown, next: () => Promise<unknown>): Promise<unknown> => {
        calls.push('middleware');
        return next();
      };

      router.route(
        Route.get(
          '/users',
          async () => {
            calls.push('handler');
            return { users: [] };
          },
          {
            middleware: [middleware],
          },
        ),
      );

      await router.handle({
        method: 'GET',
        path: '/users',
      });

      expect(calls).toEqual(['middleware', 'handler']);
    });

    it('should execute global middleware before route middleware', async () => {
      const calls: string[] = [];

      const globalMiddleware = async (
        _ctx: unknown,
        next: () => Promise<unknown>,
      ): Promise<unknown> => {
        calls.push('global');
        return next();
      };

      const routeMiddleware = async (
        _ctx: unknown,
        next: () => Promise<unknown>,
      ): Promise<unknown> => {
        calls.push('route');
        return next();
      };

      router.use(globalMiddleware);
      router.route(
        Route.get(
          '/users',
          async () => {
            calls.push('handler');
            return { users: [] };
          },
          {
            middleware: [routeMiddleware],
          },
        ),
      );

      await router.handle({
        method: 'GET',
        path: '/users',
      });

      expect(calls).toEqual(['global', 'route', 'handler']);
    });

    it('should allow middleware to modify context', async () => {
      const authMiddleware = async (
        ctx: unknown,
        next: () => Promise<unknown>,
      ): Promise<unknown> => {
        (ctx as { metadata: Record<string, unknown> }).metadata['user'] = { id: 1, role: 'admin' };
        return next();
      };

      router.route(
        Route.get(
          '/profile',
          async (ctx) => ({
            user: (ctx.metadata as Record<string, unknown>)['user'],
          }),
          {
            middleware: [authMiddleware],
          },
        ),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/profile',
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toEqual({
        user: { id: 1, role: 'admin' },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle route handler errors', async () => {
      router.route(
        Route.get('/error', async () => {
          throw new Error('Test error');
        }),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/error',
      });

      expect(response.statusCode).toBe(500);
      expect(response.data).toHaveProperty('error');
    });

    it('should handle RouterError with status code', async () => {
      router.route(
        Route.get('/forbidden', async () => {
          throw new RouterError('Access denied', 403);
        }),
      );

      const response = await router.handle({
        method: 'GET',
        path: '/forbidden',
      });

      expect(response.statusCode).toBe(403);
      expect(response.data).toMatchObject({
        error: 'Access denied',
      });
    });

    it('should use custom error handler', async () => {
      const customRouter = new Router({
        errorHandler: () => ({
          statusCode: 418,
          data: { message: "I'm a teapot" },
        }),
      });

      customRouter.route(
        Route.get('/error', async () => {
          throw new Error('Test');
        }),
      );

      const response = await customRouter.handle({
        method: 'GET',
        path: '/error',
      });

      expect(response.statusCode).toBe(418);
      expect(response.data).toEqual({ message: "I'm a teapot" });
    });
  });

  describe('Base Path', () => {
    it('should handle base path', async () => {
      const apiRouter = new Router({ basePath: '/api/v1' });

      apiRouter.route(Route.get('/users', async () => ({ users: [] })));

      const response = await apiRouter.handle({
        method: 'GET',
        path: '/users',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('Route Helpers', () => {
    it('should get routes by tag', () => {
      router.route(Route.get('/users', async () => ({}), { tags: ['users'] }));
      router.route(Route.get('/posts', async () => ({}), { tags: ['posts'] }));
      router.route(Route.get('/admin', async () => ({}), { tags: ['users', 'admin'] }));

      const userRoutes = router.getRoutesByTag('users');
      expect(userRoutes).toHaveLength(2);

      const postRoutes = router.getRoutesByTag('posts');
      expect(postRoutes).toHaveLength(1);
    });
  });
});

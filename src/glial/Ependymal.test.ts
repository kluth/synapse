import { Ependymal } from './Ependymal';

describe('Ependymal - Data Flow and API Gateway', () => {
  let ependymal: Ependymal;

  beforeEach(() => {
    ependymal = new Ependymal({
      id: 'epen-1',
      rateLimit: 100,
      rateLimitWindow: 1000,
    });
  });

  afterEach(async () => {
    await ependymal.shutdown();
  });

  describe('initialization', () => {
    it('should create an ependymal with correct properties', () => {
      expect(ependymal.id).toBe('epen-1');
      expect(ependymal.isActive).toBe(false);
    });

    it('should activate successfully', async () => {
      await ependymal.activate();

      expect(ependymal.isActive).toBe(true);
    });
  });

  describe('route registration', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should register route handlers', () => {
      const handler = jest.fn().mockResolvedValue({ data: 'result' });

      ependymal.registerRoute('/api/users', handler);

      const routes = ependymal.getRoutes();
      expect(routes).toContain('/api/users');
    });

    it('should handle requests to registered routes', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, body: { data: 'result' } });

      ependymal.registerRoute('/api/users', handler);

      const response = await ependymal.route({
        path: '/api/users',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ data: 'result' });
    });

    it('should return 404 for unknown routes', async () => {
      const response = await ependymal.route({
        path: '/api/unknown',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(response.status).toBe(404);
    });
  });

  describe('middleware pipeline', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should add middleware to pipeline', () => {
      const middleware = jest.fn().mockImplementation((req, next) => next(req));

      ependymal.use(middleware);

      expect(ependymal.getMiddleware()).toHaveLength(1);
    });

    it('should execute middleware in order', async () => {
      const order: number[] = [];

      const middleware1 = jest.fn().mockImplementation(async (req, next) => {
        order.push(1);
        return await next(req);
      });

      const middleware2 = jest.fn().mockImplementation(async (req, next) => {
        order.push(2);
        return await next(req);
      });

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });

      ependymal.use(middleware1);
      ependymal.use(middleware2);
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(order).toEqual([1, 2]);
    });

    it('should allow middleware to modify request', async () => {
      const middleware = jest.fn().mockImplementation(async (req, next) => {
        const modifiedReq = {
          ...req,
          headers: { ...req.headers, 'x-modified': 'true' },
        };
        return await next(modifiedReq);
      });

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });

      ependymal.use(middleware);
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-modified': 'true' }),
        }),
      );
    });
  });

  describe('rate limiting', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should allow requests within rate limit', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      const response = await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      expect(response.status).toBe(200);
    });

    it('should block requests exceeding rate limit', async () => {
      const limitedEpen = new Ependymal({
        id: 'epen-2',
        rateLimit: 2,
        rateLimitWindow: 1000,
      });

      await limitedEpen.activate();

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      limitedEpen.registerRoute('/api/test', handler);

      // Make requests up to limit
      await limitedEpen.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      await limitedEpen.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      // This should be rate limited
      const response = await limitedEpen.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      expect(response.status).toBe(429);

      await limitedEpen.shutdown();
    });

    it('should reset rate limit after window expires', async () => {
      const limitedEpen = new Ependymal({
        id: 'epen-3',
        rateLimit: 1,
        rateLimitWindow: 50,
      });

      await limitedEpen.activate();

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      limitedEpen.registerRoute('/api/test', handler);

      await limitedEpen.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await limitedEpen.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
        clientId: 'client-1',
      });

      expect(response.status).toBe(200);

      await limitedEpen.shutdown();
    });
  });

  describe('request transformation', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should transform request data', async () => {
      const transformer = (data: unknown): unknown => {
        return { transformed: true, original: data };
      };

      ependymal.addTransformer('request', transformer);

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'POST',
        headers: {},
        body: { test: 'data' },
      });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { transformed: true, original: { test: 'data' } },
        }),
      );
    });

    it('should transform response data', async () => {
      const transformer = (data: unknown): unknown => {
        return { transformed: true, original: data };
      };

      ependymal.addTransformer('response', transformer);

      const handler = jest.fn().mockResolvedValue({
        status: 200,
        body: { result: 'success' },
      });

      ependymal.registerRoute('/api/test', handler);

      const response = await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(response.body).toEqual({
        transformed: true,
        original: { result: 'success' },
      });
    });
  });

  describe('request validation', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should validate requests', async () => {
      const validator = jest.fn().mockReturnValue({ valid: true });

      ependymal.addValidator('/api/test', validator);

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(validator).toHaveBeenCalled();
    });

    it('should reject invalid requests', async () => {
      const validator = jest.fn().mockReturnValue({
        valid: false,
        errors: ['Invalid data'],
      });

      ependymal.addValidator('/api/test', validator);

      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      const response = await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      expect(response.status).toBe(400);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await ependymal.activate();
    });

    it('should track request statistics', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      const stats = ependymal.getStats();

      expect(stats.totalRequests).toBe(1);
      expect(stats.requestsByPath['/api/test']).toBe(1);
    });

    it('should track response status codes', async () => {
      const handler = jest.fn().mockResolvedValue({ status: 200, body: {} });
      ependymal.registerRoute('/api/test', handler);

      await ependymal.route({
        path: '/api/test',
        method: 'GET',
        headers: {},
        body: undefined,
      });

      const stats = ependymal.getStats();

      expect(stats.statusCodes['200']).toBe(1);
    });
  });
});

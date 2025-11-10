# [ENHANCEMENT-2] Request/Response Pattern with Correlation IDs

## Title
Implement Request/Response Message Pattern with Distributed Tracing Support

## Problem Description

**The Pain Point:**

The Synapse Framework's Circulatory system provides excellent message routing with fire-and-forget and pub-sub patterns, but lacks first-class support for request-response communication. This creates challenges:

1. **No Request Matching**: Fire-and-forget patterns can't match responses to requests
2. **No Distributed Tracing**: Correlation IDs aren't automatically tracked across message flows
3. **No Timeout Handling**: No built-in request timeout management
4. **Debugging Difficulty**: Tracing a request through the system is manual and error-prone

**Current Limitations:**

```typescript
// Current EventBus pattern - fire-and-forget
eventBus.emit('user:create', { name: 'Alice' });

// If we need a response, we must manually track:
const requestId = crypto.randomUUID();
const responsePromise = new Promise((resolve) => {
  eventBus.once(`user:created:${requestId}`, resolve);
});

eventBus.emit('user:create', { id: requestId, name: 'Alice' });
const response = await responsePromise;

// This is:
// - Verbose (boilerplate)
// - Fragile (manual correlation)
// - Error-prone (no timeout, no error propagation)
// - Hard to trace (IDs scattered across code)
```

**Who Experiences This Pain:**

- **Casual Users**: Building microservices that need request-response feels complex
- **Hobbyist Users**: Want clean request-response syntax without callback hell
- **Professional Users**: Debugging distributed systems requires correlation tracking across logs

**Real-World Gap:**

Professional systems need:
- RPC-style request-response (gRPC, tRPC, JSON-RPC)
- Automatic correlation ID propagation (OpenTelemetry, Jaeger)
- Request timeout and retry management
- Error propagation (failures bubble back to requester)

---

## The Proposal

### Core Architecture

**Synapse Request-Response System**

```typescript
// src/circulatory/patterns/index.ts - ADD

import { RequestManager, createRequester, createResponder } from '@synapse-framework/core';

// === REQUESTER: Send request, wait for response ===

const userService = createRequester({
  id: 'user-service-requester',
  timeout: 5000, // 5 second timeout
});

// Send request and wait for response
const response = await userService.request('get-user', {
  userId: '123',
});

console.log(response); // { id: '123', name: 'Alice', email: 'alice@example.com' }

// With error handling
try {
  const user = await userService.request('get-user', { userId: '999' });
} catch (error) {
  if (error.code === 'REQUEST_TIMEOUT') {
    console.error('User service is slow');
  } else if (error.code === 'USER_NOT_FOUND') {
    console.error('User does not exist');
  }
}

// === RESPONDER: Listen for requests, send responses ===

const responder = createResponder({
  id: 'user-service-responder',
});

responder.handle('get-user', async (request) => {
  // request includes: { userId: '123', correlationId: '...', traceId: '...' }

  const user = await database.findUser(request.userId);

  if (!user) {
    // Responder can send errors back
    throw new RequestError('USER_NOT_FOUND', 'User not found');
  }

  return user; // Automatically sent back to requester
});

// === REQUEST OBJECT STRUCTURE ===

interface Request<T = any> {
  // Unique ID for this request
  requestId: string;

  // Correlation ID (same across all services touched by this request)
  correlationId: string;

  // Trace ID (OpenTelemetry/Jaeger compatible)
  traceId: string;

  // Parent span ID (for distributed tracing)
  parentSpanId?: string;

  // The actual request payload
  data: T;

  // When request was created
  timestamp: Date;

  // Which service initiated the request
  initiatedBy: string;

  // Request path (for debugging)
  path: string[]; // ['client', 'api-gateway', 'user-service']
}

interface Response<T = any> {
  // Links back to the request
  requestId: string;
  correlationId: string;
  traceId: string;

  // The response data
  data: T;

  // Status
  success: boolean;

  // Error details (if failed)
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };

  // Timing information
  processingTime: number; // ms
}

// === ADVANCED: CHAINING REQUESTS ===

// Request propagates context automatically

responder.handle('create-user', async (request) => {
  // Create user
  const user = await database.createUser(request.data);

  // Make another request (correlation ID automatically propagated)
  const profile = await userService.request('create-profile', {
    userId: user.id,
    // correlationId is automatically included from request
  });

  return { user, profile };
  // Correlation ID is preserved: initial client → api-gateway → user-service → profile-service
});

// === TYPED REQUESTS ===

// Define types for requests and responses
interface GetUserRequest {
  userId: string;
}

interface GetUserResponse {
  id: string;
  name: string;
  email: string;
}

const typedRequester = createRequester<GetUserRequest, GetUserResponse>({
  id: 'typed-requester',
});

// Type-safe
const response = await typedRequester.request('get-user', { userId: '123' });
// response: GetUserResponse (type-safe)

// === REQUEST PATTERNS ===

// 1. Request-Response (one-to-one)
const response = await requester.request('service.method', data);

// 2. Request-Stream (one request, multiple responses)
const stream = await requester.requestStream('service.stream', data);
for await (const item of stream) {
  console.log(item);
}

// 3. Stream-Request (multiple requests, one response)
const streamer = requester.requestStream('service.aggregate', null);
await streamer.send(item1);
await streamer.send(item2);
await streamer.send(item3);
const result = await streamer.getResponse();

// 4. Stream-Stream (multiple requests/responses)
const biDirectional = requester.streamStream('service.chat', null);
await biDirectional.send({ message: 'Hello' });
const response = await biDirectional.receive();
```

### Integration with Existing Systems

**Circulatory System Integration:**

```typescript
// src/circulatory/core/Heart.ts (enhanced)

import { RequestManager } from './RequestManager';

export class Heart {
  private requestManager = new RequestManager();

  // Route requests through the heart
  async routeRequest<T>(
    route: string,
    data: any,
    options?: { timeout?: number; retries?: number }
  ): Promise<T> {
    return this.requestManager.send(route, data, options);
  }

  registerRequestHandler(route: string, handler: RequestHandler) {
    this.requestManager.registerHandler(route, handler);
  }
}
```

**Glial System Integration (Microglia):**

```typescript
// src/glial/Microglia.ts (enhanced)

export class Microglia {
  // Track request metrics
  trackRequest(request: Request): void {
    this.metrics.record({
      name: 'request',
      initiator: request.initiatedBy,
      path: request.path.join(' → '),
      correlationId: request.correlationId,
    });
  }

  trackResponse(response: Response): void {
    this.metrics.record({
      name: 'response',
      status: response.success ? 'success' : 'error',
      processingTime: response.processingTime,
      correlationId: response.correlationId,
    });
  }

  // Trace request flow
  getRequestTrace(correlationId: string) {
    return this.metrics.getTrace(correlationId);
  }
}
```

**Theater Integration:**

```typescript
// test-request-response.ts

import { createHypothesis } from '@synapse-framework/core';
import { createRequester, createResponder } from '@synapse-framework/core';

const hypothesis = createHypothesis('Request-Response Pattern');

hypothesis.case('request-response with successful operation', async (done) => {
  const requester = createRequester({ id: 'client' });
  const responder = createResponder({ id: 'server' });

  responder.handle('echo', async (req) => {
    return { message: `Echo: ${req.data.message}` };
  });

  const response = await requester.request('echo', { message: 'Hello' });
  expect(response.data.message).toBe('Echo: Hello');

  done();
});

hypothesis.case('request timeout', async (done) => {
  const requester = createRequester({ id: 'client', timeout: 100 });
  const responder = createResponder({ id: 'server' });

  responder.handle('slow', async (req) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { status: 'ok' };
  });

  try {
    await requester.request('slow', {});
    fail('Should have timed out');
  } catch (error) {
    expect(error.code).toBe('REQUEST_TIMEOUT');
    done();
  }
});

hypothesis.case('correlation ID propagation', async (done) => {
  const requester = createRequester({ id: 'client' });
  const responder = createResponder({ id: 'server' });

  let capturedCorrelationId: string;

  responder.handle('track', async (req) => {
    capturedCorrelationId = req.correlationId;
    return { ok: true };
  });

  const response = await requester.request('track', {});
  expect(capturedCorrelationId).toBe(response.correlationId);

  done();
});

hypothesis.case('error propagation', async (done) => {
  const requester = createRequester({ id: 'client' });
  const responder = createResponder({ id: 'server' });

  responder.handle('fail', async (req) => {
    throw new RequestError('NOT_FOUND', 'Resource not found');
  });

  try {
    await requester.request('fail', {});
    fail('Should have thrown');
  } catch (error) {
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    done();
  }
});

hypothesis.case('request tracing with path', async (done) => {
  const requester = createRequester({ id: 'client' });
  const gateway = createResponder({ id: 'gateway' });
  const service = createResponder({ id: 'user-service' });

  let tracePath: string[];

  service.handle('get-user', async (req) => {
    tracePath = req.path;
    return { id: '123', name: 'Alice' };
  });

  gateway.handle('get-user', async (req) => {
    // Gateway forwards to service (preserving correlation ID)
    return await requester.request('get-user', req.data);
  });

  const response = await requester.request('get-user', { userId: '123' });

  // Path shows the route through the system
  expect(tracePath).toContain('client');
  expect(tracePath).toContain('gateway');
  expect(tracePath).toContain('user-service');

  done();
});
```

### Component Architecture

```typescript
// src/circulatory/patterns/RequestManager.ts

export class RequestManager {
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }>();

  private handlers = new Map<string, RequestHandler>();

  async send<T>(
    route: string,
    data: any,
    options: {
      timeout?: number;
      retries?: number;
      correlationId?: string;
    } = {}
  ): Promise<Response<T>> {
    const requestId = crypto.randomUUID();
    const correlationId = options.correlationId ?? crypto.randomUUID();
    const traceId = options.correlationId ?? crypto.randomUUID(); // Usually from context

    const request: Request = {
      requestId,
      correlationId,
      traceId,
      data,
      timestamp: new Date(),
      initiatedBy: this.id,
      path: [this.id],
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new RequestError('REQUEST_TIMEOUT', 'Request timed out'));
      }, options.timeout ?? 5000);

      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
      });

      // Route to handler
      this.routeRequest(route, request);
    });
  }

  registerHandler(route: string, handler: RequestHandler) {
    this.handlers.set(route, handler);
  }

  private async routeRequest(route: string, request: Request) {
    const handler = this.handlers.get(route);

    if (!handler) {
      this.sendError(request, 'ROUTE_NOT_FOUND', `No handler for ${route}`);
      return;
    }

    try {
      const result = await handler(request);
      this.sendResponse(request, result);
    } catch (error) {
      if (error instanceof RequestError) {
        this.sendError(request, error.code, error.message);
      } else {
        this.sendError(request, 'INTERNAL_ERROR', String(error));
      }
    }
  }

  private sendResponse(request: Request, data: any) {
    const response: Response = {
      requestId: request.requestId,
      correlationId: request.correlationId,
      traceId: request.traceId,
      data,
      success: true,
      processingTime: Date.now() - request.timestamp.getTime(),
    };

    const pending = this.pendingRequests.get(request.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(response);
      this.pendingRequests.delete(request.requestId);
    }
  }

  private sendError(request: Request, code: string, message: string) {
    const response: Response = {
      requestId: request.requestId,
      correlationId: request.correlationId,
      traceId: request.traceId,
      data: null,
      success: false,
      error: { code, message },
      processingTime: Date.now() - request.timestamp.getTime(),
    };

    const pending = this.pendingRequests.get(request.requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(new RequestError(code, message));
      this.pendingRequests.delete(request.requestId);
    }
  }
}

// src/circulatory/patterns/RequestError.ts

export class RequestError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'RequestError';
  }
}
```

---

## Persona Value

### Casual User
**Value**: "Request-response communication is as simple as async/await"

```typescript
// Clean, synchronous-looking code
const user = await userService.request('get-user', { id: '123' });
console.log(user.name);

// Errors are exceptions, not callbacks
try {
  const user = await userService.request('get-user', { id: '999' });
} catch (error) {
  console.error(`Error: ${error.message}`);
}
```

- Time saved: RPC implementation time reduced from 4 hours to 30 minutes
- No callback hell or complex promise chains

### Hobbyist User
**Value**: "Distributed request tracing without instrumentation code"

- Automatic correlation ID tracking across services
- Can query request traces: `getRequestTrace(correlationId)`
- Understand system topology from request paths
- **Example**: "See entire request flow through 5 microservices in one trace"

### Professional (Backend Developer)
**Value**: "Standard RPC pattern with debugging and observability built-in"

- Request/response is industry-standard pattern (gRPC, tRPC, JSON-RPC)
- Automatic timeout, retry, and error handling
- Full trace context (OpenTelemetry compatible)
- **Integration**: Request-response bridges sync and async paradigms
- **Metrics**: Can monitor service response times and error rates

### Professional (DevOps/SRE)
**Value**: "Complete request flow visibility for debugging production issues"

- Correlation IDs enable tracing requests through logs
- Timing information shows bottlenecks
- Error propagation enables root cause analysis
- **Debugging**: "I can see exactly where request failed and why"

---

## Acceptance Criteria

### GIVEN I am a microservice using request-response
**WHEN** I call `await requester.request('method', data)`
**THEN** I receive a response synchronously (or error)
**AND** the request/response flow is automatic

### GIVEN I make a request to a service
**WHEN** the request flows through multiple services
**THEN** the same correlationId is present in all logs
**AND** I can query `getRequestTrace(correlationId)` to see full flow

### GIVEN a request takes longer than expected
**WHEN** I set timeout: 5000
**THEN** if no response arrives in 5 seconds, RequestError('REQUEST_TIMEOUT') is thrown
**AND** the timeout is cancellable

### GIVEN a responder throws an error
**WHEN** it throws RequestError('NOT_FOUND', 'User not found')
**THEN** the requester receives that same error
**AND** the error code and message are preserved

### GIVEN I have nested requests (A→B→C)
**WHEN** the first request is made
**THEN** correlation ID and trace context flow through all three services
**AND** the final response shows the complete path: [A, B, C]

### GIVEN I want typed request-response
**WHEN** I define RequestType and ResponseType
**THEN** TypeScript enforces matching types
**AND** autocomplete works for request/response data

### GIVEN I want to track request metrics
**WHEN** Microglia is enabled
**THEN** every request is recorded with timing, success/failure, and correlation ID
**AND** I can query aggregate metrics (success rate, p95 latency)

### GIVEN I want request retries
**WHEN** I set `retries: 3`
**THEN** failed requests are retried up to 3 times
**AND** retries preserve the original requestId and correlationId

### GIVEN I'm streaming data
**WHEN** I use `requestStream()` or `streamStream()`
**THEN** multiple messages flow with the same correlation ID
**AND** streaming works efficiently without creating separate requests

### GIVEN I integrate with my existing EventBus
**WHEN** EventBus listeners call `requester.request()`
**THEN** correlation context flows from EventBus event to request-response
**AND** tracing works end-to-end

---

## Implementation Guidance

### New Files to Create
```
src/circulatory/patterns/
  RequestManager.ts       - Core request handling (200 lines)
  RequestError.ts         - Error types (50 lines)
  Requester.ts            - Client-side API (120 lines)
  Responder.ts            - Server-side API (120 lines)
  CorrelationContext.ts   - Context propagation (80 lines)
  index.ts                - Exports

src/circulatory/__tests__/
  RequestResponse.test.ts      - Comprehensive tests (250+ lines)
  Tracing.test.ts              - Correlation ID tests (100+ lines)
  Integration.test.ts          - E2E pattern tests (150+ lines)
```

### Integration Points
- **Heart**: Add request routing
- **Microglia**: Add request/response metrics
- **Vein/Artery**: Use RequestManager for internal messaging
- **Theater**: Request/response simulation for testing

### Test Strategy
- Unit tests: RequestManager primitives (50+ tests)
- Integration tests: Requester + Responder (40+ tests)
- Tracing tests: Correlation ID propagation (20+ tests)
- Performance tests: Request latency benchmarks (10+ tests)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Request-response latency | < 5ms (in-process) |
| Overhead vs direct call | < 10% |
| Memory per request | < 1KB |
| Correlation ID propagation | 100% coverage |
| Error propagation accuracy | 100% |
| Test coverage | 95%+ |
| Documentation | 100% with examples |

---

## Dependencies
- No new npm dependencies
- Uses existing Circulatory system
- Compatible with EventBus and all glial cells

---

## Risk Assessment
- **Low Risk**: Request-response is a well-known pattern
- **Compatibility**: Fully backward compatible
- **Performance**: Minimal overhead for in-process calls

---

## Rollout Strategy
1. **Phase 1**: Core RequestManager and Requester/Responder
2. **Phase 2**: Correlation ID and trace context propagation
3. **Phase 3**: Integration with Microglia metrics
4. **Phase 4**: Streaming patterns (stream-request, request-stream, stream-stream)
5. **Phase 5**: Example services and documentation

---

## Future Enhancements
- Automatic retry with exponential backoff
- Circuit breaker pattern integration
- Request caching/memoization
- Load balancing across multiple responders
- gRPC/JSON-RPC protocol adapters
- OpenTelemetry automatic instrumentation


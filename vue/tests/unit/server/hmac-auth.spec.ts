import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

// Mock express types for testing
interface MockRequest {
  headers: Record<string, string | undefined>;
  method: string;
  path: string;
  body?: Record<string, unknown>;
  ip: string;
}

interface MockResponse {
  status: (code: number) => MockResponse;
  json: (data: unknown) => void;
  statusCode?: number;
  _data?: unknown;
}

function createMockReq(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    headers: {},
    method: 'GET',
    path: '/_plugins',
    ip: '127.0.0.1',
    ...overrides
  };
}

function createMockRes(): MockResponse {
  const res: MockResponse = {
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: unknown) {
      res._data = data;
    }
  };
  return res;
}

const TEST_SECRET = 'test-secret-at-least-32-characters-for-hmac-validation';

function generateSignature(method: string, path: string, timestamp: string, body: string = ''): string {
  const message = `${method}:${path}:${timestamp}:${body}`;
  return createHmac('sha256', TEST_SECRET).update(message).digest('hex');
}

// Dynamically import the middleware (it uses ESM)
async function getHmacAuth() {
  const { createHmacAuth } = await import('../../../../server/middleware/hmac-auth');
  return createHmacAuth(TEST_SECRET);
}

describe('HMAC Auth Middleware', () => {
  let hmacAuth: ReturnType<Awaited<ReturnType<typeof getHmacAuth>>>;

  beforeEach(async () => {
    hmacAuth = await getHmacAuth() as unknown as typeof hmacAuth;
  });

  it('should pass with valid signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = generateSignature('GET', '/_plugins', timestamp);

    const req = createMockReq({
      headers: {
        'x-plugin-timestamp': timestamp,
        'x-plugin-signature': signature
      }
    });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeUndefined();
  });

  it('should reject missing headers', async () => {
    const req = createMockReq({ headers: {} });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._data).toEqual({ error: 'Missing authentication headers' });
  });

  it('should reject expired timestamp', async () => {
    const expiredTimestamp = String(Math.floor(Date.now() / 1000) - 60);
    const signature = generateSignature('GET', '/_plugins', expiredTimestamp);

    const req = createMockReq({
      headers: {
        'x-plugin-timestamp': expiredTimestamp,
        'x-plugin-signature': signature
      }
    });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._data).toEqual({ error: 'Request expired' });
  });

  it('should reject invalid signature', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));

    const req = createMockReq({
      headers: {
        'x-plugin-timestamp': timestamp,
        'x-plugin-signature': 'a'.repeat(64)
      }
    });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res._data).toEqual({ error: 'Invalid signature' });
  });

  it('should reject missing timestamp header only', async () => {
    const req = createMockReq({
      headers: {
        'x-plugin-signature': 'some-signature'
      }
    });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('should validate signature with body for POST requests', async () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = { heroTitle: 'New Title' };
    const bodyStr = JSON.stringify(body);
    const signature = generateSignature('PUT', '/_plugins/landing1/config', timestamp, bodyStr);

    const req = createMockReq({
      method: 'PUT',
      path: '/_plugins/landing1/config',
      body,
      headers: {
        'x-plugin-timestamp': timestamp,
        'x-plugin-signature': signature
      }
    });
    const res = createMockRes();
    const next = vi.fn();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (hmacAuth as any)(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

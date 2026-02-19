import { describe, it, expect } from 'vitest';

describe('Rate Limit Middleware', () => {
  it('should export pluginRateLimit middleware', async () => {
    const { pluginRateLimit } = await import('../../../../server/middleware/rate-limit');
    expect(pluginRateLimit).toBeDefined();
    expect(typeof pluginRateLimit).toBe('function');
  });
});

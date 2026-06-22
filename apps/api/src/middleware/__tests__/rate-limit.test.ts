import { describe, expect, it } from 'vitest';
import { RATE_LIMITS, RateLimiter } from '../rate-limit';

describe('RateLimiter identity keys', () => {
  it('prefers x-auth-user-id over legacy x-user-id for the rate-limit bucket', async () => {
    const observedKeys: string[] = [];
    const limiter = new RateLimiter({
      async get(key) {
        observedKeys.push(key);
        return null;
      },
      async set(key) {
        observedKeys.push(key);
      },
      async increment() {
        return 1;
      },
    });

    await limiter.checkLimit(
      {
        headers: {
          'x-auth-user-id': 'auth-user-99',
          'x-user-id': '11111111-1111-1111-1111-111111111111',
        },
        user: { id: 'fallback-user' },
        request: new Request('http://localhost/api/demo'),
        path: '/api/demo',
      },
      RATE_LIMITS.API,
    );

    expect(observedKeys).toEqual([
      'ratelimit:/api/demo:auth-user-99',
      'ratelimit:/api/demo:auth-user-99',
    ]);
  });
});

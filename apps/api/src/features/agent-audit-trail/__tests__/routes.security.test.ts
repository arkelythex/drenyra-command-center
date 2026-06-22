import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { agentAuditTrailRoutes } from '../api/routes';

describe('Agent Audit Trail RBAC', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test', SECURITY_ENFORCE_TEST_RBAC: 'true' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns 401 on plugins route when headers are missing', async () => {
    const response = await agentAuditTrailRoutes.handle(
      new Request('http://localhost/audit-trail/plugins'),
    );

    expect(response.status).toBe(401);
    const payload = (await response.json()) as { success: boolean; code: string };
    expect(payload.success).toBe(false);
    expect(payload.code).toBe('AUTH_REQUIRED');
  });
});

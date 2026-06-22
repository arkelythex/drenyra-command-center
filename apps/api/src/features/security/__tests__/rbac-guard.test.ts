import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { authorizeOperation } from '../rbac-guard';

describe('rbac-guard', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv, SECURITY_ENFORCE_TEST_RBAC: 'true' };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('fails when auth headers are missing', async () => {
    const result = await authorizeOperation({
      headers: {},
      operation: 'cognitive:stream',
      resource: '/api/ai-swarm/cognitive-stream',
    });

    expect(result).toMatchObject({ ok: false, status: 401, code: 'AUTH_REQUIRED' });
  });

  it('denies forbidden role for approval resolution', async () => {
    const result = await authorizeOperation({
      headers: {
        'x-user-id': 'usr-1',
        'x-user-role': 'viewer',
        'x-company-id': 'cmp-1',
      },
      operation: 'cognitive:approval:resolve',
      resource: '/api/ai-swarm/cognitive-stream/approval',
    });

    expect(result).toMatchObject({ ok: false, status: 403, code: 'FORBIDDEN_ROLE' });
  });

  it('allows analyst for cognitive stream', async () => {
    const result = await authorizeOperation({
      headers: {
        'x-user-id': 'usr-2',
        'x-user-role': 'analyst',
        'x-company-id': 'cmp-1',
      },
      operation: 'cognitive:stream',
      resource: '/api/ai-swarm/cognitive-stream',
    });

    expect(result).toMatchObject({ ok: true });
  });

  it('allows auditor for audit export', async () => {
    const result = await authorizeOperation({
      headers: {
        'x-user-id': 'aud-1',
        'x-user-role': 'auditor',
        'x-company-id': 'cmp-9',
      },
      operation: 'audit:trail:export',
      resource: '/audit-trail/export/xml',
    });

    expect(result).toMatchObject({ ok: true });
  });

  it('denies unknown roles', async () => {
    const result = await authorizeOperation({
      headers: {
        'x-user-id': 'usr-3',
        'x-user-role': 'contractor',
        'x-company-id': 'cmp-1',
      },
      operation: 'audit:trail:read',
      resource: '/audit-trail',
    });

    expect(result).toMatchObject({ ok: false, status: 403, code: 'FORBIDDEN_ROLE' });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SireSubmissionConfig } from '../../types';

vi.mock('../../services/sire-config.service', () => ({
  buildSireConfig: vi.fn(),
}));

vi.mock('../../services/sire-oauth.service', () => ({
  resolveAuthToken: vi.fn(),
}));

vi.mock('../../services/tenant-sunat-context.service', () => ({
  resolveTenantSunatContext: vi.fn(),
}));

import { buildSireConfig } from '../../services/sire-config.service';
import { resolveAuthToken } from '../../services/sire-oauth.service';
import { resolveTenantSunatContext } from '../../services/tenant-sunat-context.service';
import { SireService } from '../../sire.service';
import type { TenantSunatContext } from '../../types';

const ORIGINAL_TEMPLATE = process.env.SIRE_API_SUMMARY_PATH_TEMPLATE;
const ORIGINAL_MAX_ATTEMPTS = process.env.SIRE_API_SUMMARY_MAX_ATTEMPTS;
const ORIGINAL_BACKOFF_BASE_MS = process.env.SIRE_API_SUMMARY_BACKOFF_BASE_MS;
const ORIGINAL_BACKOFF_MAX_MS = process.env.SIRE_API_SUMMARY_BACKOFF_MAX_MS;

const BASE_CONFIG: SireSubmissionConfig = {
  mode: 'api',
  baseUrl: 'https://sunat.example.test',
  salesSubmissionPath: '/sales',
  purchasesSubmissionPath: '/purchases',
  apiToken: '',
  authMode: 'auto',
  uploadMode: 'json-base64',
  uploadFieldName: 'archivo',
  allowSimulationFallbackInApiMode: true,
  timeoutMs: 1000,
  companyRuc: '20100070970',
  deprecatedCompanyRuc: '20100070970',
  oauth: {
    baseUrl: 'https://oauth.sunat.example.test',
    tokenPathTemplate: '/oauth/token',
    scope: 'scope',
    clientId: 'client-id',
    clientSecret: 'client-secret',
    solUsername: 'sol-user',
    solPassword: 'sol-pass',
  },
};

const TENANT_CONTEXT: TenantSunatContext = {
  companyId: 'cmp-1',
  ruc: '20123456786',
  credential: {
    clientId: 'client-id',
    fingerprint: 'sha256:tenant-live',
    ruc: '20123456786',
    scope: 'sire.live-summary',
  },
};

describe('SireService.getSunatLiveSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    process.env.SIRE_API_SUMMARY_PATH_TEMPLATE =
      '/v1/summary/{ledgerType}?period={period}&ruc={ruc}';
    process.env.SIRE_API_SUMMARY_MAX_ATTEMPTS = '3';
    process.env.SIRE_API_SUMMARY_BACKOFF_BASE_MS = '1';
    process.env.SIRE_API_SUMMARY_BACKOFF_MAX_MS = '2';
    vi.mocked(buildSireConfig).mockReturnValue(BASE_CONFIG);
    vi.mocked(resolveTenantSunatContext).mockResolvedValue(TENANT_CONTEXT);
    vi.mocked(resolveAuthToken).mockResolvedValue('token-live');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: { recordCount: 1, totalAmount: 100, totalIGV: 18 },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );
  });

  afterEach(() => {
    process.env.SIRE_API_SUMMARY_PATH_TEMPLATE = ORIGINAL_TEMPLATE;
    process.env.SIRE_API_SUMMARY_MAX_ATTEMPTS = ORIGINAL_MAX_ATTEMPTS;
    process.env.SIRE_API_SUMMARY_BACKOFF_BASE_MS = ORIGINAL_BACKOFF_BASE_MS;
    process.env.SIRE_API_SUMMARY_BACKOFF_MAX_MS = ORIGINAL_BACKOFF_MAX_MS;
    vi.unstubAllGlobals();
  });

  it('returns missing_config when summary path template is not configured', async () => {
    process.env.SIRE_API_SUMMARY_PATH_TEMPLATE = '';

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('missing_config');
    }
  });

  it('returns api_mode_disabled when SIRE submission mode is not api', async () => {
    vi.mocked(buildSireConfig).mockReturnValue({
      ...BASE_CONFIG,
      mode: 'simulation',
    });

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('api_mode_disabled');
    }
  });

  it('uses resolved tenant RUC and context for live-summary token and URLs', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: { recordCount: 1, totalAmount: 100, totalIGV: 18 },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('available');
    expect(resolveTenantSunatContext).toHaveBeenCalledWith({
      companyId: 'cmp-1',
      scope: 'sire.live-summary',
      deprecatedEnvRuc: BASE_CONFIG.deprecatedCompanyRuc,
      suppliedRuc: '20100070970',
    });
    expect(resolveAuthToken).toHaveBeenCalledWith(BASE_CONFIG, TENANT_CONTEXT);
    const requestedUrls = fetchSpy.mock.calls.map(([url]) => String(url));
    expect(requestedUrls).toEqual([
      'https://sunat.example.test/v1/summary/ventas?period=2026-03&ruc=20123456786',
      'https://sunat.example.test/v1/summary/compras?period=2026-03&ruc=20123456786',
    ]);
    expect(requestedUrls.join(' ')).not.toContain(BASE_CONFIG.companyRuc);
  });

  it('rejects supplied RUC mismatch before token resolution or SUNAT fetch', async () => {
    vi.mocked(resolveTenantSunatContext).mockRejectedValue(
      new Error('SUNAT supplied RUC does not match authenticated company'),
    );
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20999999999',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('auth_unavailable');
      expect(result.message).not.toContain('client-secret');
      expect(result.message).not.toContain('sol-pass');
    }
    expect(resolveAuthToken).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns auth_unavailable when OAuth token is not available', async () => {
    vi.mocked(resolveAuthToken).mockResolvedValue('');

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('auth_unavailable');
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('returns timeout when SUNAT request exceeds timeout window', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw abortError;
      }),
    );

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('timeout');
    }
  });

  it('returns upstream_error when SUNAT responds with non-auth HTTP error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('service unavailable', {
          status: 503,
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    );

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('upstream_error');
    }
  });

  it('returns invalid_payload when SUNAT payload misses summary fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: { recordCount: 10, totalAmount: 2000 },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('invalid_payload');
    }
  });

  it('returns internal_error when request crashes unexpectedly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('socket hang up');
      }),
    );

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('internal_error');
    }
  });

  it('retries retryable upstream failures and succeeds once SUNAT recovers', async () => {
    const fetchSpy = vi
      .fn<() => Promise<Response>>()
      .mockImplementationOnce(async () =>
        new Response('too many requests', {
          status: 429,
          headers: { 'retry-after': '0', 'content-type': 'text/plain' },
        }),
      )
      .mockImplementationOnce(async () =>
        new Response('too many requests', {
          status: 429,
          headers: { 'retry-after': '0', 'content-type': 'text/plain' },
        }),
      )
      .mockImplementation(async () =>
        new Response(
          JSON.stringify({
            data: { recordCount: 1, totalAmount: 100, totalIGV: 18 },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );

    vi.stubGlobal('fetch', fetchSpy);

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('available');
    expect(fetchSpy.mock.calls.length).toBe(4);
  });

  it('does not retry non-retryable auth failures', async () => {
    const fetchSpy = vi.fn(async () =>
      new Response('unauthorized', {
        status: 401,
        headers: { 'content-type': 'text/plain' },
      }),
    );
    vi.stubGlobal('fetch', fetchSpy);

    const result = await SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    expect(result.status).toBe('unavailable');
    if (result.status === 'unavailable') {
      expect(result.reason).toBe('auth_unavailable');
    }
    expect(fetchSpy.mock.calls.length).toBe(2);
  });

  it('honors Retry-After delay for retryable 429 responses', async () => {
    vi.useFakeTimers();
    process.env.SIRE_API_SUMMARY_MAX_ATTEMPTS = '2';
    process.env.SIRE_API_SUMMARY_BACKOFF_BASE_MS = '1';
    process.env.SIRE_API_SUMMARY_BACKOFF_MAX_MS = '3000';

    const fetchSpy = vi
      .fn<() => Promise<Response>>()
      .mockImplementationOnce(async () =>
        new Response('too many requests', {
          status: 429,
          headers: { 'retry-after': '2', 'content-type': 'text/plain' },
        }),
      )
      .mockImplementationOnce(async () =>
        new Response('too many requests', {
          status: 429,
          headers: { 'retry-after': '2', 'content-type': 'text/plain' },
        }),
      )
      .mockImplementation(async () =>
        new Response(
          JSON.stringify({
            data: { recordCount: 1, totalAmount: 100, totalIGV: 18 },
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      );

    vi.stubGlobal('fetch', fetchSpy);

    const pendingResult = SireService.getSunatLiveSummary({
      companyId: 'cmp-1',
      period: '2026-03',
      ruc: '20100070970',
    });

    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchSpy.mock.calls.length).toBe(2);

    await vi.advanceTimersByTimeAsync(1_999);
    await Promise.resolve();
    expect(fetchSpy.mock.calls.length).toBe(2);

    await vi.advanceTimersByTimeAsync(1);
    const result = await pendingResult;

    expect(result.status).toBe('available');
    expect(fetchSpy.mock.calls.length).toBe(4);
    vi.useRealTimers();
  });
});

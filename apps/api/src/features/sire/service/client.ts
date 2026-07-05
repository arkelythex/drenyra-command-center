import { createLogger } from '../../../lib/logger';
import {
  buildSunatLiveRetryPolicyFromEnv,
  parseRetryAfterMs,
  resolveSunatRetryDelayMs,
} from '../services/sire-live-retry-policy.service';
import type { SIRESunatLiveLedgerSummary, SIRESunatLiveUnavailableReason } from '@drenyra/domain';
import type { SunatLiveLedgerFetchResult } from './types';

const logger = createLogger({ module: 'sire/client' });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolvePathTemplate(
  template: string,
  values: {
    companyId: string;
    period: string;
    ruc: string;
    ledgerType: 'ventas' | 'compras';
  },
): string {
  return template
    .split('{companyId}')
    .join(encodeURIComponent(values.companyId))
    .split('{period}')
    .join(encodeURIComponent(values.period))
    .split('{ruc}')
    .join(encodeURIComponent(values.ruc))
    .split('{ledgerType}')
    .join(encodeURIComponent(values.ledgerType));
}

async function readPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')?.toLowerCase() ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  return text.trim() ? text : null;
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readNumber(
  payload: Record<string, unknown> | null,
  keys: string[],
): number | undefined {
  if (!payload) {
    return undefined;
  }

  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return undefined;
}

async function fetchSunatLiveLedgerSummaryAttempt(
  ledgerType: 'ventas' | 'compras',
  endpoint: string,
  timeoutMs: number,
  authToken: string,
  attempt: number,
): Promise<
  | { ok: true; data: SIRESunatLiveLedgerSummary }
  | {
    ok: false;
    reason: Extract<
      SIRESunatLiveUnavailableReason,
      'auth_unavailable' | 'timeout' | 'upstream_error' | 'invalid_payload' | 'internal_error'
    >;
    error: string;
    retryable: boolean;
    retryAfterMs: number | null;
    attempts: number;
  }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const payload = await readPayload(response);
    if (!response.ok) {
      const isAuthError = response.status === 401 || response.status === 403;
      const isRetryableStatus =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      return {
        ok: false,
        reason: isAuthError ? 'auth_unavailable' : 'upstream_error',
        error: `${ledgerType}: HTTP ${response.status}`,
        retryable: !isAuthError && isRetryableStatus,
        retryAfterMs: parseRetryAfterMs(response.headers.get('retry-after')),
        attempts: attempt,
      };
    }

    const payloadObject = asObject(payload);
    const dataObject = asObject(payloadObject?.data);
    const source = dataObject ?? payloadObject;

    const recordCount = readNumber(source, [
      'recordCount',
      'records',
      'totalRecords',
      'cantidadRegistros',
    ]);
    const totalAmount = readNumber(source, [
      'totalAmount',
      'montoTotal',
      'importeTotal',
    ]);
    const totalIGV = readNumber(source, [
      'totalIGV',
      'igvTotal',
      'montoIGV',
      'igv',
    ]);

    if (
      recordCount === undefined ||
      totalAmount === undefined ||
      totalIGV === undefined
    ) {
      return {
        ok: false,
        reason: 'invalid_payload',
        error: `${ledgerType}: payload SUNAT sin campos de resumen esperados`,
        retryable: false,
        retryAfterMs: null,
        attempts: attempt,
      };
    }

    return {
      ok: true,
      data: {
        ledgerType,
        recordCount: Math.max(0, Math.round(recordCount)),
        totalAmount: Math.max(0, totalAmount),
        totalIGV: Math.max(0, totalIGV),
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        reason: 'timeout',
        error: `${ledgerType}: timeout SUNAT tras ${timeoutMs}ms`,
        retryable: true,
        retryAfterMs: null,
        attempts: attempt,
      };
    }
    if (error instanceof SyntaxError) {
      return {
        ok: false,
        reason: 'invalid_payload',
        error: `${ledgerType}: payload SUNAT inválido`,
        retryable: false,
        retryAfterMs: null,
        attempts: attempt,
      };
    }
    if (error instanceof TypeError) {
      return {
        ok: false,
        reason: 'upstream_error',
        error: `${ledgerType}: error de red SUNAT`,
        retryable: true,
        retryAfterMs: null,
        attempts: attempt,
      };
    }
    return {
      ok: false,
      reason: 'internal_error',
      error: `${ledgerType}: error de consulta SUNAT`,
      retryable: false,
      retryAfterMs: null,
      attempts: attempt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSunatLiveLedgerSummary(
  ledgerType: 'ventas' | 'compras',
  pathTemplate: string,
  input: { companyId: string; period: string; ruc: string },
  baseUrl: string,
  timeoutMs: number,
  authToken: string,
): Promise<SunatLiveLedgerFetchResult> {
  const endpoint = new URL(
    resolvePathTemplate(pathTemplate, {
      companyId: input.companyId,
      period: input.period,
      ruc: input.ruc,
      ledgerType,
    }),
    baseUrl,
  ).toString();
  const retryPolicy = buildSunatLiveRetryPolicyFromEnv();

  for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
    const attemptResult = await fetchSunatLiveLedgerSummaryAttempt(
      ledgerType,
      endpoint,
      timeoutMs,
      authToken,
      attempt,
    );

    if (attemptResult.ok) {
      return attemptResult;
    }

    const hasRemainingAttempts = attempt < retryPolicy.maxAttempts;
    if (!attemptResult.retryable || !hasRemainingAttempts) {
      return attemptResult;
    }

    const delayMs = resolveSunatRetryDelayMs({
      retryPolicy,
      attempt,
      retryAfterMs: attemptResult.retryAfterMs,
    });

    logger.warn(
      {
        ledgerType,
        period: input.period,
        reason: attemptResult.reason,
        error: attemptResult.error,
        attempt,
        maxAttempts: retryPolicy.maxAttempts,
        delayMs,
      },
      'Retrying SUNAT live summary ledger query',
    );

    await sleep(delayMs);
  }

  return {
    ok: false,
    reason: 'internal_error',
    error: `${ledgerType}: error de consulta SUNAT`,
    retryable: false,
    retryAfterMs: null,
    attempts: retryPolicy.maxAttempts,
  };
}

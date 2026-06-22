import { Counter, Histogram, register } from 'prom-client';
import type { LedgerMvpEndpoint } from './ledger-mvp-rollout.service';
import type { SIRESunatLiveUnavailableReason } from '../../types/sire.types';

type LedgerMvpOutcome =
  | 'success'
  | 'validation_error'
  | 'scope_error'
  | 'internal_error';
type LedgerMvpDeniedReason = 'auth' | 'allowlist' | 'role' | 'unknown';

const REQUEST_TOTAL_NAME = 'arkelythex_api_ledger_mvp_requests_total';
const REQUEST_DURATION_NAME = 'arkelythex_api_ledger_mvp_request_duration_ms';
const ACCESS_DENIED_TOTAL_NAME = 'arkelythex_api_ledger_mvp_access_denied_total';
const SUNAT_UNAVAILABLE_TOTAL_NAME =
  'arkelythex_api_ledger_mvp_sunat_live_unavailable_total';

type LedgerMvpRequestCounter = Counter<'endpoint' | 'outcome' | 'http_status'>;
type LedgerMvpRequestHistogram = Histogram<'endpoint' | 'outcome' | 'http_status'>;
type LedgerMvpDeniedCounter = Counter<'endpoint' | 'reason' | 'http_status'>;
type LedgerMvpSunatUnavailableCounter = Counter<'endpoint' | 'reason'>;

const ledgerMvpRequestsTotal = getOrCreateLedgerMvpRequestCounter();
const ledgerMvpRequestDurationMs = getOrCreateLedgerMvpRequestHistogram();
const ledgerMvpAccessDeniedTotal = getOrCreateLedgerMvpDeniedCounter();
const ledgerMvpSunatLiveUnavailableTotal =
  getOrCreateLedgerMvpSunatUnavailableCounter();

function getOrCreateLedgerMvpRequestCounter(): LedgerMvpRequestCounter {
  const existing = register.getSingleMetric(REQUEST_TOTAL_NAME);
  if (existing) {
    return existing as LedgerMvpRequestCounter;
  }

  return new Counter({
    name: REQUEST_TOTAL_NAME,
    help: 'Total Ledger MVP API requests by endpoint, outcome, and HTTP status',
    labelNames: ['endpoint', 'outcome', 'http_status'],
  });
}

function getOrCreateLedgerMvpRequestHistogram(): LedgerMvpRequestHistogram {
  const existing = register.getSingleMetric(REQUEST_DURATION_NAME);
  if (existing) {
    return existing as LedgerMvpRequestHistogram;
  }

  return new Histogram({
    name: REQUEST_DURATION_NAME,
    help: 'Ledger MVP API request latency in milliseconds by endpoint and outcome',
    labelNames: ['endpoint', 'outcome', 'http_status'],
    buckets: [50, 100, 250, 500, 1000, 2500, 5000, 10000],
  });
}

function getOrCreateLedgerMvpDeniedCounter(): LedgerMvpDeniedCounter {
  const existing = register.getSingleMetric(ACCESS_DENIED_TOTAL_NAME);
  if (existing) {
    return existing as LedgerMvpDeniedCounter;
  }

  return new Counter({
    name: ACCESS_DENIED_TOTAL_NAME,
    help: 'Total denied Ledger MVP API requests by endpoint and rejection reason',
    labelNames: ['endpoint', 'reason', 'http_status'],
  });
}

function getOrCreateLedgerMvpSunatUnavailableCounter(): LedgerMvpSunatUnavailableCounter {
  const existing = register.getSingleMetric(SUNAT_UNAVAILABLE_TOTAL_NAME);
  if (existing) {
    return existing as LedgerMvpSunatUnavailableCounter;
  }

  return new Counter({
    name: SUNAT_UNAVAILABLE_TOTAL_NAME,
    help: 'Total Ledger MVP SIRE autopilot runs with SUNAT live summary unavailable by reason',
    labelNames: ['endpoint', 'reason'],
  });
}

export function recordLedgerMvpRequestMetric(input: {
  endpoint: LedgerMvpEndpoint;
  outcome: LedgerMvpOutcome;
  httpStatus: number;
  durationMs: number;
}): void {
  const labels = {
    endpoint: input.endpoint,
    outcome: input.outcome,
    http_status: String(input.httpStatus),
  } as const;

  ledgerMvpRequestsTotal.inc(labels);
  ledgerMvpRequestDurationMs.observe(labels, input.durationMs);
}

export function recordLedgerMvpDeniedMetric(input: {
  endpoint: LedgerMvpEndpoint;
  reason: LedgerMvpDeniedReason;
  httpStatus: number;
}): void {
  ledgerMvpAccessDeniedTotal.inc({
    endpoint: input.endpoint,
    reason: input.reason,
    http_status: String(input.httpStatus),
  });
}

export function recordLedgerMvpSunatUnavailableMetric(input: {
  endpoint: Extract<LedgerMvpEndpoint, 'sire_autopilot_run'>;
  reason: SIRESunatLiveUnavailableReason;
}): void {
  ledgerMvpSunatLiveUnavailableTotal.inc({
    endpoint: input.endpoint,
    reason: input.reason,
  });
}

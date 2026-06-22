export interface SunatLiveRetryPolicy {
  maxAttempts: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
}

export function buildSunatLiveRetryPolicyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): SunatLiveRetryPolicy {
  return {
    maxAttempts: readBoundedInt(env.SIRE_API_SUMMARY_MAX_ATTEMPTS, 3, 1, 5),
    baseBackoffMs: readBoundedInt(env.SIRE_API_SUMMARY_BACKOFF_BASE_MS, 200, 10, 10_000),
    maxBackoffMs: readBoundedInt(env.SIRE_API_SUMMARY_BACKOFF_MAX_MS, 1200, 50, 30_000),
  };
}

export function resolveSunatRetryDelayMs(input: {
  retryPolicy: SunatLiveRetryPolicy;
  attempt: number;
  retryAfterMs: number | null;
  random?: () => number;
}): number {
  if (input.retryAfterMs !== null) {
    return Math.min(
      input.retryPolicy.maxBackoffMs,
      Math.max(10, input.retryAfterMs),
    );
  }

  const exponent = Math.max(0, input.attempt - 1);
  const cap = Math.min(
    input.retryPolicy.maxBackoffMs,
    input.retryPolicy.baseBackoffMs * (2 ** exponent),
  );
  const randomFn = input.random ?? Math.random;
  const randomValue = clamp01(randomFn());
  const jittered = Math.round(cap * (0.5 + randomValue * 0.5));
  return Math.max(10, jittered);
}

export function parseRetryAfterMs(
  value: string | null,
  nowMs = Date.now(),
): number | null {
  if (!value) {
    return null;
  }

  const numericSeconds = Number.parseFloat(value);
  if (Number.isFinite(numericSeconds) && numericSeconds > 0) {
    return Math.round(numericSeconds * 1000);
  }

  const retryDateMs = Date.parse(value);
  if (!Number.isNaN(retryDateMs)) {
    const delta = retryDateMs - nowMs;
    return delta > 0 ? Math.round(delta) : null;
  }

  return null;
}

function readBoundedInt(
  rawValue: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const raw = rawValue?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 1) {
    return 1;
  }
  return value;
}

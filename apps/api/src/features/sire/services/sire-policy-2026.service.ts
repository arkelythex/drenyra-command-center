const DEFAULT_POSTPONED_UNTIL = '2026-06-01';
const DEFAULT_PRICO_THRESHOLD_PEN = 3_500_000;

/**
 * SireSubmissionPolicyInput interface.
 *
 * @example
 * ```ts
 * const value: SireSubmissionPolicyInput = {} as SireSubmissionPolicyInput;
 * console.log(value);
 * ```
 */
export interface SireSubmissionPolicyInput {
  period: string;
  companyAnnualIncomePen?: number;
  isPrico?: boolean;
}

/**
 * SireSubmissionPolicyDecision interface.
 *
 * @example
 * ```ts
 * const value: SireSubmissionPolicyDecision = {} as SireSubmissionPolicyDecision;
 * console.log(value);
 * ```
 */
export interface SireSubmissionPolicyDecision {
  evaluatedAt: string;
  postponedUntil: string;
  pricoIncomeThresholdPen: number;
  appliesToCompany: boolean;
  isDeferred: boolean;
  reason: string;
  source: string;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function resolveNow(): Date {
  const forced = (process.env.SIRE_POLICY_REFERENCE_DATE ?? '').trim();
  if (!forced) return new Date();

  const parsed = new Date(forced);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

function resolvePostponedUntil(): string {
  const value = (process.env.SIRE_2026_POSTPONED_UNTIL ?? DEFAULT_POSTPONED_UNTIL).trim();
  if (!value) return DEFAULT_POSTPONED_UNTIL;
  return value;
}

/**
 * evaluateSireSubmissionPolicy operation.
 *
 * @param input - Input for input.
 * @returns Result of evaluateSireSubmissionPolicy.
 * @example
 * ```ts
 * const result = evaluateSireSubmissionPolicy({} as SireSubmissionPolicyInput);
 * console.log(result);
 * ```
 */
export function evaluateSireSubmissionPolicy(
  input: SireSubmissionPolicyInput
): SireSubmissionPolicyDecision {
  const now = resolveNow();
  const postponedUntil = resolvePostponedUntil();
  const cutoff = new Date(`${postponedUntil}T00:00:00.000Z`);
  const pricoIncomeThresholdPen = parsePositiveNumber(
    process.env.SIRE_2026_PRICO_INCOME_THRESHOLD_PEN,
    DEFAULT_PRICO_THRESHOLD_PEN
  );

  const appliesToCompany = Boolean(
    input.isPrico ||
      (typeof input.companyAnnualIncomePen === 'number' &&
        Number.isFinite(input.companyAnnualIncomePen) &&
        input.companyAnnualIncomePen >= pricoIncomeThresholdPen)
  );
  const beforeCutoff = now.getTime() < cutoff.getTime();
  const isDeferred = appliesToCompany && beforeCutoff;

  const reason = isDeferred
    ? `SIRE diferido para PRICO hasta ${postponedUntil}; usar modo simulacion/control interno mientras tanto.`
    : 'Sin postergacion activa para la empresa en la ventana evaluada.';

  return {
    evaluatedAt: now.toISOString(),
    postponedUntil,
    pricoIncomeThresholdPen,
    appliesToCompany,
    isDeferred,
    reason,
    source: 'RS 000392-2025/SUNAT + configuracion Drenyra',
  };
}

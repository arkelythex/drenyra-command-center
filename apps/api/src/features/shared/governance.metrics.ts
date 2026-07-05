import { Counter, register } from 'prom-client';
import type { GovernanceAction } from './autonomy-policy';

const METRIC_NAME = 'drenyra_api_governance_policy_decisions_total';

type GovernanceDecisionLabel = 'ALLOW' | 'BLOCK';

type GovernanceMetricCounter = Counter<
  'action' | 'decision' | 'reason_code'
>;

const governancePolicyDecisionsTotal = getOrCreateCounter();

function getOrCreateCounter(): GovernanceMetricCounter {
  const existing = register.getSingleMetric(METRIC_NAME);
  if (existing) {
    return existing as GovernanceMetricCounter;
  }

  return new Counter({
    name: METRIC_NAME,
    help: 'Total governance policy decisions (allow/block) by action and reason code',
    labelNames: ['action', 'decision', 'reason_code'],
  });
}

/**
 * recordGovernancePolicyDecisionMetric operation.
 *
 * @param input - Input for input.
 * @returns Result of recordGovernancePolicyDecisionMetric.
 * @example
 * ```ts
 * const result = recordGovernancePolicyDecisionMetric({});
 * console.log(result);
 * ```
 */
export function recordGovernancePolicyDecisionMetric(input: {
  action: GovernanceAction;
  decision: GovernanceDecisionLabel;
  reasonCode: string;
}): void {
  governancePolicyDecisionsTotal.inc({
    action: input.action,
    decision: input.decision,
    reason_code: normalizeReasonCode(input.reasonCode),
  });
}

/**
 * getGovernancePolicyDecisionMetrics operation.
 *
 * @returns Result of getGovernancePolicyDecisionMetrics.
 * @example
 * ```ts
 * const result = await getGovernancePolicyDecisionMetrics();
 * console.log(result);
 * ```
 */
export async function getGovernancePolicyDecisionMetrics(): Promise<Array<{
  action: string;
  decision: string;
  reasonCode: string;
  value: number;
}>> {
  const metric = await governancePolicyDecisionsTotal.get();
  const values = metric.values ?? [];
  return values.map((value) => ({
    action: String(value.labels?.action ?? ''),
    decision: String(value.labels?.decision ?? ''),
    reasonCode: String(value.labels?.reason_code ?? ''),
    value: value.value,
  }));
}

/**
 * getGovernancePolicyDecisionPrometheusText operation.
 *
 * @returns Result of getGovernancePolicyDecisionPrometheusText.
 * @example
 * ```ts
 * const result = await getGovernancePolicyDecisionPrometheusText();
 * console.log(result);
 * ```
 */
export async function getGovernancePolicyDecisionPrometheusText(): Promise<string> {
  return register.getSingleMetricAsString(METRIC_NAME);
}

function normalizeReasonCode(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (!normalized) return 'UNSPECIFIED';
  if (normalized.length > 64) return normalized.slice(0, 64);
  return normalized;
}

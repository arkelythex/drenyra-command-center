/**
 * PeruRuleDomain type.
 *
 * @example
 * ```ts
 * const value: PeruRuleDomain = {} as PeruRuleDomain;
 * console.log(value);
 * ```
 */
export type PeruRuleDomain =
  | 'sire'
  | 'ruc'
  | 'igv'
  | 'cpe'
  | 'detraccion'
  | 'bancarizacion'
  | 'monitoring';

/**
 * PeruRuleStatus type.
 *
 * @example
 * ```ts
 * const value: PeruRuleStatus = {} as PeruRuleStatus;
 * console.log(value);
 * ```
 */
export type PeruRuleStatus = 'active' | 'monitoring';

/**
 * PeruRuleSource interface.
 *
 * @example
 * ```ts
 * const value: PeruRuleSource = {} as PeruRuleSource;
 * console.log(value);
 * ```
 */
export interface PeruRuleSource {
  title: string;
  url: string;
}

/**
 * PeruRule2026 interface.
 *
 * @example
 * ```ts
 * const value: PeruRule2026 = {} as PeruRule2026;
 * console.log(value);
 * ```
 */
export interface PeruRule2026 {
  id: string;
  domain: PeruRuleDomain;
  status: PeruRuleStatus;
  severity: 'high' | 'medium' | 'low';
  summary: string;
  effectiveFrom: string;
  tags: string[];
  sources: PeruRuleSource[];
}

/**
 * PeruFiscalThresholds2026 interface.
 *
 * @example
 * ```ts
 * const value: PeruFiscalThresholds2026 = {} as PeruFiscalThresholds2026;
 * console.log(value);
 * ```
 */
export interface PeruFiscalThresholds2026 {
  igvRate: number;
  amountTolerancePen: number;
  detraccionMinimumPen: number;
  defaultBancarizacionMinimumPen: number;
  sireMandatoryFrom: string;
  sirePricoThresholdUit: number;
  uit2026Pen: number;
}

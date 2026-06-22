import type { InvoiceData, ValidationWarning } from '../../config/types';
import type { PeruFiscalThresholds2026, PeruRule2026 } from './types';
import { SIRE_RULES_2026 } from './sire.rules';
import { RUC_RULES_2026 } from './ruc.rules';
import { IGV_CPE_RULES_2026 } from './igv-cpe.rules';
import { PAYMENT_CONTROL_RULES_2026 } from './payment-control.rules';

const thresholdFromEnv = (name: string, fallback: number): number => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
};

/**
 * PERU_FISCAL_THRESHOLDS_2026 const.
 *
 * @example
 * ```ts
 * console.log(PERU_FISCAL_THRESHOLDS_2026);
 * ```
 */
export const PERU_FISCAL_THRESHOLDS_2026: PeruFiscalThresholds2026 = {
  igvRate: 0.18,
  amountTolerancePen: 0.02,
  detraccionMinimumPen: thresholdFromEnv('SUNAT_DETRACCION_MIN_PEN', 700),
  defaultBancarizacionMinimumPen: thresholdFromEnv('SUNAT_BANCARIZACION_MIN_PEN', 2000),
  sireMandatoryFrom: '2026-06-01',
  sirePricoThresholdUit: 2300,
  uit2026Pen: 5500,
};

/**
 * PERU_RULE_PACK_2026 const.
 *
 * @example
 * ```ts
 * console.log(PERU_RULE_PACK_2026);
 * ```
 */
export const PERU_RULE_PACK_2026: PeruRule2026[] = [
  ...SIRE_RULES_2026,
  ...RUC_RULES_2026,
  ...IGV_CPE_RULES_2026,
  ...PAYMENT_CONTROL_RULES_2026,
];

/**
 * getPeruRulePack2026 operation.
 *
 * @returns Result of getPeruRulePack2026.
 * @example
 * ```ts
 * const result = getPeruRulePack2026();
 * console.log(result);
 * ```
 */
export function getPeruRulePack2026(): {
  thresholds: PeruFiscalThresholds2026;
  rules: PeruRule2026[];
  ruleCount: number;
  activeRuleCount: number;
} {
  const activeRuleCount = PERU_RULE_PACK_2026.filter((rule) => rule.status === 'active').length;
  return {
    thresholds: PERU_FISCAL_THRESHOLDS_2026,
    rules: PERU_RULE_PACK_2026,
    ruleCount: PERU_RULE_PACK_2026.length,
    activeRuleCount,
  };
}

/**
 * buildPolicyWarnings2026 operation.
 *
 * @param invoice - Input for invoice.
 * @returns Result of buildPolicyWarnings2026.
 * @example
 * ```ts
 * const result = buildPolicyWarnings2026({} as InvoiceData);
 * console.log(result);
 * ```
 */
export function buildPolicyWarnings2026(invoice: InvoiceData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const thresholds = PERU_FISCAL_THRESHOLDS_2026;

  if (invoice.total >= thresholds.defaultBancarizacionMinimumPen) {
    warnings.push({
      field: 'total',
      code: 'BANCARIZACION_REQUIRED',
      message: `Operación sobre S/ ${thresholds.defaultBancarizacionMinimumPen}; validar medio de pago bancarizado.`,
      suggestion: 'Registrar medio de pago y número de operación bancaria.',
    });
  }

  const likelyServiceInvoice = invoice.items.some((item) => /servicio|consultor/i.test(item.descripcion));
  if (likelyServiceInvoice && invoice.total >= thresholds.detraccionMinimumPen) {
    warnings.push({
      field: 'total',
      code: 'POTENTIAL_DETRACCION_REQUIRED',
      message: `Operación de servicios sobre S/ ${thresholds.detraccionMinimumPen}; validar afectación SPOT.`,
      suggestion: 'Corroborar tipo de operación y tasa de detracción aplicable.',
    });
  }

  if (invoice.fecha >= thresholds.sireMandatoryFrom) {
    warnings.push({
      field: 'fecha',
      code: 'SIRE_PERIOD_CONTROL',
      message: 'Periodo alcanzó ventana SIRE junio 2026; confirmar propuesta RVIE/RCE antes del cierre.',
      suggestion: 'Ejecutar conciliación contra propuesta SIRE y revisar diferencias.',
    });
  }

  return warnings;
}

import { describe, expect, it } from 'vitest';
import {
  getPeruRulePack2026,
  buildPolicyWarnings2026,
} from '../../rules/peru-2026';
import type { InvoiceData } from '../../config/types';

function buildInvoice(partial?: Partial<InvoiceData>): InvoiceData {
  return {
    id: partial?.id ?? 'INV-2026-001',
    ruc: partial?.ruc ?? '20100070970',
    serie: partial?.serie ?? 'F001',
    numero: partial?.numero ?? '00000001',
    fecha: partial?.fecha ?? '2026-06-15',
    moneda: partial?.moneda ?? 'PEN',
    subtotal: partial?.subtotal ?? 1000,
    igv: partial?.igv ?? 180,
    total: partial?.total ?? 1180,
    items: partial?.items ?? [
      {
        descripcion: 'Servicio contable mensual',
        cantidad: 1,
        precioUnitario: 1000,
        subtotal: 1000,
      },
    ],
  };
}

describe('Peru fiscal rule pack 2026', () => {
  it('contains 30+ mapped rules for task 1.1', () => {
    const pack = getPeruRulePack2026();
    expect(pack.ruleCount).toBeGreaterThanOrEqual(30);
    expect(pack.activeRuleCount).toBeGreaterThanOrEqual(25);
  });

  it('keeps SIRE mandatory transition configured for June 1, 2026', () => {
    const pack = getPeruRulePack2026();
    expect(pack.thresholds.sireMandatoryFrom).toBe('2026-06-01');
    expect(pack.thresholds.sirePricoThresholdUit).toBe(2300);
  });

  it('emits policy warnings for bancarizacion, detraccion and SIRE transition', () => {
    const warnings = buildPolicyWarnings2026(buildInvoice({ total: 2400 }));
    const codes = warnings.map((warning) => warning.code);

    expect(codes).toContain('BANCARIZACION_REQUIRED');
    expect(codes).toContain('POTENTIAL_DETRACCION_REQUIRED');
    expect(codes).toContain('SIRE_PERIOD_CONTROL');
  });
});

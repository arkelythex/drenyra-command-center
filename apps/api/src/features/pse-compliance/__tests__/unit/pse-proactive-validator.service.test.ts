import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PseProactiveValidatorService } from '../../pse-proactive-validator.service';

describe('PseProactiveValidatorService', () => {
  const originalOpenRouterKey = process.env.OPENROUTER_API_KEY;
  const originalOpenRouterModel = process.env.OPENROUTER_DEFAULT_MODEL;

  beforeEach(() => {
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_DEFAULT_MODEL;
  });

  afterEach(() => {
    process.env.OPENROUTER_API_KEY = originalOpenRouterKey;
    process.env.OPENROUTER_DEFAULT_MODEL = originalOpenRouterModel;
  });

  it('returns ready when PLE/PDT/SIRE are consistent', async () => {
    const service = new PseProactiveValidatorService();
    const result = await service.validate({
      companyId: 'cmp-1',
      period: '2026-02',
      ruc: '20100070970',
      ple: {
        salesRecords: 20,
        purchaseRecords: 12,
        salesTotalPen: 1000,
        purchaseTotalPen: 500,
      },
      pdt: {
        form: '621',
        declaredIgvPen: 180,
        declaredNetSalesPen: 1000,
      },
      sire: {
        rvieRecords: 20,
        rceRecords: 12,
        accepted: true,
      },
    });

    expect(result.status).toBe('ready');
    expect(result.execution.mode).toBe('parallel-subagents');
    expect(result.checks).toHaveLength(3);
    expect(result.proactiveAlerts.length).toBeGreaterThan(0);
  });

  it('returns blocked when IGV breach is detected', async () => {
    const service = new PseProactiveValidatorService();
    const result = await service.validate({
      companyId: 'cmp-2',
      period: '2026-02',
      ruc: '20100070970',
      ple: {
        salesRecords: 10,
        purchaseRecords: 8,
        salesTotalPen: 1000,
        purchaseTotalPen: 600,
      },
      pdt: {
        form: '621',
        declaredIgvPen: 80,
        declaredNetSalesPen: 1000,
      },
      sire: {
        rvieRecords: 10,
        rceRecords: 8,
      },
    });

    expect(result.status).toBe('blocked');
    const igvCheck = result.checks.find((check) => check.subagent === 'igv-subagent');
    expect(igvCheck?.status).toBe('fail');
  });

  it('returns manual_review when SIRE proposal is missing', async () => {
    const service = new PseProactiveValidatorService();
    const result = await service.validate({
      companyId: 'cmp-3',
      period: '2026-02',
      ruc: '20100070970',
      ple: {
        salesRecords: 8,
        purchaseRecords: 4,
        salesTotalPen: 500,
        purchaseTotalPen: 250,
      },
      pdt: {
        form: '621',
        declaredIgvPen: 90,
        declaredNetSalesPen: 500,
      },
    });

    expect(result.status).toBe('manual_review');
    const rceCheck = result.checks.find((check) => check.subagent === 'rce-subagent');
    expect(rceCheck?.status).toBe('warn');
    expect(result.proactiveAlerts.some((alert) => alert.level === 'warning')).toBe(true);
  });

  it('returns deterministic fallback alerts when OpenRouter is not configured', async () => {
    const service = new PseProactiveValidatorService();
    const result = await service.validate({
      companyId: 'cmp-4',
      period: '2026-02',
      ruc: '20100070970',
      ple: {
        salesRecords: 10,
        purchaseRecords: 8,
        salesTotalPen: 1000,
        purchaseTotalPen: 500,
      },
      pdt: {
        form: '621',
        declaredIgvPen: 80,
        declaredNetSalesPen: 1000,
      },
      sire: {
        rvieRecords: 10,
        rceRecords: 8,
      },
    });

    expect(result.status).toBe('blocked');
    expect(result.proactiveAlerts.length).toBeGreaterThan(0);
    expect(result.proactiveAlerts.some((alert) => alert.level === 'critical')).toBe(
      true,
    );
  });
});

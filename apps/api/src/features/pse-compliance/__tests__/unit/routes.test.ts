import { describe, expect, it } from 'vitest';
import { Elysia } from 'elysia';
import { pseComplianceRoutes } from '../../index';

describe('pseComplianceRoutes', () => {
  it('validates payload and returns proactive result', async () => {
    const app = new Elysia().use(pseComplianceRoutes);

    const response = await app.handle(
      new Request('http://localhost/api/pse-compliance/validate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyId: 'cmp-1',
          period: '2026-02',
          ruc: '20100070970',
          ple: {
            salesRecords: 2,
            purchaseRecords: 1,
            salesTotalPen: 100,
            purchaseTotalPen: 50,
          },
          pdt: {
            form: '621',
            declaredIgvPen: 18,
            declaredNetSalesPen: 100,
          },
          sire: {
            rvieRecords: 2,
            rceRecords: 1,
            accepted: true,
          },
        }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      data: {
        status: 'ready',
        execution: {
          mode: 'parallel-subagents',
        },
      },
    });
  });
});

import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import {
  db,
  businessPartners,
  companies,
  eq,
  invoices,
  transactions,
  users,
} from '@arkelythex/infrastructure';
import { SIRE_LEDGER_REPRO_RUNBOOK } from '../../../lib/compliance-runbooks';
import { ComplianceService } from '../../compliance.service';

const describeDb = process.env.RUN_DB_TESTS === '1' ? describe : describe.skip;

type Fixture = {
  userId: string;
  companyId: string;
  customerId: string;
};

describeDb('ComplianceService.verifySireReproducibility (integration)', () => {
  const fixtures: Fixture[] = [];

  afterEach(async () => {
    for (const fixture of fixtures.splice(0)) {
      await db.delete(invoices).where(eq(invoices.companyId, fixture.companyId));
      await db.delete(transactions).where(eq(transactions.companyId, fixture.companyId));
      await db.delete(businessPartners).where(eq(businessPartners.companyId, fixture.companyId));
      await db.delete(companies).where(eq(companies.id, fixture.companyId));
      await db.delete(users).where(eq(users.id, fixture.userId));
    }
  });

  it('returns reproducible=true with COMPLETE_DATA when SIRE and ledger totals match', async () => {
    const fixture = await createFixture();

    const issueDate = new Date('2026-02-15T10:00:00.000Z');

    await db.insert(invoices).values({
      id: randomUUID(),
      companyId: fixture.companyId,
      customerId: fixture.customerId,
      invoiceNumber: 'F001-00000001',
      series: 'F001',
      correlative: 1,
      issueDate,
      dueDate: new Date('2026-03-15T10:00:00.000Z'),
      currency: 'PEN',
      exchangeRate: '1.0000',
      subtotal: '100.00',
      igvAmount: '18.00',
      totalAmount: '118.00',
      status: 'SENT',
      sunatStatus: 'ACCEPTED',
      balanceDue: '118.00',
      paidAmount: '0.00',
    });

    await db.insert(transactions).values({
      id: randomUUID(),
      companyId: fixture.companyId,
      type: 'INCOME',
      documentType: 'FACTURA',
      series: 'F001',
      number: '1',
      issueDate,
      currency: 'PEN',
      exchangeRate: '1.000',
      subtotal: '100.00',
      igvAmount: '18.00',
      totalAmount: '118.00',
      status: 'ACCEPTED',
    });

    const report = await ComplianceService.verifySireReproducibility({
      companyId: fixture.companyId,
      year: 2026,
      month: 2,
    });

    expect(report.reproducible).toBe(true);
    expect(report.coverage).toBe('COMPLETE_DATA');
    expect(report.runbookId).toBeUndefined();
    expect(report.differences).toEqual({
      recordCount: 0,
      totalAmount: 0,
      totalIGV: 0,
    });
  });

  it('returns reproducible=false with PARTIAL_DATA and runbook when only SIRE side has records', async () => {
    const fixture = await createFixture();

    await db.insert(invoices).values({
      id: randomUUID(),
      companyId: fixture.companyId,
      customerId: fixture.customerId,
      invoiceNumber: 'F001-00000002',
      series: 'F001',
      correlative: 2,
      issueDate: new Date('2026-02-20T10:00:00.000Z'),
      dueDate: new Date('2026-03-20T10:00:00.000Z'),
      currency: 'PEN',
      exchangeRate: '1.0000',
      subtotal: '200.00',
      igvAmount: '36.00',
      totalAmount: '236.00',
      status: 'SENT',
      sunatStatus: 'ACCEPTED',
      balanceDue: '236.00',
      paidAmount: '0.00',
    });

    const report = await ComplianceService.verifySireReproducibility({
      companyId: fixture.companyId,
      year: 2026,
      month: 2,
    });

    expect(report.reproducible).toBe(false);
    expect(report.coverage).toBe('PARTIAL_DATA');
    expect(report.runbookId).toBe(SIRE_LEDGER_REPRO_RUNBOOK.id);
    expect(report.differences.recordCount).toBe(1);
    expect(report.differences.totalAmount).toBe(236);
    expect(report.differences.totalIGV).toBe(36);
  });

  it('returns NO_DATA for periods without records', async () => {
    const fixture = await createFixture();

    const report = await ComplianceService.verifySireReproducibility({
      companyId: fixture.companyId,
      year: 2026,
      month: 4,
    });

    expect(report.reproducible).toBe(true);
    expect(report.coverage).toBe('NO_DATA');
    expect(report.runbookId).toBeUndefined();
    expect(report.sire.recordCount).toBe(0);
    expect(report.ledger.recordCount).toBe(0);
  });
});

async function createFixture(): Promise<Fixture> {
  const userId = randomUUID();
  const companyId = randomUUID();
  const customerId = randomUUID();
  const unique = randomUUID().replace(/-/g, '').slice(0, 9);

  await db.insert(users).values({
    id: userId,
    email: `integration-${userId}@arkalythix.local`,
    password: 'integration-password',
    name: 'Integration Owner',
    role: 'ADMIN',
    isActive: true,
  });

  await db.insert(companies).values({
    id: companyId,
    ownerId: userId,
    ruc: `20${unique}`,
    businessName: `Integration Company ${companyId.slice(0, 8)}`,
    tradeName: 'Integration',
    isActive: true,
  });

  await db.insert(businessPartners).values({
    id: customerId,
    companyId,
    taxId: '20123456789',
    legalName: 'Integration Customer SAC',
  });

  return { userId, companyId, customerId };
}

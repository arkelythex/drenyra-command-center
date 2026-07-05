import { beforeEach, describe, expect, it, vi } from 'vitest';

const findManyMock = vi.fn();

vi.mock('@drenyra/persistence/client', () => ({
  db: {
    query: {
      bankTransactions: {
        findMany: findManyMock,
      },
    },
  },
}));

vi.mock('@drenyra/persistence/schema', () => ({
  bankTransactions: {
    companyId: 'company_id',
    transactionDate: 'transaction_date',
  },
}));

vi.mock('@drenyra/persistence/query', () => ({
  and: (...conditions: unknown[]) => conditions,
  eq: (column: unknown, value: unknown) => ({ column, value }),
  gte: (column: unknown, value: unknown) => ({ column, value, op: '>=' }),
  lte: (column: unknown, value: unknown) => ({ column, value, op: '<=' }),
}));

const { AirlineTicketReportService } = await import(
  '../../application/services/airline-ticket-report.service'
);

describe('AirlineTicketReportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only transactions matching airline-ticket patterns', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'tx-1',
        transactionDate: '2026-02-03',
        description: 'PAGO LATAM AIRLINES',
        amount: '480.50',
        type: 'DEBIT',
        reference: 'LAT-001',
      },
      {
        id: 'tx-2',
        transactionDate: '2026-02-04',
        description: 'PAGO SERVICIO INTERNET',
        amount: '120.00',
        type: 'DEBIT',
        reference: null,
      },
      {
        id: 'tx-3',
        transactionDate: '2026-02-05',
        description: 'BOLETO AEREO SKY EMPRESAS',
        amount: '220.30',
        type: 'DEBIT',
        reference: 'SKY-02',
      },
    ]);

    const service = new AirlineTicketReportService();
    const result = await service.generate({
      companyId: 'cmp-1',
      period: '2026-02',
    });

    expect(result.totalTickets).toBe(2);
    expect(result.totalAmountPen).toBe(700.8);
    expect(result.items.map((item) => item.transactionId)).toEqual(['tx-1', 'tx-3']);
    expect(result.monitoringRuleId).toBe('PAY-008');
  });

  it('applies minAmountPen filter', async () => {
    findManyMock.mockResolvedValue([
      {
        id: 'tx-10',
        transactionDate: '2026-02-10',
        description: 'BOLETO AEREO JETSMART',
        amount: '150.00',
        type: 'DEBIT',
        reference: null,
      },
      {
        id: 'tx-11',
        transactionDate: '2026-02-11',
        description: 'BOLETO AEREO LATAM',
        amount: '450.00',
        type: 'DEBIT',
        reference: null,
      },
    ]);

    const service = new AirlineTicketReportService();
    const result = await service.generate({
      companyId: 'cmp-1',
      period: '2026-02',
      minAmountPen: 200,
    });

    expect(result.totalTickets).toBe(1);
    expect(result.items[0]?.transactionId).toBe('tx-11');
  });
});

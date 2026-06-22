import { db } from '@arkelythex/persistence/client';
import { and, eq, gte, lte } from '@arkelythex/persistence/query';
import { bankTransactions } from '@arkelythex/persistence/schema';

/**
 * AirlineTicketReportQuery interface.
 *
 * @example
 * ```ts
 * const value: AirlineTicketReportQuery = {} as AirlineTicketReportQuery;
 * console.log(value);
 * ```
 */
export interface AirlineTicketReportQuery {
  companyId: string;
  period: string; // YYYY-MM
  minAmountPen?: number;
}

interface AirlineTicketRow {
  id: string;
  transactionDate: string;
  description: string | null;
  amount: string;
  type: 'DEBIT' | 'CREDIT';
  reference: string | null;
}

const AIRLINE_PATTERNS = [
  /\bLATAM\b/i,
  /\bJETSMART\b/i,
  /\bSKY\b/i,
  /\bAEROLINEA\b/i,
  /\bAIRLINE\b/i,
  /\bBOLETO(?:S)? AEREO(?:S)?\b/i,
  /\bTICKET(?:S)? AEREO(?:S)?\b/i,
];

function toDecimal(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePeriodRange(period: string): { start: string; end: string } {
  const [yearText, monthText] = period.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function isAirlineTicket(description: string | null): boolean {
  if (!description) return false;
  return AIRLINE_PATTERNS.some((pattern) => pattern.test(description));
}

/**
 * AirlineTicketReportService class.
 *
 * @example
 * ```ts
 * const value = new AirlineTicketReportService();
 * console.log(value);
 * ```
 */
export class AirlineTicketReportService {
  async generate(query: AirlineTicketReportQuery): Promise<{
    companyId: string;
    period: string;
    generatedAt: string;
    monitoringRuleId: string;
    source: string;
    totalTickets: number;
    totalAmountPen: number;
    minAmountPen: number;
    items: Array<{
      transactionId: string;
      date: string;
      description: string;
      reference: string | null;
      type: 'DEBIT' | 'CREDIT';
      amountPen: number;
    }>;
  }> {
    const minAmountPen = query.minAmountPen ?? 0;
    const range = resolvePeriodRange(query.period);

    const rows = await db.query.bankTransactions.findMany({
      where: and(
        eq(bankTransactions.companyId, query.companyId),
        gte(bankTransactions.transactionDate, range.start),
        lte(bankTransactions.transactionDate, range.end)
      ),
      columns: {
        id: true,
        transactionDate: true,
        description: true,
        amount: true,
        type: true,
        reference: true,
      },
      limit: 500,
    }) as unknown as AirlineTicketRow[];

    const items = rows
      .filter((row) => isAirlineTicket(row.description))
      .map((row) => ({
        transactionId: row.id,
        date: row.transactionDate,
        description: row.description ?? '',
        reference: row.reference,
        type: row.type,
        amountPen: Number(toDecimal(row.amount).toFixed(2)),
      }))
      .filter((row) => row.amountPen >= minAmountPen);

    const totalAmountPen = Number(
      items.reduce((sum, row) => sum + row.amountPen, 0).toFixed(2)
    );

    return {
      companyId: query.companyId,
      period: query.period,
      generatedAt: new Date().toISOString(),
      monitoringRuleId: 'PAY-008',
      source: 'SUNAT Proyecto RS 000002-2026 (boletos aereos)',
      totalTickets: items.length,
      totalAmountPen,
      minAmountPen,
      items,
    };
  }
}

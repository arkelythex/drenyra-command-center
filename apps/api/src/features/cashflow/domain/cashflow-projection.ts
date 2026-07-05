/**
 * Cashflow Projection - Domain Entity
 *
 * Represents projected cash inflows and outflows for a period.
 *
 * @module cashflow/domain
 */

import { Money, type Currency } from '@drenyra/domain';

/**
 * Cash flow item (invoice or bill)
 *
 * @example
 * ```ts
 * const item: CashflowItem = {
 *   id: 'doc_1',
 *   type: 'inflow',
 *   documentType: 'invoice',
 *   reference: 'F001-1',
 *   amount: Money.fromAmount(100, 'PEN'),
 *   dueDate: new Date(),
 *   status: 'pending',
 *   customerOrVendor: 'Cliente SAC',
 * };
 * ```
 */
export interface CashflowItem {
  id: string;
  type: 'inflow' | 'outflow';
  /** 'retention' items are SUNAT withholding obligations split from bill outflows */
  documentType: 'invoice' | 'bill' | 'retention';
  reference: string;
  amount: Money;
  dueDate: Date;
  status: 'pending' | 'overdue' | 'paid';
  customerOrVendor: string;
}

/**
 * Cashflow Projection Entity
 *
 * Aggregates expected inflows and outflows
 *
 * @example
 * ```ts
 * const projection = new CashflowProjection(
 *   'cmp_1',
 *   new Date(),
 *   new Date(),
 *   'PEN',
 *   [],
 *   [],
 * );
 * ```
 */
export class CashflowProjection {
  constructor(
    public readonly companyId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly currency: Currency,
    public readonly inflows: CashflowItem[],
    public readonly outflows: CashflowItem[]
  ) {}

  /**
   * Calculate total expected inflows
   */
  get totalInflows(): Money {
    return this.inflows.reduce(
      (sum, item) => sum.add(item.amount),
      Money.fromAmount(0, this.currency)
    );
  }

  /**
   * Calculate total expected outflows
   */
  get totalOutflows(): Money {
    return this.outflows.reduce(
      (sum, item) => sum.add(item.amount),
      Money.fromAmount(0, this.currency)
    );
  }

  /**
   * Calculate net cash flow
   */
  get netCashflow(): Money {
    return toSignedMoney(this.totalInflows, this.totalOutflows, this.currency);
  }

  /**
   * Check if net cash flow is negative
   */
  get isDeficit(): boolean {
    return this.netCashflow.getAmount() < 0;
  }

  /**
   * Get overdue items (past due date)
   */
  get overdueItems(): CashflowItem[] {
    const now = new Date();
    return [...this.inflows, ...this.outflows].filter(
      (item) => item.status === 'overdue' && item.dueDate < now
    );
  }

  /**
   * Get items due within N days
   */
  getItemsDueWithin(days: number): CashflowItem[] {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);

    return [...this.inflows, ...this.outflows].filter(
      (item) =>
        item.status === 'pending' &&
        item.dueDate >= new Date() &&
        item.dueDate <= targetDate
    );
  }

  /**
   * Group items by week
   */
  getWeeklyBreakdown(): Array<{
    weekStart: Date;
    weekEnd: Date;
    inflows: Money;
    outflows: Money;
    netCashflow: Money;
  }> {
    const weeks: Map<
      string,
      { inflows: Money; outflows: Money; weekStart: Date; weekEnd: Date }
    > = new Map();

    const processItems = (items: CashflowItem[], type: 'inflow' | 'outflow') => {
      for (const item of items) {
        const weekStart = this.getWeekStart(item.dueDate);
        const weekKey = weekStart.toISOString();

        if (!weeks.has(weekKey)) {
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);

          weeks.set(weekKey, {
            weekStart,
            weekEnd,
            inflows: Money.fromAmount(0, this.currency),
            outflows: Money.fromAmount(0, this.currency),
          });
        }

        const week = weeks.get(weekKey)!;
        if (type === 'inflow') {
          week.inflows = week.inflows.add(item.amount);
        } else {
          week.outflows = week.outflows.add(item.amount);
        }
      }
    };

    processItems(this.inflows, 'inflow');
    processItems(this.outflows, 'outflow');

    return Array.from(weeks.values())
      .map((week) => ({
        ...week,
        netCashflow: toSignedMoney(week.inflows, week.outflows, this.currency),
      }))
      .sort((a, b) => a.weekStart.getTime() - b.weekStart.getTime());
  }

  /**
   * Get week start date (Monday)
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON() {
    return {
      companyId: this.companyId,
      period: {
        startDate: this.startDate,
        endDate: this.endDate,
      },
      currency: this.currency,
      summary: {
        totalInflows: this.totalInflows.getAmount(),
        totalOutflows: this.totalOutflows.getAmount(),
        netCashflow: this.netCashflow.getAmount(),
        isDeficit: this.isDeficit,
      },
      inflows: this.inflows.map((i) => ({
        ...i,
        amount: i.amount.getAmount(),
      })),
      outflows: this.outflows.map((o) => ({
        ...o,
        amount: o.amount.getAmount(),
      })),
      overdueItems: this.overdueItems.length,
      weeklyBreakdown: this.getWeeklyBreakdown().map((week) => ({
        ...week,
        inflows: week.inflows.getAmount(),
        outflows: week.outflows.getAmount(),
        netCashflow: week.netCashflow.getAmount(),
      })),
    };
  }
}

function toSignedMoney(inflows: Money, outflows: Money, currency: Currency): Money {
  return Money.fromCents(inflows.getCents() - outflows.getCents(), currency);
}

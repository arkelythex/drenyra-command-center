/**
 * Cashflow Projection Tests
 *
 * @module cashflow/__tests__
 */

import { describe, it, expect } from 'vitest';
import { CashflowProjection, type CashflowItem } from '../../domain/cashflow-projection';
import { Money } from '@drenyra/domain';

describe('CashflowProjection', () => {
  const companyId = 'company-1';
  const startDate = new Date('2026-02-01');
  const endDate = new Date('2026-02-28');
  const currency = 'PEN' as const;

  const createInflow = (amount: number, dueDate: Date, status: CashflowItem['status'] = 'pending'): CashflowItem => ({
    id: `inflow-${amount}`,
    type: 'inflow',
    documentType: 'invoice',
    reference: 'F001-001',
    amount: Money.fromAmount(amount, currency),
    dueDate,
    status,
    customerOrVendor: 'Customer A',
  });

  const createOutflow = (amount: number, dueDate: Date, status: CashflowItem['status'] = 'pending'): CashflowItem => ({
    id: `outflow-${amount}`,
    type: 'outflow',
    documentType: 'bill',
    reference: 'B001-001',
    amount: Money.fromAmount(amount, currency),
    dueDate,
    status,
    customerOrVendor: 'Vendor A',
  });

  describe('totals', () => {
    it('should calculate total inflows', () => {
      const inflows = [
        createInflow(1000, new Date('2026-02-10')),
        createInflow(2000, new Date('2026-02-15')),
      ];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        []
      );

      expect(projection.totalInflows.getAmount()).toBe(3000);
    });

    it('should calculate total outflows', () => {
      const outflows = [
        createOutflow(500, new Date('2026-02-10')),
        createOutflow(700, new Date('2026-02-15')),
      ];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        [],
        outflows
      );

      expect(projection.totalOutflows.getAmount()).toBe(1200);
    });

    it('should calculate net cashflow', () => {
      const inflows = [createInflow(3000, new Date('2026-02-10'))];
      const outflows = [createOutflow(1200, new Date('2026-02-15'))];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        outflows
      );

      expect(projection.netCashflow.getAmount()).toBe(1800);
    });

    it('should detect deficit', () => {
      const inflows = [createInflow(1000, new Date('2026-02-10'))];
      const outflows = [createOutflow(2000, new Date('2026-02-15'))];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        outflows
      );

      expect(projection.isDeficit).toBe(true);
      expect(projection.netCashflow.getAmount()).toBe(-1000);
    });
  });

  describe('overdue items', () => {
    it('should identify overdue items', () => {
      const pastDate = new Date('2026-01-01');

      const inflows = [
        createInflow(1000, pastDate, 'overdue'),
        createInflow(2000, new Date('2026-02-15'), 'pending'),
      ];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        []
      );

      expect(projection.overdueItems.length).toBe(1);
      expect(projection.overdueItems[0].amount.getAmount()).toBe(1000);
    });
  });

  describe('items due within period', () => {
    it('should get items due within 7 days', () => {
      const today = new Date();
      const in5Days = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);
      const in10Days = new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000);

      const inflows = [
        createInflow(1000, in5Days, 'pending'),
        createInflow(2000, in10Days, 'pending'),
      ];

      const projection = new CashflowProjection(
        companyId,
        today,
        new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        currency,
        inflows,
        []
      );

      const dueIn7Days = projection.getItemsDueWithin(7);

      expect(dueIn7Days.length).toBe(1);
      expect(dueIn7Days[0].amount.getAmount()).toBe(1000);
    });
  });

  describe('weekly breakdown', () => {
    it('should group items by week', () => {
      const week1 = new Date('2026-02-03'); // Monday
      const week2 = new Date('2026-02-10'); // Monday

      const inflows = [
        createInflow(1000, week1),
        createInflow(2000, week2),
      ];

      const outflows = [
        createOutflow(500, week1),
        createOutflow(700, week2),
      ];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        outflows
      );

      const weekly = projection.getWeeklyBreakdown();

      expect(weekly.length).toBe(2);
      expect(weekly[0].inflows.getAmount()).toBe(1000);
      expect(weekly[0].outflows.getAmount()).toBe(500);
      expect(weekly[0].netCashflow.getAmount()).toBe(500);
    });
  });

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const inflows = [createInflow(1000, new Date('2026-02-10'))];
      const outflows = [createOutflow(500, new Date('2026-02-15'))];

      const projection = new CashflowProjection(
        companyId,
        startDate,
        endDate,
        currency,
        inflows,
        outflows
      );

      const json = projection.toJSON();

      expect(json.companyId).toBe(companyId);
      expect(json.summary.totalInflows).toBe(1000);
      expect(json.summary.totalOutflows).toBe(500);
      expect(json.summary.netCashflow).toBe(500);
      expect(json.summary.isDeficit).toBe(false);
    });
  });
});

import type { DashboardExpensesResponse } from '../../../api/dashboard.api';

export const SUPPRESSIBLE_HTTP_STATUSES = new Set([404, 405, 501]);

export const CATEGORY_BAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--info))',
  'hsl(var(--status-success))',
  'hsl(var(--status-risk))',
  'hsl(var(--muted-foreground))',
] as const;

export const EXPENSES_FALLBACK: DashboardExpensesResponse = {
  budgetExecution: {
    totalExpenses: 110_000,
    totalIgv: 19_800,
    billCount: 46,
    currency: 'PEN',
  },
  paymentCompliance: 98.5,
  expenseByCategory: [
    { category: 'Servicios', total: 45_000, count: 18, percentage: 40.9 },
    { category: 'Compras', total: 32_000, count: 12, percentage: 29.1 },
    { category: 'Personal', total: 28_000, count: 9, percentage: 25.5 },
    { category: 'Gestión', total: 5_000, count: 7, percentage: 4.5 },
  ],
  topVendors: [
    { vendorId: 'fallback-1', vendorName: 'AWS Cloud Services', ruc: '20600000001', total: 12_500, billCount: 5 },
    { vendorId: 'fallback-2', vendorName: 'Proveedores S.A.C.', ruc: '20100000000', total: 15_400, billCount: 4 },
    { vendorId: 'fallback-3', vendorName: 'Oficina Real Estate', ruc: '20555555555', total: 8_000, billCount: 2 },
  ],
};

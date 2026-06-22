import type { DashboardExpensesResponse } from '../../../api/dashboard.api';

export type ExpensesQueryResult = {
  payload: DashboardExpensesResponse;
  source: 'live' | 'fallback' | 'mock';
};

export type ExpenseTooltipPayload = {
  payload: {
    category: string;
    total: number;
    count: number;
    percentage: number;
  };
};

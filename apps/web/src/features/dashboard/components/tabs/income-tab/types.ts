import type { DashboardIncomeResponse } from '../../../api/dashboard.api';

export type IncomeTrendPoint = DashboardIncomeResponse['billingEvolution'][number] & {
  avg3: number;
  changePct: number | null;
};

export type IncomeTooltipPayload = {
  payload: IncomeTrendPoint;
};

export type IncomeQueryResult = {
  payload: DashboardIncomeResponse;
  source: 'live' | 'fallback' | 'mock';
};

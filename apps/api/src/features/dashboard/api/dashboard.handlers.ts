import { OverviewService } from '../application/services/overview.service';
import { ExpenseAnalyticsService } from '../application/services/expense-analytics.service';
import { IncomeAnalyticsService } from '../application/services/income-analytics.service';
import { FiscalIndicatorsService } from '../application/services/fiscal-indicators.service';
import { fail, getErrorMessage, ok } from '../../shared/api-response';

interface OverviewQuery { companyId: string; currency?: 'PEN' | 'USD' }
interface DateRangeQuery { companyId: string; startDate?: string; endDate?: string; currency?: 'PEN' | 'USD' }
interface LiquidityQuery { companyId: string; months?: number }
interface TaxCalendarQuery { companyId: string; month?: number; year?: number }
interface SireStatusQuery { companyId: string; period?: string }
type Ctx<Q> = { query: Q; set: { status?: number | string } };

/**
 * dashboardHandlers const.
 *
 * @example
 * ```ts
 * console.log(dashboardHandlers);
 * ```
 */
export const dashboardHandlers = {
	getSystemStatus: async () => {
		return ok(await OverviewService.getSystemStatus());
	},

	getFiscalIndicators: async () => {
		return ok(await FiscalIndicatorsService.getIndicators());
	},

	getOverview: async ({ query, set }: Ctx<OverviewQuery>) => {
		const { companyId } = query;
		try {
			const [systemStatus, processedDocs, liquidity] = await Promise.all([
				OverviewService.getSystemStatus(),
				OverviewService.getProcessedDocuments(companyId),
				OverviewService.getLiquidity(companyId, 6),
			]);
			return ok({ systemStatus, processedDocs, liquidity });
		} catch (error) {
			set.status = 500;
			return fail('Failed to get overview', 'OVERVIEW_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},

	getLiquidity: async ({ query, set }: Ctx<LiquidityQuery>) => {
		const { companyId, months } = query;
		try {
			return ok(await OverviewService.getLiquidity(companyId, Number(months) || 12));
		} catch (error) {
			set.status = 500;
			return fail('Failed to get liquidity', 'LIQUIDITY_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},

	getTaxCalendar: async ({ query, set }: Ctx<TaxCalendarQuery>) => {
		const { companyId, month, year } = query;
		try {
			return ok(await FiscalIndicatorsService.getTaxCalendar(
				companyId,
				month ? Number(month) : undefined,
				year ? Number(year) : undefined,
			));
		} catch (error) {
			set.status = 500;
			return fail('Failed to get tax calendar', 'TAX_CALENDAR_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},

	getSireStatus: async ({ query, set }: Ctx<SireStatusQuery>) => {
		const { companyId, period } = query;
		try {
			return ok(await FiscalIndicatorsService.getSireStatus(companyId, period));
		} catch (error) {
			set.status = 500;
			return fail('Failed to get SIRE status', 'SIRE_STATUS_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},

	getExpenses: async ({ query, set }: Ctx<DateRangeQuery>) => {
		const { companyId, startDate, endDate } = query;
		try {
			return ok(await ExpenseAnalyticsService.getExpenses(
				companyId,
				startDate ? new Date(startDate) : undefined,
				endDate ? new Date(endDate) : undefined,
			));
		} catch (error) {
			set.status = 500;
			return fail('Failed to get expenses', 'EXPENSES_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},

	getIncome: async ({ query, set }: Ctx<DateRangeQuery>) => {
		const { companyId, startDate, endDate } = query;
		try {
			return ok(await IncomeAnalyticsService.getIncome(
				companyId,
				startDate ? new Date(startDate) : undefined,
				endDate ? new Date(endDate) : undefined,
			));
		} catch (error) {
			set.status = 500;
			return fail('Failed to get income', 'INCOME_ERROR', { details: getErrorMessage(error, 'Unknown') });
		}
	},
};

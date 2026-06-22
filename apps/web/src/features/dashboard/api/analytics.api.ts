import { n } from "@/lib/utils";
import {
	type DashboardFiscalIndicatorsResponse,
	dashboardApi,
} from "./dashboard.api";

type CurrencyCode = "PEN" | "USD";

type MoneyValue = {
	amount: string;
	currency: CurrencyCode;
	formatted?: string;
};

export type DashboardAnalytics = {
	financial: {
		monthlyRevenue: MoneyValue;
		outstandingAmount: MoneyValue;
		monthOverMonthGrowth: number;
	};
	compliance: {
		complianceScore: number;
	};
	__source?: "live" | "fallback";
};

interface DashboardFilters {
	companyId: string;
	currency?: CurrencyCode;
}

function formatMoneyValue(amount: number, currency: CurrencyCode): MoneyValue {
	const normalizedAmount = Number.isFinite(amount) ? amount : 0;
	return {
		amount: normalizedAmount.toFixed(2),
		currency,
		formatted: n(normalizedAmount, currency),
	};
}

export const DASHBOARD_ANALYTICS_FALLBACK: DashboardAnalytics = {
	financial: {
		monthlyRevenue: { amount: "0.00", currency: "PEN", formatted: "S/ 0.00" },
		outstandingAmount: {
			amount: "0.00",
			currency: "PEN",
			formatted: "S/ 0.00",
		},
		monthOverMonthGrowth: 0,
	},
	compliance: {
		complianceScore: 0,
	},
	__source: "fallback",
};

export const analyticsApi = {
	/**
	 * Obtener Dashboard completo (Financiero, Operativo, Tax)
	 */
	getDashboard: async (
		filters: DashboardFilters,
	): Promise<DashboardAnalytics> => {
		const currency = filters.currency ?? "PEN";
		const [incomeResult, summaryResult] = await Promise.all([
			dashboardApi.getIncome(filters.companyId),
			dashboardApi.getSummary(filters.companyId),
		]);

		if (!incomeResult.ok) throw new Error(incomeResult.error);
		if (!summaryResult.ok) throw new Error(summaryResult.error);

		const income = incomeResult.data;
		const summary = summaryResult.data;

		const complianceScore = Math.max(
			0,
			Math.min(100, Number(summary.status.matchRate.toFixed(1))),
		);

		return {
			financial: {
				monthlyRevenue: formatMoneyValue(income.totalBilled, currency),
				outstandingAmount: formatMoneyValue(
					income.pending + income.overdue,
					currency,
				),
				monthOverMonthGrowth:
					income.billingEvolution.length >= 2
						? Number(
								(((income.billingEvolution.at(-1)?.total ?? 0) -
									(income.billingEvolution.at(-2)?.total ?? 0)) /
									Math.max(income.billingEvolution.at(-2)?.total ?? 0, 1)) *
									100,
							)
						: 0,
			},
			compliance: {
				complianceScore,
			},
			__source: "live",
		};
	},

	/**
	 * Obtener indicadores fiscales con fallback local mientras se expone la integración remota.
	 */
	getFiscalIndicators: async (): Promise<DashboardFiscalIndicatorsResponse> => {
		const result = await dashboardApi.getFiscalIndicators();
		if (!result.ok) throw new Error(result.error);
		return result.data;
	},
};

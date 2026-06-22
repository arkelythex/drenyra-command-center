import { useQuery } from "@tanstack/react-query";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	DASHBOARD_ANALYTICS_FALLBACK,
	type DashboardAnalytics,
} from "../api/analytics.api";
import { dashboardOverviewQueryOptions } from "../dashboard.query-options";

interface DashboardHealthAdapter {
	complianceScore: number;
	level: "Excelente" | "Regular";
	risks: string[];
}

interface DashboardFinancialsAdapter {
	revenue: string;
	growth: number;
	outstanding: string;
}

export interface UseDashboardDataResult {
	raw: DashboardAnalytics | undefined;
	health: DashboardHealthAdapter;
	financials: DashboardFinancialsAdapter;
	lastUpdatedAt: number;
	isLoading: boolean;
	error: Error | null;
}

export function useDashboardData(): UseDashboardDataResult {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	const {
		data: dashboard,
		isLoading,
		error,
		dataUpdatedAt,
	} = useQuery(dashboardOverviewQueryOptions(companyId));

	const analytics = dashboard ?? DASHBOARD_ANALYTICS_FALLBACK;

	const healthAdapter: DashboardHealthAdapter = {
		complianceScore: analytics.compliance.complianceScore,
		level: analytics.compliance.complianceScore > 90 ? "Excelente" : "Regular",
		risks: [],
	};

	const financialsAdapter: DashboardFinancialsAdapter = {
		revenue: analytics.financial.monthlyRevenue.amount || "0",
		growth: analytics.financial.monthOverMonthGrowth || 0,
		outstanding: analytics.financial.outstandingAmount.amount || "0",
	};

	return {
		raw: dashboard,
		health: healthAdapter,
		financials: financialsAdapter,
		lastUpdatedAt: dataUpdatedAt,
		isLoading,
		error: error as Error | null,
	};
}

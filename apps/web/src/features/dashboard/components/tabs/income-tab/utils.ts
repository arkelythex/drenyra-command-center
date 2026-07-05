import type { DashboardIncomeResponse } from "../../../api/dashboard.api";
import type { IncomeTrendPoint } from "./types";

export function enrichIncomeTrend(
	trendData: DashboardIncomeResponse["billingEvolution"],
): IncomeTrendPoint[] {
	return trendData.map((entry, index, all) => {
		const movingWindow = all.slice(Math.max(0, index - 2), index + 1);
		const avg3 =
			movingWindow.reduce((sum, item) => sum + item.total, 0) /
			movingWindow.length;
		const previous = index > 0 ? (all[index - 1]?.total ?? null) : null;
		const changePct =
			previous && previous > 0
				? ((entry.total - previous) / previous) * 100
				: null;

		return {
			...entry,
			avg3,
			changePct,
		};
	});
}

export function getAverageBilling(trendData: IncomeTrendPoint[]): number {
	if (trendData.length === 0) return 0;
	return (
		trendData.reduce((sum, item) => sum + item.total, 0) / trendData.length
	);
}

export function getPeakPeriod(
	trendData: IncomeTrendPoint[],
): IncomeTrendPoint | null {
	return trendData.reduce<IncomeTrendPoint | null>((max, current) => {
		if (!max || current.total > max.total) return current;
		return max;
	}, null);
}

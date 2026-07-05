import { queryOptions } from "@tanstack/react-query";
import { cashflowApi } from "./cashflow.api";
import { cashflowKeys } from "./query-keys";

export function cashflowProjectionQueryOptions(
	companyId: string,
	days: number,
	currency: string,
) {
	return queryOptions({
		queryKey: cashflowKeys.projection(companyId, days, currency),
		queryFn: async () => {
			const result = await cashflowApi.getProjection({
				companyId,
				days,
				currency: currency as "PEN" | "USD" | "EUR",
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function cashflowActualQueryOptions(
	companyId: string,
	startDate: string,
	endDate: string,
	currency: string,
) {
	return queryOptions({
		queryKey: cashflowKeys.actual(companyId, startDate, endDate, currency),
		queryFn: async () => {
			const result = await cashflowApi.getActual({
				companyId,
				startDate,
				endDate,
				currency: currency as "PEN" | "USD" | "EUR",
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function cashflowForecastQueryOptions(
	companyId: string,
	months: number,
	currency: string,
) {
	return queryOptions({
		queryKey: cashflowKeys.forecast(companyId, months, currency),
		queryFn: async () => {
			const result = await cashflowApi.getForecast({
				companyId,
				months,
				currency: currency as "PEN" | "USD" | "EUR",
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function cashflowVarianceQueryOptions(
	companyId: string,
	startDate: string,
	endDate: string,
	currency: string,
) {
	return queryOptions({
		queryKey: cashflowKeys.variance(companyId, startDate, endDate, currency),
		queryFn: async () => {
			const result = await cashflowApi.getVariance({
				companyId,
				startDate,
				endDate,
				currency: currency as "PEN" | "USD" | "EUR",
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

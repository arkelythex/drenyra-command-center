// ─── Barrel — re-exports everything for backward compatibility ──
// Original: src/features/cashflow/api/cashflow.api.ts (~295 lines)
// Split into: cashflow.types, cashflow.utils, index (cashflowApi)

export type * from "./cashflow.types";

import { api } from "@/lib/api";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkData, unwrap } from "@/lib/api-helpers";

import type { CashflowForecastData } from "./cashflow.types";
import {
	type ActualCashflowApiData,
	type CashflowProjectionApiData,
	type CashflowVarianceApiData,
	mapActualData,
	mapProjectionData,
	mapVarianceData,
} from "./cashflow.utils";

/**
 * Cashflow API client — provides projection, actual, forecast, and variance data.
 */
export const cashflowApi = {
	getProjection: async (params: {
		companyId: string;
		days?: number;
		currency?: "PEN" | "USD" | "EUR";
	}) => {
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.cashflow.projection.get({ query: params }),
			);
			return mapProjectionData(
				extractOkData<CashflowProjectionApiData>(
					body,
					"No se pudo cargar la proyección de cashflow",
				),
			);
		});
	},

	getActual: async (params: {
		companyId: string;
		startDate: string;
		endDate: string;
		currency?: "PEN" | "USD" | "EUR";
	}) => {
		return safeApiCall(async () => {
			const body = await unwrap(api.api.cashflow.actual.get({ query: params }));
			return mapActualData(
				extractOkData<ActualCashflowApiData>(
					body,
					"No se pudo cargar el cashflow real",
				),
			);
		});
	},

	getForecast: async (params: {
		companyId: string;
		months?: number;
		currency?: "PEN" | "USD" | "EUR";
	}) => {
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.cashflow.forecast.get({ query: params }),
			);
			return extractOkData<CashflowForecastData>(
				body,
				"No se pudo cargar el forecast de cashflow",
			);
		});
	},

	getVariance: async (params: {
		companyId: string;
		startDate: string;
		endDate: string;
		currency?: "PEN" | "USD" | "EUR";
	}) => {
		return safeApiCall(async () => {
			const body = await unwrap(
				api.api.cashflow.variance.get({ query: params }),
			);
			return mapVarianceData(
				extractOkData<CashflowVarianceApiData>(
					body,
					"No se pudo cargar la variación de cashflow",
				),
			);
		});
	},
};

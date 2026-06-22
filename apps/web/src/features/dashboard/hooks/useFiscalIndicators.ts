import { useQuery } from "@tanstack/react-query";
import type { DashboardFiscalIndicatorsResponse } from "../api/dashboard.api";
import { fiscalIndicatorsQueryOptions } from "../dashboard.query-options";

export interface UseFiscalIndicatorsResult {
	exchangeRate: DashboardFiscalIndicatorsResponse["exchangeRate"];
	uit: DashboardFiscalIndicatorsResponse["uit"];
	isLoading: boolean;
}

export function useFiscalIndicators(): UseFiscalIndicatorsResult {
	const { data } = useQuery(fiscalIndicatorsQueryOptions());

	return {
		exchangeRate: data?.exchangeRate || { compra: 0, venta: 0 },
		uit: data?.uit || { year: 2026, value: 0 },
		isLoading: !data,
	};
}

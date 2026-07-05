import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { SIRE_DEMO_EXPORT_PERIOD } from "@/features/compliance/lib/sire-demo-export";
import { safeApiCall } from "@/lib/api-factory";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	getComplianceClient,
	type SireDemoSummaryData,
} from "../api/compliance-client";

const sireDemoSummaryKeys = {
	all: ["sire-demo-summary"] as const,
	detail: (companyId: string, period: string) =>
		["sire-demo-summary", companyId, period] as const,
};

const complianceClient = getComplianceClient();

export function useSireDemoSummary(): UseQueryResult<
	SireDemoSummaryData,
	Error
> {
	const {
		companyContext: { companyId },
	} = useActiveCompanyContext();

	return useQuery({
		queryKey: sireDemoSummaryKeys.detail(companyId, SIRE_DEMO_EXPORT_PERIOD),
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				const body = await unwrap(
					complianceClient["sire-demo-summary"].get({
						query: {
							companyId,
							period: SIRE_DEMO_EXPORT_PERIOD,
						},
					}),
				);
				return extractOkData(
					body,
					"No se pudo cargar el resumen SIRE demo",
				) as SireDemoSummaryData;
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		staleTime: 1000 * 60 * 5,
	});
}

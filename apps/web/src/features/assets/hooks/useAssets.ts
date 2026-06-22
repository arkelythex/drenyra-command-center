/**
 * Assets Hooks - Type-safe with Eden Treaty
 */

import { useQuery } from "@tanstack/react-query";
import { safeApiCall } from "@/lib/api-factory";
import { unwrap } from "@/lib/api-helpers";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { assetsTreatyClient } from "../api/assets-treaty-client";
import { assetKeys } from "../api/query-keys";

export function useAssets() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: assetKeys.list(companyId),
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				return unwrap(
					assetsTreatyClient.get({
						query: { companyId },
					}),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function useAssetDepreciation(assetId: string) {
	return useQuery({
		queryKey: assetKeys.depreciation(assetId),
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				return unwrap(
					assetsTreatyClient({
						id: assetId,
					}).depreciation.get(),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

export function useAssetsValuation() {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;

	return useQuery({
		queryKey: assetKeys.valuation(companyId),
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				return unwrap(
					assetsTreatyClient.valuation.get({
						query: { companyId },
					}),
				);
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
	});
}

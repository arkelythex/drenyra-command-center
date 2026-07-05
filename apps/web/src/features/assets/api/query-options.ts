import { queryOptions } from "@tanstack/react-query";
import { assetsTreatyClient } from "./assets-treaty-client";
import { assetKeys } from "./query-keys";

export function assetsListQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: assetKeys.list(companyId),
		queryFn: async () => {
			const result = await assetsTreatyClient.get({ query: { companyId } });
			return result.data;
		},
	});
}

export function assetDepreciationQueryOptions(assetId: string) {
	return queryOptions({
		queryKey: assetKeys.depreciation(assetId),
		queryFn: async () => {
			const result = await assetsTreatyClient({
				id: assetId,
			}).depreciation.get();
			return result.data;
		},
	});
}

export function assetsValuationQueryOptions(companyId: string) {
	return queryOptions({
		queryKey: assetKeys.valuation(companyId),
		queryFn: async () => {
			const result = await assetsTreatyClient.valuation.get({
				query: { companyId },
			});
			return result.data;
		},
	});
}

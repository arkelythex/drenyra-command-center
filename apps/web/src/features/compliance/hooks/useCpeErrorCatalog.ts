import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { extractOkData, unwrap } from "@/lib/api-helpers";
import { safeApiCall } from "@/lib/api-factory";
import {
	type CpeErrorCatalogItem,
	getCpeValidatorClient,
} from "../api/compliance-client";

const cpeErrorCatalogKeys = {
	all: ["cpe-error-catalog"] as const,
};

const cpeValidatorClient = getCpeValidatorClient();

export function useCpeErrorCatalog(): UseQueryResult<
	readonly CpeErrorCatalogItem[],
	Error
> {
	return useQuery({
		queryKey: cpeErrorCatalogKeys.all,
		queryFn: async () => {
			const result = await safeApiCall(async () => {
				const body = await unwrap(cpeValidatorClient["error-catalog"].get());
				const data = extractOkData(body, "No se pudo cargar el catalogo CPE") as {
					items: readonly CpeErrorCatalogItem[];
				};
				return data.items;
			});
			if (!result.ok) throw new Error(result.error);
			return result.data;
		},
		staleTime: 1000 * 60 * 10,
	});
}

export type { CpeErrorCatalogItem };

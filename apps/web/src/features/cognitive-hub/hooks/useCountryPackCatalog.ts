import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import {
	type CountryPackCatalogResponse,
	complianceApi,
} from "@/features/compliance/api/compliance.api";
import {
	type CountryCode,
	DEFAULT_COUNTRY_CODE,
	LATAM_COUNTRY_PACKS,
} from "@/lib/latam-country-packs";

const countryPackCatalogKeys = {
	all: ["country-pack-catalog"] as const,
};

function buildFallbackCatalog(): CountryPackCatalogResponse {
	return {
		defaultCountryCode: DEFAULT_COUNTRY_CODE,
		supportedCountries: Object.keys(LATAM_COUNTRY_PACKS) as CountryCode[],
		packs: Object.values(LATAM_COUNTRY_PACKS),
	};
}

export function useCountryPackCatalog(): UseQueryResult<
	CountryPackCatalogResponse,
	Error
> {
	return useQuery({
		queryKey: countryPackCatalogKeys.all,
		queryFn: async (): Promise<CountryPackCatalogResponse> => {
			try {
				return await complianceApi.getCountryPackCatalog();
			} catch {
				return buildFallbackCatalog();
			}
		},
		staleTime: 1000 * 60 * 30,
		gcTime: 1000 * 60 * 60,
		retry: 1,
		initialData: buildFallbackCatalog,
	});
}

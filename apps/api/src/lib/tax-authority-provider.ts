/**
 * TaxAuthority Provider — API-layer factory for TaxAuthorityPort adapters.
 *
 * Provides a cached adapter per organization, defaulting to SUNAT for Peru.
 * API features should use this provider instead of importing OSEService,
 * SunatApiClient, or other SUNAT-specific code directly.
 *
 * @module lib/tax-authority-provider
 */

import type { TaxAuthorityPort } from "@drenyra/application/ports/tax-authority.port";
import type { CountryCode } from "@drenyra/domain";
import { createTaxAuthority } from "@drenyra/infrastructure/tax-authority";

const adapterCache = new Map<string, TaxAuthorityPort>();

function cacheKey(orgId: number, countryCode: CountryCode): string {
	return `${countryCode}:${orgId}`;
}

/**
 * Get (or create & cache) a TaxAuthorityPort adapter for an organization.
 *
 * @example
 * ```ts
 * const adapter = await getTaxAuthority(orgId);
 * const info = await adapter.consultTaxId("20546296564");
 * ```
 */
export async function getTaxAuthority(
	organizationId: number,
	countryCode: CountryCode = "PE",
): Promise<TaxAuthorityPort> {
	const key = cacheKey(organizationId, countryCode);

	const cached = adapterCache.get(key);
	if (cached) return cached;

	const adapter = await createTaxAuthority(countryCode, organizationId);
	if (!adapter) {
		throw new Error(
			`TaxAuthority adapter initialization failed for ${countryCode}:${organizationId}. ` +
				"Check credentials (SUNAT_CLIENT_ID, SUNAT_CLIENT_SECRET).",
		);
	}

	adapterCache.set(key, adapter);
	return adapter;
}

/**
 * Clear the adapter cache (useful for testing or config changes).
 */
export function clearTaxAuthorityCache(): void {
	adapterCache.clear();
}

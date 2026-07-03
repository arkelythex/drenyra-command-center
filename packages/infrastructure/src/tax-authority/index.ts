/**
 * TaxAuthority adapters — pluggable tax authority implementations.
 *
 * Currently supported:
 * - PE → SunatTaxAuthorityAdapter (SUNAT)
 *
 * @module tax-authority
 */

import type { CountryCode } from "@arkelythex/domain";
import type { TaxAuthorityPort } from "@arkelythex/application/ports/tax-authority.port";
import { SunatTaxAuthorityAdapter } from "./sunat-tax-authority.adapter";

export { SunatTaxAuthorityAdapter, createSunatTaxAuthority } from "./sunat-tax-authority.adapter";
export type { TaxAuthorityPort } from "@arkelythex/application/ports/tax-authority.port";

// ─── Adapter Registry ─────────────────────────────────────────────────

type AdapterFactory = (organizationId: number) => TaxAuthorityPort;

const registry = new Map<CountryCode, AdapterFactory>();

/**
 * Register an adapter factory for a country code.
 *
 * @example
 * ```ts
 * registerTaxAuthority(
 *   "PE",
 *   (orgId) => new SunatTaxAuthorityAdapter(orgId),
 * );
 * ```
 */
export function registerTaxAuthority(
	countryCode: CountryCode,
	factory: AdapterFactory,
): void {
	registry.set(countryCode, factory);
}

/**
 * Check if an adapter is registered for a country code.
 */
export function hasTaxAuthority(countryCode: CountryCode): boolean {
	return registry.has(countryCode);
}

/**
 * Get the registered adapter factory for a country code.
 * Throws if not registered.
 */
export function getTaxAuthorityFactory(
	countryCode: CountryCode,
): AdapterFactory {
	const factory = registry.get(countryCode);
	if (!factory) {
		throw new Error(
			`No TaxAuthority adapter registered for country: ${countryCode}`,
		);
	}
	return factory;
}

/**
 * Create and initialize a TaxAuthority adapter for a country code.
 * Returns null if initialization fails.
 *
 * @example
 * ```ts
 * const adapter = await createTaxAuthority("PE", orgId);
 * if (adapter) {
 *   const info = await adapter.consultTaxId("20546296564");
 * }
 * ```
 */
export async function createTaxAuthority(
	countryCode: CountryCode,
	organizationId: number,
): Promise<TaxAuthorityPort | null> {
	const factory = getTaxAuthorityFactory(countryCode);
	const adapter = factory(organizationId);
	const initialized = await adapter.initialize();
	return initialized ? adapter : null;
}

// ─── Default registrations ────────────────────────────────────────────

registerTaxAuthority(
	"PE",
	(orgId) => new SunatTaxAuthorityAdapter(orgId),
);

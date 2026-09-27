import { SunatTaxAuthorityAdapter } from "./sunat-tax-authority.adapter";
export { createSunatTaxAuthority, SunatTaxAuthorityAdapter, } from "./sunat-tax-authority.adapter";
const registry = new Map();
export function registerTaxAuthority(countryCode, factory) {
    registry.set(countryCode, factory);
}
export function hasTaxAuthority(countryCode) {
    return registry.has(countryCode);
}
export function getTaxAuthorityFactory(countryCode) {
    const factory = registry.get(countryCode);
    if (!factory) {
        throw new Error(`No TaxAuthority adapter registered for country: ${countryCode}`);
    }
    return factory;
}
export async function createTaxAuthority(countryCode, organizationId) {
    const factory = getTaxAuthorityFactory(countryCode);
    const adapter = factory(organizationId);
    const initialized = await adapter.initialize();
    return initialized ? adapter : null;
}
registerTaxAuthority("PE", (orgId) => new SunatTaxAuthorityAdapter(orgId));
//# sourceMappingURL=index.js.map
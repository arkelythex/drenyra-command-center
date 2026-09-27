import type { TaxAuthorityPort } from "@drenyra/application/ports/tax-authority.port";
import type { CountryCode } from "@drenyra/domain";
export type { TaxAuthorityPort } from "@drenyra/application/ports/tax-authority.port";
export { createSunatTaxAuthority, SunatTaxAuthorityAdapter, } from "./sunat-tax-authority.adapter";
type AdapterFactory = (organizationId: number) => TaxAuthorityPort;
export declare function registerTaxAuthority(countryCode: CountryCode, factory: AdapterFactory): void;
export declare function hasTaxAuthority(countryCode: CountryCode): boolean;
export declare function getTaxAuthorityFactory(countryCode: CountryCode): AdapterFactory;
export declare function createTaxAuthority(countryCode: CountryCode, organizationId: number): Promise<TaxAuthorityPort | null>;
//# sourceMappingURL=index.d.ts.map
export interface CountryPackDef {
    code: string;
    name: string;
    taxAuthority: string;
    defaultCurrency: string;
    locale: string;
    timezone: string;
    fiscalYearStart: string;
    taxIdentifierFormat: string;
}
export declare const DRENYRA_COUNTRY_PACKS: CountryPackDef[];
export interface FiscalPeriod {
    year: number;
    month: number;
    label: string;
    startDate: string;
    endDate: string;
    taxDeadlines: TaxDeadline[];
}
export interface TaxDeadline {
    obligation: string;
    dueDate: string;
    description: string;
    countryCode: string;
}
export interface TaxRule {
    name: string;
    countryCode: string;
    description: string;
    rate: number;
    appliesTo: string[];
    active: boolean;
    validFrom: string;
    validUntil?: string;
}
export declare const PERU_TAX_RULES: TaxRule[];
export declare const COLOMBIA_TAX_RULES: TaxRule[];
export declare class CountryRuntime {
    private packs;
    constructor(packs?: CountryPackDef[]);
    getPack(code: string): CountryPackDef | undefined;
    listAvailable(): CountryPackDef[];
    getTaxRules(countryCode: string, activeOnly?: boolean): TaxRule[];
    generatePeriods(year: number, countryCode: string): FiscalPeriod[];
}
//# sourceMappingURL=country-runtime.d.ts.map
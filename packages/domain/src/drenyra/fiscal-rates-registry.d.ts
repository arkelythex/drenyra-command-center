export interface FiscalRateEntry {
    rateId: string;
    rate: number;
    effectiveFrom: string;
    effectiveTo: string | null;
    normativeRef?: string;
    description: string;
}
export declare const FISCAL_RATES: FiscalRateEntry[];
export declare function getFiscalRate(rateId: string, asOf?: string): FiscalRateEntry | null;
export declare function getFiscalRateHistory(rateId: string): FiscalRateEntry[];
//# sourceMappingURL=fiscal-rates-registry.d.ts.map
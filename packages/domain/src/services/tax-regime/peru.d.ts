import type { CountryCode } from "../../types/tax-identifier";
import { Money } from "../../value-objects/Money";
import type { TaxRegime } from "./types";
export type TaxType = "IGV" | "DETRACCION" | "RETENCION" | "PERCEPCION";
export interface TaxCalculationResult {
    baseAmount: Money;
    taxAmount: Money;
    totalAmount: Money;
    taxRate: number;
    taxType: TaxType;
}
export interface DetraccionRate {
    code: string;
    description: string;
    rate: number;
}
export type PercepcionType = "VENTA_INTERNA" | "IMPORTACION" | "COMBUSTIBLE";
export interface PercepcionRate {
    code: PercepcionType;
    description: string;
    rate: number;
}
export declare class PeruGeneralRegime implements TaxRegime {
    readonly countryCode: CountryCode;
    calculate(amount: Money, taxType: string): Money;
    getRate(taxType: string): number;
    calculateIGV(baseAmount: Money): TaxCalculationResult;
    calculateBaseFromTotal(totalAmount: Money): TaxCalculationResult;
    calculateDetraccion(totalAmount: Money, serviceCode: string): TaxCalculationResult;
    shouldApplyDetraccion(totalAmount: Money, serviceCode: string): boolean;
    getDetraccionRates(): DetraccionRate[];
    getDetraccionRate(code: string): DetraccionRate | undefined;
    calculateRetencion(baseAmount: Money): TaxCalculationResult;
    shouldApplyRetencion(baseAmount: Money, isAgenteRetencion?: boolean): boolean;
    calculatePercepcion(totalAmount: Money, percepcionType: string): TaxCalculationResult;
    shouldApplyPercepcion(totalAmount: Money): boolean;
    getPercepcionRates(): PercepcionRate[];
    getPercepcionRate(percepcionType: string): PercepcionRate | undefined;
    calculateInvoiceBreakdown(params: {
        baseAmount: Money;
        applyIGV: boolean;
        detraccionCode?: string;
        isExport?: boolean;
    }): {
        base: Money;
        igv: Money;
        total: Money;
        detraccion?: Money;
        netToPay: Money;
    };
}
//# sourceMappingURL=peru.d.ts.map
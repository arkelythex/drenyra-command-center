import type { Money } from "../value-objects/Money";
import type { TaxRegime } from "./tax-regime/types";
export type TaxType = import("./tax-regime/peru").TaxType;
export type TaxCalculationResult = import("./tax-regime/peru").TaxCalculationResult;
export type DetraccionRate = import("./tax-regime/peru").DetraccionRate;
export type PercepcionRate = import("./tax-regime/peru").PercepcionRate;
export type PercepcionType = import("./tax-regime/peru").PercepcionType;
export declare class TaxCalculator {
    private static regime;
    static setRegime(regime: TaxRegime): void;
    static getRegime(): TaxRegime;
    static calculateIGV(baseAmount: Money): TaxCalculationResult;
    static calculateBaseFromTotal(totalAmount: Money): TaxCalculationResult;
    static calculateDetraccion(totalAmount: Money, serviceCode: string): TaxCalculationResult;
    static calculateRetencion(baseAmount: Money): TaxCalculationResult;
    static calculatePercepcion(totalAmount: Money, percepcionType: string): TaxCalculationResult;
    static shouldApplyDetraccion(totalAmount: Money, serviceCode: string): boolean;
    static shouldApplyRetencion(baseAmount: Money, isAgenteRetencion?: boolean): boolean;
    static shouldApplyPercepcion(totalAmount: Money): boolean;
    static getDetraccionRates(): DetraccionRate[];
    static getDetraccionRate(code: string): DetraccionRate | undefined;
    static getPercepcionRates(): PercepcionRate[];
    static getPercepcionRate(percepcionType: string): PercepcionRate | undefined;
    static calculateInvoiceBreakdown(params: {
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
    private static ensurePeruRegime;
}
//# sourceMappingURL=TaxCalculator.d.ts.map
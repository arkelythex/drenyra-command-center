import type { AnomalyStrategy } from "./types";
export declare const SPOT_MIN_CASH_AMOUNT = 700;
export declare const SPOT_MIN_AMOUNT = 700;
export declare const SPOT_DEPOSIT_DAYS = 5;
export declare const UNKNOWN_OPERATION_CODE = "00";
export declare const CASH_PAYMENT_TYPES: readonly string[];
interface SpotRateEntry {
    rate: number;
    description: string;
}
export declare const SPOT_RATES: ReadonlyMap<string, SpotRateEntry>;
export interface DetraccionInvoice {
    id: string;
    serie: string;
    numero: string;
    tipoDocumento: string;
    emisorRuc: string;
    receptorRuc: string;
    operationCode: string;
    totalAmount: number;
    detraccionAmount: number | null;
    detraccionPercentage: number | null;
    detraccionDeposited: boolean;
    depositDate: string | null;
    paymentType: string;
    emisionDate: string;
}
export declare function createDetraccionesStrategy(): AnomalyStrategy;
export {};
//# sourceMappingURL=detracciones.strategy.d.ts.map
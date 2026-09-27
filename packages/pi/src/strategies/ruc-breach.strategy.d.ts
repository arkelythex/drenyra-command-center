import type { Anomaly } from "./types";
export declare const RUC_BREACH_THRESHOLD_PEN = 5000;
export interface RucBreachTransaction {
    id: string;
    amount: number;
    declaredRuc: string;
    paymentRuc: string;
    serie: string;
    numero: string;
    emisionDate: string;
}
export declare function detectRucBreachAnomalies(transactions: RucBreachTransaction[], thresholdPen?: number): Anomaly[];
//# sourceMappingURL=ruc-breach.strategy.d.ts.map
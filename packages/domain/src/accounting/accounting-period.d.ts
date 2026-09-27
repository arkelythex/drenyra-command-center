export declare const ACCOUNTING_PERIOD_STATUS: {
    readonly ABIERTO: "abierto";
    readonly CERRADO_PARCIAL: "cerrado_parcial";
    readonly CERRADO_FINAL: "cerrado_final";
    readonly AUDITADO: "auditado";
};
export type AccountingPeriodStatus = (typeof ACCOUNTING_PERIOD_STATUS)[keyof typeof ACCOUNTING_PERIOD_STATUS];
interface DateRange {
    start: Date;
    end: Date;
}
export declare class AccountingPeriod {
    private readonly _year;
    private readonly _month;
    private readonly _status;
    private constructor();
    static create(year: number, month: number, status?: AccountingPeriodStatus): AccountingPeriod;
    get year(): number;
    get month(): number;
    get status(): AccountingPeriodStatus;
    get periodKey(): string;
    get dateRange(): DateRange;
    canPostEntry(): boolean;
    closePartial(): AccountingPeriod;
    closeFinal(): AccountingPeriod;
    audit(): AccountingPeriod;
    equals(other: AccountingPeriod | null | undefined): boolean;
    toString(): string;
    toJSON(): {
        year: number;
        month: number;
        status: AccountingPeriodStatus;
        periodKey: string;
    };
    static fromJSON(json: {
        year: number;
        month: number;
        status: AccountingPeriodStatus;
    }): AccountingPeriod;
}
export declare class InvalidAccountingPeriodError extends Error {
    readonly year: number;
    readonly month: number;
    constructor(year: number, month: number, message?: string);
    toJSON(): Record<string, unknown>;
}
export declare class InvalidAccountingTransitionError extends Error {
    readonly currentStatus: string;
    readonly targetStatus: string;
    constructor(currentStatus: string, targetStatus: string, message?: string);
    toJSON(): Record<string, unknown>;
}
export {};
//# sourceMappingURL=accounting-period.d.ts.map
export declare class ExchangeRate {
    private readonly _date;
    private readonly _currencyFrom;
    private readonly _currencyTo;
    private readonly _buy;
    private readonly _sell;
    private readonly _sunatReference;
    private constructor();
    static create(date: Date, currencyFrom: string, currencyTo: string, buy: number, sell: number, sunatReference?: number | null): ExchangeRate;
    get date(): Date;
    get currencyFrom(): string;
    get currencyTo(): string;
    get buy(): number;
    get sell(): number;
    get sunatReference(): number | null;
    getRateForConversion(): number;
    convert(sourceValue: number): number;
    equals(other: ExchangeRate | null | undefined): boolean;
    toString(): string;
    toJSON(): {
        date: string;
        currencyFrom: string;
        currencyTo: string;
        buy: number;
        sell: number;
        sunatReference: number | null;
    };
    static fromJSON(json: {
        date: string;
        currencyFrom: string;
        currencyTo: string;
        buy: number;
        sell: number;
        sunatReference?: number | null;
    }): ExchangeRate;
}
export declare class InvalidExchangeRateError extends Error {
    readonly currencyFrom: string;
    readonly currencyTo: string;
    constructor(currencyFrom: string, currencyTo: string, message?: string);
    toJSON(): Record<string, unknown>;
}
//# sourceMappingURL=exchange-rate.d.ts.map
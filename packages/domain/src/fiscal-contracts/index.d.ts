export declare const IGV_RATE: 0.18;
export interface IGVInput {
    baseCents: number;
}
export interface IGVOutput {
    baseCents: number;
    igvCents: number;
    totalCents: number;
}
export declare const IGV_CONTRACT: {
    readonly version: "2.0.0";
    readonly name: "IGV Calculation";
    readonly jurisdiction: "PE";
    readonly lastUpdated: "2026-07-11";
    readonly rate: 0.18;
    readonly input: {
        readonly baseCents: {
            readonly type: "integer";
            readonly min: 0;
            readonly max: 100000000000;
            readonly description: "Base amount in cents";
        };
    };
    readonly output: {
        readonly baseCents: {
            readonly type: "integer";
            readonly description: "Same as input";
        };
        readonly igvCents: {
            readonly type: "integer";
            readonly description: "IGV amount in cents";
        };
        readonly totalCents: {
            readonly type: "integer";
            readonly description: "Total in cents";
        };
    };
    readonly formula: "igvCents = round(baseCents * 0.18); totalCents = baseCents + igvCents";
    readonly invariants: readonly ["totalCents = baseCents + igvCents", "igvCents >= 0 when baseCents >= 0", "0 <= igvCents / baseCents <= 0.18 when baseCents > 0 (rounding may cause < 0.18)"];
};
export interface RUCInput {
    value: string;
}
export interface RUCOutput {
    valid: boolean;
    entityType: "COMPANY" | "PERSON" | "GOVERNMENT" | "UNKNOWN";
    countryCode: "PE";
}
export declare const RUC_CONTRACT: {
    readonly version: "1.0.0";
    readonly name: "RUC Validation";
    readonly jurisdiction: "PE";
    readonly lastUpdated: "2026-07-11";
    readonly input: {
        readonly value: {
            readonly type: "string";
            readonly pattern: "^\\d{11}$";
            readonly description: "11-digit RUC number";
        };
    };
    readonly output: {
        readonly valid: {
            readonly type: "boolean";
        };
        readonly entityType: {
            readonly type: "string";
            readonly enum: readonly ["COMPANY", "PERSON", "GOVERNMENT", "UNKNOWN"];
        };
        readonly countryCode: {
            readonly type: "string";
            readonly const: "PE";
        };
    };
    readonly checksum: {
        readonly algorithm: "Modulo 11";
        readonly weights: readonly [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        readonly description: "SUNAT standard RUC check digit validation";
    };
    readonly invariants: readonly ["value.length === 11", "value matches ^\\d{11}$", "check digit = 11 - (sum(digits[0..9] * weights) % 11)"];
};
export declare const DETRACCION_CONTRACT: {
    readonly version: "1.0.0";
    readonly name: "SPOT Detraction";
    readonly jurisdiction: "PE";
    readonly lastUpdated: "2026-07-11";
    readonly percentageRange: {
        readonly min: 1;
        readonly max: 100;
    };
    readonly validSpotCodes: readonly ["001", "003", "004", "005", "006"];
    readonly invariants: readonly ["percentage IN [1, 100]", "spotCode IN validSpotCodes", "detractionAmount = operationAmount * percentage / 100"];
};
export declare const MONEY_CONTRACT: {
    readonly version: "1.0.0";
    readonly name: "Money Value Object";
    readonly jurisdiction: "PE";
    readonly lastUpdated: "2026-07-11";
    readonly currencies: readonly ["PEN", "USD"];
    readonly precision: "cents (integer, 1 = 0.01 currency unit)";
    readonly range: {
        readonly minCents: -100000000000;
        readonly maxCents: 100000000000;
    };
    readonly operations: {
        readonly add: "a.cents + b.cents (same currency required)";
        readonly subtract: "a.cents - b.cents >= 0 (same currency required)";
        readonly multiply: "round(a.cents * factor)";
    };
    readonly invariants: readonly ["addition is commutative: a + b = b + a", "addition is associative: (a + b) + c = a + (b + c)", "currency is preserved across operations", "multiply by 1 returns same value", "multiply by 0 returns zero"];
};
export declare const FISCAL_CONTRACTS: {
    readonly igv: {
        readonly version: "2.0.0";
        readonly name: "IGV Calculation";
        readonly jurisdiction: "PE";
        readonly lastUpdated: "2026-07-11";
        readonly rate: 0.18;
        readonly input: {
            readonly baseCents: {
                readonly type: "integer";
                readonly min: 0;
                readonly max: 100000000000;
                readonly description: "Base amount in cents";
            };
        };
        readonly output: {
            readonly baseCents: {
                readonly type: "integer";
                readonly description: "Same as input";
            };
            readonly igvCents: {
                readonly type: "integer";
                readonly description: "IGV amount in cents";
            };
            readonly totalCents: {
                readonly type: "integer";
                readonly description: "Total in cents";
            };
        };
        readonly formula: "igvCents = round(baseCents * 0.18); totalCents = baseCents + igvCents";
        readonly invariants: readonly ["totalCents = baseCents + igvCents", "igvCents >= 0 when baseCents >= 0", "0 <= igvCents / baseCents <= 0.18 when baseCents > 0 (rounding may cause < 0.18)"];
    };
    readonly ruc: {
        readonly version: "1.0.0";
        readonly name: "RUC Validation";
        readonly jurisdiction: "PE";
        readonly lastUpdated: "2026-07-11";
        readonly input: {
            readonly value: {
                readonly type: "string";
                readonly pattern: "^\\d{11}$";
                readonly description: "11-digit RUC number";
            };
        };
        readonly output: {
            readonly valid: {
                readonly type: "boolean";
            };
            readonly entityType: {
                readonly type: "string";
                readonly enum: readonly ["COMPANY", "PERSON", "GOVERNMENT", "UNKNOWN"];
            };
            readonly countryCode: {
                readonly type: "string";
                readonly const: "PE";
            };
        };
        readonly checksum: {
            readonly algorithm: "Modulo 11";
            readonly weights: readonly [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
            readonly description: "SUNAT standard RUC check digit validation";
        };
        readonly invariants: readonly ["value.length === 11", "value matches ^\\d{11}$", "check digit = 11 - (sum(digits[0..9] * weights) % 11)"];
    };
    readonly detraccion: {
        readonly version: "1.0.0";
        readonly name: "SPOT Detraction";
        readonly jurisdiction: "PE";
        readonly lastUpdated: "2026-07-11";
        readonly percentageRange: {
            readonly min: 1;
            readonly max: 100;
        };
        readonly validSpotCodes: readonly ["001", "003", "004", "005", "006"];
        readonly invariants: readonly ["percentage IN [1, 100]", "spotCode IN validSpotCodes", "detractionAmount = operationAmount * percentage / 100"];
    };
    readonly money: {
        readonly version: "1.0.0";
        readonly name: "Money Value Object";
        readonly jurisdiction: "PE";
        readonly lastUpdated: "2026-07-11";
        readonly currencies: readonly ["PEN", "USD"];
        readonly precision: "cents (integer, 1 = 0.01 currency unit)";
        readonly range: {
            readonly minCents: -100000000000;
            readonly maxCents: 100000000000;
        };
        readonly operations: {
            readonly add: "a.cents + b.cents (same currency required)";
            readonly subtract: "a.cents - b.cents >= 0 (same currency required)";
            readonly multiply: "round(a.cents * factor)";
        };
        readonly invariants: readonly ["addition is commutative: a + b = b + a", "addition is associative: (a + b) + c = a + (b + c)", "currency is preserved across operations", "multiply by 1 returns same value", "multiply by 0 returns zero"];
    };
};
export type FiscalContractName = keyof typeof FISCAL_CONTRACTS;
export declare function getFiscalContractsJSON(): string;
export declare function getContractJSON(name: FiscalContractName): string;
//# sourceMappingURL=index.d.ts.map
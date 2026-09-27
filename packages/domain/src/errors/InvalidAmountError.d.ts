export declare class InvalidAmountError extends Error {
    readonly invalidValue: number;
    constructor(invalidValue: number, message?: string);
    toJSON(): {
        name: string;
        message: string;
        invalidValue: number;
        code: string;
    };
}
//# sourceMappingURL=InvalidAmountError.d.ts.map
import { ValidationError } from "./AppError";
export declare class InvalidRUCError extends ValidationError {
    readonly invalidValue: string;
    readonly code: string;
    constructor(invalidValue: string, message?: string);
    toJSON(): {
        invalidValue: string;
    };
}
//# sourceMappingURL=InvalidRUCError.d.ts.map
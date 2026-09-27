export declare abstract class AppError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    readonly fiscalContext: Record<string, unknown> | undefined;
    constructor(message: string, options?: {
        cause?: Error;
        fiscalContext?: Record<string, unknown>;
    });
    toJSON(): Record<string, unknown>;
}
export declare class FiscalError extends AppError {
    readonly code: string;
    readonly statusCode = 400;
    constructor(code: string, message: string, options?: {
        cause?: Error;
        fiscalContext?: Record<string, unknown>;
    });
}
export declare class ValidationError extends AppError {
    readonly code: string;
    readonly statusCode = 422;
    readonly field?: string;
    constructor(field: string, message: string, options?: {
        cause?: Error;
        fiscalContext?: Record<string, unknown>;
    });
}
export declare class NotFoundError extends AppError {
    readonly code = "NOT_FOUND";
    readonly statusCode = 404;
    readonly resourceType: string;
    readonly resourceId: string;
    constructor(resourceType: string, resourceId: string, message?: string);
}
export declare class AuthError extends AppError {
    readonly code = "AUTH_ERROR";
    readonly statusCode = 401;
}
export declare class TenantError extends AppError {
    readonly code = "TENANT_MISMATCH";
    readonly statusCode = 403;
    readonly expectedTenant: string;
    readonly actualTenant: string;
    constructor(expectedTenant: string, actualTenant: string);
}
//# sourceMappingURL=AppError.d.ts.map
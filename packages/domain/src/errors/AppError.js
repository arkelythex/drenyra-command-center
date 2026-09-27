export class AppError extends Error {
    fiscalContext;
    constructor(message, options) {
        super(message, { cause: options?.cause });
        this.name = this.constructor.name;
        this.fiscalContext = options?.fiscalContext;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            statusCode: this.statusCode,
            fiscalContext: this.fiscalContext,
            cause: this.cause instanceof Error ? this.cause.message : undefined,
        };
    }
}
export class FiscalError extends AppError {
    code;
    statusCode = 400;
    constructor(code, message, options) {
        super(message, options);
        this.code = `FISCAL_${code}`;
    }
}
export class ValidationError extends AppError {
    code;
    statusCode = 422;
    field;
    constructor(field, message, options) {
        super(message, options);
        this.code = "VALIDATION_ERROR";
        this.field = field;
    }
}
export class NotFoundError extends AppError {
    code = "NOT_FOUND";
    statusCode = 404;
    resourceType;
    resourceId;
    constructor(resourceType, resourceId, message) {
        super(message || `${resourceType} not found: ${resourceId}`);
        this.resourceType = resourceType;
        this.resourceId = resourceId;
    }
}
export class AuthError extends AppError {
    code = "AUTH_ERROR";
    statusCode = 401;
}
export class TenantError extends AppError {
    code = "TENANT_MISMATCH";
    statusCode = 403;
    expectedTenant;
    actualTenant;
    constructor(expectedTenant, actualTenant) {
        super(`Tenant mismatch: expected ${expectedTenant}, got ${actualTenant}`);
        this.expectedTenant = expectedTenant;
        this.actualTenant = actualTenant;
    }
}
//# sourceMappingURL=AppError.js.map
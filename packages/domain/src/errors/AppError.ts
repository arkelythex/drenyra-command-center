/**
 * AppError — Base class for all domain errors.
 *
 * Provides typed error hierarchy for consistent error handling
 * across API endpoints, services, and UI.
 */
export abstract class AppError extends Error {
	/** Machine-readable error code (e.g. "FISCAL_IGV_CALCULATION") */
	abstract readonly code: string;

	/** HTTP status code for API responses */
	abstract readonly statusCode: number;

	/** Optional fiscal context for audit trails */
	readonly fiscalContext: Record<string, unknown> | undefined;

	constructor(
		message: string,
		options?: { cause?: Error; fiscalContext?: Record<string, unknown> },
	) {
		super(message, { cause: options?.cause });
		this.name = this.constructor.name;
		this.fiscalContext = options?.fiscalContext;
		Object.setPrototypeOf(this, new.target.prototype);
	}

	toJSON(): Record<string, unknown> {
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

/**
 * Error in fiscal domain rules (IGV, detracciones, RUC, SUNAT).
 */
export class FiscalError extends AppError {
	readonly code: string;
	readonly statusCode = 400;

	constructor(
		code: string,
		message: string,
		options?: { cause?: Error; fiscalContext?: Record<string, unknown> },
	) {
		super(message, options);
		this.code = `FISCAL_${code}`;
	}
}

/**
 * Validation error for domain inputs and business rules.
 */
export class ValidationError extends AppError {
	readonly code: string;
	readonly statusCode = 422;
	readonly field?: string;

	constructor(
		field: string,
		message: string,
		options?: { cause?: Error; fiscalContext?: Record<string, unknown> },
	) {
		super(message, options);
		this.code = "VALIDATION_ERROR";
		this.field = field;
	}
}

/**
 * Resource not found error.
 */
export class NotFoundError extends AppError {
	readonly code = "NOT_FOUND";
	readonly statusCode = 404;
	readonly resourceType: string;
	readonly resourceId: string;

	constructor(
		resourceType: string,
		resourceId: string,
		message?: string,
	) {
		super(message || `${resourceType} not found: ${resourceId}`);
		this.resourceType = resourceType;
		this.resourceId = resourceId;
	}
}

/**
 * Authentication/authorization error.
 */
export class AuthError extends AppError {
	readonly code = "AUTH_ERROR";
	readonly statusCode = 401;

	constructor(message: string) {
		super(message);
	}
}

/**
 * Tenant/company scoping error.
 */
export class TenantError extends AppError {
	readonly code = "TENANT_MISMATCH";
	readonly statusCode = 403;
	readonly expectedTenant: string;
	readonly actualTenant: string;

	constructor(expectedTenant: string, actualTenant: string) {
		super(
			`Tenant mismatch: expected ${expectedTenant}, got ${actualTenant}`,
		);
		this.expectedTenant = expectedTenant;
		this.actualTenant = actualTenant;
	}
}

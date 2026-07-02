/**
 * Domain Error Hierarchy — AppError
 *
 * Standardised error types for the entire API. Handlers and middleware can
 * rely on `instanceof AppError` to extract a proper HTTP status code and
 * machine-readable error code without inspecting message strings.
 *
 * @module lib/errors
 */

import { ErrorCodes } from "../shared/error-codes";

// ─── Base ────────────────────────────────────────────────────────────

export class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: string;
	public readonly details?: unknown;

	constructor(
		statusCode: number,
		errorCode: string,
		message: string,
		details?: unknown,
	) {
		super(message);
		this.name = "AppError";
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.details = details;
	}
}

// ─── Concrete error types ───────────────────────────────────────────

export class ValidationError extends AppError {
	constructor(message = "Validation failed", details?: unknown) {
		super(422, ErrorCodes.VALIDATION_ERROR, message, details);
		this.name = "ValidationError";
	}
}

export class NotFoundError extends AppError {
	constructor(message = "Resource not found") {
		super(404, ErrorCodes.NOT_FOUND, message);
		this.name = "NotFoundError";
	}
}

export class UnauthorizedError extends AppError {
	constructor(message = "Unauthorized") {
		super(401, ErrorCodes.UNAUTHORIZED, message);
		this.name = "UnauthorizedError";
	}
}

export class ForbiddenError extends AppError {
	constructor(message = "Forbidden") {
		super(403, ErrorCodes.FORBIDDEN, message);
		this.name = "ForbiddenError";
	}
}

export class ConflictError extends AppError {
	constructor(message = "Resource conflict", details?: unknown) {
		super(409, ErrorCodes.CONFLICT, message, details);
		this.name = "ConflictError";
	}
}

export class BadRequestError extends AppError {
	constructor(message = "Bad request", details?: unknown) {
		super(400, ErrorCodes.BAD_REQUEST, message, details);
		this.name = "BadRequestError";
	}
}

export class UnprocessableError extends AppError {
	constructor(message = "Unprocessable entity", details?: unknown) {
		super(422, ErrorCodes.UNPROCESSABLE, message, details);
		this.name = "UnprocessableError";
	}
}

export class DependencyError extends AppError {
	constructor(message = "External dependency failed", details?: unknown) {
		super(502, ErrorCodes.DEPENDENCY_FAILURE, message, details);
		this.name = "DependencyError";
	}
}

export class TimeoutError extends AppError {
	constructor(message = "Operation timed out") {
		super(504, ErrorCodes.TIMEOUT, message);
		this.name = "TimeoutError";
	}
}

// ─── Mapper helper ───────────────────────────────────────────────────

/**
 * Map an unknown error to an AppError.
 *
 * If the error is already an AppError it passes through unchanged.
 * Otherwise it wraps it as a generic 500 INTERNAL_ERROR, keeping the
 * original message only in non-production environments to avoid leaking
 * internals.
 */
export function toAppError(error: unknown): AppError {
	if (error instanceof AppError) return error;

	const message =
		process.env.NODE_ENV === "production"
			? "Internal server error"
			: error instanceof Error
				? error.message
				: String(error);

	return new AppError(500, ErrorCodes.INTERNAL_ERROR, message);
}

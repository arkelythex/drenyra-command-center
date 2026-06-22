/**
 * Base error class for domain/application failures with a stable machine-readable `code`.
 *
 * @example
 * ```ts
 * throw new DomainError("Invalid state", "INVALID_STATE", 400);
 * ```
 */
export class DomainError extends Error {
	/**
	 * @param message - Human-readable error message
	 * @param code - Stable machine-readable error code
	 * @param statusCode - HTTP status code (default: 400)
	 */
	constructor(
		message: string,
		public readonly code: string,
		public readonly statusCode: number = 400,
	) {
		super(message);
		this.name = this.constructor.name;
	}
}

/**
 * Input validation failure (HTTP 400).
 *
 * @example
 * ```ts
 * throw new ValidationError("email is required");
 * ```
 */
export class ValidationError extends DomainError {
	constructor(message: string) {
		super(message, "VALIDATION_ERROR", 400);
	}
}

/**
 * Resource not found (HTTP 404).
 *
 * @example
 * ```ts
 * throw new NotFoundError("Invoice", invoiceId);
 * ```
 */
export class NotFoundError extends DomainError {
	constructor(resource: string, id: string) {
		super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
	}
}

/**
 * Authentication required or failed (HTTP 401).
 *
 * @example
 * ```ts
 * throw new UnauthorizedError();
 * ```
 */
export class UnauthorizedError extends DomainError {
	constructor(message = "Unauthorized") {
		super(message, "UNAUTHORIZED", 401);
	}
}

/**
 * Storage provider failed (HTTP 500).
 *
 * @example
 * ```ts
 * throw new StorageError("S3 upload failed");
 * ```
 */
export class StorageError extends DomainError {
	constructor(message: string) {
		super(message, "STORAGE_ERROR", 500);
	}
}

/**
 * AI extraction failure (HTTP 500).
 *
 * @example
 * ```ts
 * throw new AIExtractionError("Model output was not parseable");
 * ```
 */
export class AIExtractionError extends DomainError {
	constructor(message: string) {
		super(message, "AI_EXTRACTION_ERROR", 500);
	}
}

/**
 * Database or persistence failure (HTTP 500).
 *
 * @example
 * ```ts
 * throw new DatabaseError("Transaction failed");
 * ```
 */
export class DatabaseError extends DomainError {
	constructor(message: string) {
		super(message, "DATABASE_ERROR", 500);
	}
}

/**
 * Business rule violation (HTTP 422).
 *
 * @example
 * ```ts
 * throw new BusinessRuleError("Invoice is already paid");
 * ```
 */
export class BusinessRuleError extends DomainError {
	constructor(message: string) {
		super(message, "BUSINESS_RULE_ERROR", 422);
	}
}

/**
 * Thrown when an optimistic lock fails due to concurrent modification
 * HIGH-002: Optimistic Locking - Elite 2026
 *
 * @example
 * ```ts
 * throw new ConcurrentModificationError("Invoice");
 * ```
 */
export class ConcurrentModificationError extends DomainError {
	constructor(
		resource: string,
		message = "This record was modified by another user. Please refresh and try again.",
	) {
		super(message, "CONCURRENT_MODIFICATION", 409);
		this.resource = resource;
	}

	public readonly resource: string;
}

/**
 * Thrown when an idempotency check detects a duplicate request
 * MEDIUM-003: Idempotency Keys - Elite 2026
 *
 * @example
 * ```ts
 * throw new IdempotencyConflictError(idempotencyKey);
 * ```
 */
export class IdempotencyConflictError extends DomainError {
	constructor(key: string) {
		super(
			`Request with idempotency key "${key}" is already being processed`,
			"IDEMPOTENCY_CONFLICT",
			409,
		);
		this.idempotencyKey = key;
	}

	public readonly idempotencyKey: string;
}

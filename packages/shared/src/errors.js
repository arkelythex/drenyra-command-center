export class DomainError extends Error {
	code;
	statusCode;
	constructor(message, code, statusCode = 400) {
		super(message);
		this.code = code;
		this.statusCode = statusCode;
		this.name = this.constructor.name;
	}
}
export class ValidationError extends DomainError {
	constructor(message) {
		super(message, "VALIDATION_ERROR", 400);
	}
}
export class NotFoundError extends DomainError {
	constructor(resource, id) {
		super(`${resource} with id ${id} not found`, "NOT_FOUND", 404);
	}
}
export class UnauthorizedError extends DomainError {
	constructor(message = "Unauthorized") {
		super(message, "UNAUTHORIZED", 401);
	}
}
export class StorageError extends DomainError {
	constructor(message) {
		super(message, "STORAGE_ERROR", 500);
	}
}
export class AIExtractionError extends DomainError {
	constructor(message) {
		super(message, "AI_EXTRACTION_ERROR", 500);
	}
}
export class DatabaseError extends DomainError {
	constructor(message) {
		super(message, "DATABASE_ERROR", 500);
	}
}
export class BusinessRuleError extends DomainError {
	constructor(message) {
		super(message, "BUSINESS_RULE_ERROR", 422);
	}
}
export class ConcurrentModificationError extends DomainError {
	constructor(
		resource,
		message = "This record was modified by another user. Please refresh and try again.",
	) {
		super(message, "CONCURRENT_MODIFICATION", 409);
		this.resource = resource;
	}
	resource;
}
export class IdempotencyConflictError extends DomainError {
	constructor(key) {
		super(
			`Request with idempotency key "${key}" is already being processed`,
			"IDEMPOTENCY_CONFLICT",
			409,
		);
		this.idempotencyKey = key;
	}
	idempotencyKey;
}


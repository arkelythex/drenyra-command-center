export declare class DomainError extends Error {
	readonly code: string;
	readonly statusCode: number;
	constructor(message: string, code: string, statusCode?: number);
}
export declare class ValidationError extends DomainError {
	constructor(message: string);
}
export declare class NotFoundError extends DomainError {
	constructor(resource: string, id: string);
}
export declare class UnauthorizedError extends DomainError {
	constructor(message?: string);
}
export declare class StorageError extends DomainError {
	constructor(message: string);
}
export declare class AIExtractionError extends DomainError {
	constructor(message: string);
}
export declare class DatabaseError extends DomainError {
	constructor(message: string);
}
export declare class BusinessRuleError extends DomainError {
	constructor(message: string);
}
export declare class ConcurrentModificationError extends DomainError {
	constructor(resource: string, message?: string);
	readonly resource: string;
}
export declare class IdempotencyConflictError extends DomainError {
	constructor(key: string);
	readonly idempotencyKey: string;
}
//# sourceMappingURL=errors.d.ts.map

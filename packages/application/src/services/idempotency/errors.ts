/**
 * Idempotency Application Service — typed errors (ADR-009 / W2-03C).
 */

/**
 * Thrown when the same idempotency key is used with a different request payload.
 */
export class IdempotencyPayloadMismatchError extends Error {
	constructor(
		public readonly operation: string,
		public readonly idempotencyKey: string,
	) {
		super(
			`Idempotency key "${idempotencyKey}" for operation "${operation}" was already used with a different request payload`,
		);
		this.name = "IdempotencyPayloadMismatchError";
	}
}

/**
 * Thrown when a request with the same idempotency key is currently being processed.
 */
export class IdempotencyInProgressError extends Error {
	constructor(
		public readonly operation: string,
		public readonly idempotencyKey: string,
	) {
		super(
			`Request with idempotency key "${idempotencyKey}" for operation "${operation}" is already being processed`,
		);
		this.name = "IdempotencyInProgressError";
	}
}

/**
 * Thrown when a prior attempt ended with a terminal (non-retryable) failure.
 */
export class IdempotencyTerminalFailureError extends Error {
	constructor(
		public readonly operation: string,
		public readonly idempotencyKey: string,
		public readonly failureCode: string,
	) {
		super(
			`Operation "${operation}" with key "${idempotencyKey}" previously failed terminally: ${failureCode}`,
		);
		this.name = "IdempotencyTerminalFailureError";
	}
}

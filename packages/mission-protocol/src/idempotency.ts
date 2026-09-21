/**
 * Compatibility surface for the canonical drenyra-ai idempotency contract.
 * An idempotency key is bound to the command payload at creation time;
 * reusing the same key with a different payload is an idempotency conflict.
 */
export type {
	/** Idempotency conflict error detail. */
	IdempotencyConflict,
	/** Options for generating an idempotency key. */
	IdempotencyOptions,
} from "drenyra-ai/missions";
export {
	/** Default idempotency key factory: `<action>-<scope>-<timestamp>-<random>`. */
	defaultIdempotencyKey,
	/** Validates an idempotency key format (non-empty, valid characters). */
	isValidIdempotencyKey,
} from "drenyra-ai/missions";

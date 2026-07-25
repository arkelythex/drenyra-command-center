/**
 * Idempotency primitives (ADR-009).
 *
 * Pure, deterministic, infrastructure-free utilities for canonical
 * payload hashing used by the idempotency application service.
 */

export { canonicalizePayload, serializeCanonical } from "./canonical-payload";
export {
	HASH_ALGORITHM,
	HASH_LENGTH,
	HASH_PATTERN,
	hashPayload,
} from "./hash-payload";
export {
	assertHashPayloadInput,
	CANONICALIZATION_VERSION,
	type CanonicalizationFailureReason,
	type HashPayloadInput,
	HashPayloadValidationError,
	PayloadCanonicalizationError,
	PayloadCanonicalizationError as PayloadCanonicalizationErrorAlias,
} from "./types";

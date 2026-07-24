/**
 * Idempotency primitives (ADR-009).
 *
 * Pure, deterministic, infrastructure-free utilities for canonical
 * payload hashing used by the idempotency application service.
 */

export { canonicalizePayload, serializeCanonical } from "./canonical-payload";
export {
	hashPayload,
	HASH_ALGORITHM,
	HASH_LENGTH,
	HASH_PATTERN,
} from "./hash-payload";
export {
	assertHashPayloadInput,
	CANONICALIZATION_VERSION,
	HashPayloadValidationError,
	PayloadCanonicalizationError,
	PayloadCanonicalizationError as PayloadCanonicalizationErrorAlias,
	type CanonicalizationFailureReason,
	type HashPayloadInput,
} from "./types";

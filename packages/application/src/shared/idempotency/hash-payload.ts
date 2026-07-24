/**
 * Payload hashing with deterministic envelope (ADR-009).
 *
 * Wraps the canonical payload in a versioned envelope before hashing:
 * { operation, payloadVersion, canonicalizationVersion, payload }
 *
 * This ensures that:
 * - Changing the operation produces a different hash
 * - Changing the payload schema version produces a different hash
 * - Changing the canonicalization algorithm produces a different hash
 * - The same logical payload always produces the same hash
 */

import { createHash } from "node:crypto";
import { canonicalizePayload, serializeCanonical } from "./canonical-payload";
import {
	assertHashPayloadInput,
	CANONICALIZATION_VERSION,
	type HashPayloadInput,
	HashPayloadValidationError,
} from "./types";

export const HASH_ALGORITHM = "sha256" as const;
export const HASH_LENGTH = 64; // SHA-256 hex = 64 chars
export const HASH_PATTERN = /^[a-f0-9]{64}$/;

/**
 * Compute a deterministic SHA-256 hash of a payload.
 *
 * The hash covers the operation name, payload schema version,
 * canonicalization version, and the canonicalized payload itself.
 * This prevents accidental hash collisions when operations change
 * or when the canonicalization algorithm is updated.
 *
 * @param input - The operation and payload to hash
 * @returns 64-char lowercase hex SHA-256 digest
 * @throws {HashPayloadValidationError} if input is invalid
 * @throws {PayloadCanonicalizationError} if the payload cannot be canonicalized
 */
export function hashPayload(input: HashPayloadInput): string {
	assertHashPayloadInput(input);

	const envelope = {
		operation: input.operation,
		payloadVersion: input.payloadVersion,
		canonicalizationVersion: CANONICALIZATION_VERSION,
		payload: canonicalizePayload(input.payload),
	};

	const serialized = serializeCanonical(envelope);

	const digest = createHash(HASH_ALGORITHM)
		.update(serialized, "utf-8")
		.digest("hex");

	if (digest.length !== HASH_LENGTH || !HASH_PATTERN.test(digest)) {
		throw new HashPayloadValidationError(
			`Hash digest has unexpected format: length=${digest.length}, pattern=${HASH_PATTERN.test(digest)}`,
		);
	}

	return digest;
}

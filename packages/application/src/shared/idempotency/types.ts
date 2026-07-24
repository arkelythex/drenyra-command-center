/**
 * Types for canonical payload hashing (ADR-009).
 *
 * This module defines error types and configuration for the
 * deterministic payload canonicalization and hashing primitives.
 * It has zero dependencies on infrastructure, HTTP, or domain logic.
 */

// ─── Errors ───────────────────────────────────────────────────────────────────

export class PayloadCanonicalizationError extends Error {
	constructor(
		message: string,
		public readonly reason: CanonicalizationFailureReason,
	) {
		super(message);
		this.name = "PayloadCanonicalizationError";
	}
}

export type CanonicalizationFailureReason =
	| "unsupported-type"
	| "circular-reference"
	| "non-finite-number"
	| "class-instance"
	| "undefined-in-array";

// ─── Configuration ────────────────────────────────────────────────────────────

export const CANONICALIZATION_VERSION = 1 as const;

export interface HashPayloadInput {
	operation: string;
	payloadVersion: number;
	payload: unknown;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export class HashPayloadValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "HashPayloadValidationError";
	}
}

export function assertHashPayloadInput(input: HashPayloadInput): void {
	if (!input.operation || typeof input.operation !== "string") {
		throw new HashPayloadValidationError(
			`operation must be a non-empty string, got ${typeof input.operation}`,
		);
	}

	if (!Number.isInteger(input.payloadVersion) || input.payloadVersion < 1) {
		throw new HashPayloadValidationError(
			`payloadVersion must be a positive integer, got ${input.payloadVersion}`,
		);
	}
}

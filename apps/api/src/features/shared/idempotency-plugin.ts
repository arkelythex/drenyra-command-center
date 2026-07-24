/**
 * Elysia Idempotency Plugin (W2-03D / ADR-009).
 *
 * Thin transport adapter that:
 * 1. Extracts `idempotency-key` from request headers
 * 2. Validates presence, length, and format
 * 3. Makes the validated key available in route handlers
 * 4. Maps service-typed errors to HTTP responses
 * 5. Sets `Idempotency-Replayed` header on responses
 *
 * This plugin does NOT:
 * - Query the repository
 * - Compute payload hashes
 * - Decide state transitions
 * - Open database transactions
 */

import { Elysia } from "elysia";
import {
	IdempotencyInProgressError,
	IdempotencyPayloadMismatchError,
	IdempotencyTerminalFailureError,
} from "@drenyra/application/services/idempotency/errors";
import { fail } from "./api-response";

// ─── Header name ─────────────────────────────────────────────────────────────

export const IDEMPOTENCY_KEY_HEADER = "idempotency-key" as const;
export const IDEMPOTENCY_REPLAYED_HEADER = "idempotency-replayed" as const;

// ─── Context augmentation ───────────────────────────────────────────────────

declare module "elysia" {
	interface ElysiaContext {
		idempotencyKey: string;
	}
}

// ─── Plugin ──────────────────────────────────────────────────────────────────

export const idempotencyPlugin = new Elysia({
	name: "idempotency-transport",
})
	// Step 1: Extract the key from headers
	.derive({ as: "scoped" }, ({ request }) => {
		const rawKey = request.headers.get(IDEMPOTENCY_KEY_HEADER) ?? "";
		return { idempotencyKey: rawKey };
	})
	// Step 2: Validate presence and format
	.onBeforeHandle({ as: "scoped" }, ({ idempotencyKey, set }) => {
		if (!idempotencyKey) {
			set.status = 400;
			return fail(
				"Missing idempotency key. Include 'idempotency-key' header.",
				"IDEMPOTENCY_KEY_MISSING",
			);
		}

		if (idempotencyKey.length < 8) {
			set.status = 400;
			return fail(
				"Idempotency key must be at least 8 characters.",
				"IDEMPOTENCY_KEY_TOO_SHORT",
			);
		}

		if (idempotencyKey.length > 255) {
			set.status = 400;
			return fail(
				"Idempotency key must not exceed 255 characters.",
				"IDEMPOTENCY_KEY_TOO_LONG",
			);
		}

		return undefined;
	})
	// Step 3: Map service errors to HTTP responses
	.onError({ as: "scoped" }, ({ error, set }) => {
		if (
			error instanceof IdempotencyPayloadMismatchError ||
			error instanceof IdempotencyInProgressError
		) {
			set.status = 409;

			if (error instanceof IdempotencyInProgressError) {
				set.headers["retry-after"] = "5";
			}

			return fail(error.message, "IDEMPOTENCY_CONFLICT");
		}

		if (error instanceof IdempotencyTerminalFailureError) {
			set.status = 422;
			return fail(
				error.message,
				error.failureCode ?? "IDEMPOTENCY_TERMINAL_FAILURE",
			);
		}

		// Not an idempotency error — let the default error handler deal with it
		return;
	})
	.as("scoped");

// ─── Response helper ─────────────────────────────────────────────────────────

export interface IdempotencyResponseOptions {
	status: number;
	body: unknown;
	headers?: Record<string, string>;
}

/**
 * Apply an idempotent execution result to an Elysia response.
 *
 * Sets status, body, headers, and the Idempotency-Replayed header.
 * Route handlers call this after service.execute() returns.
 */
export function applyIdempotencyResult(
	set: { status: number; headers: Record<string, string> },
	result: {
		kind: "executed" | "replayed";
		response: IdempotencyResponseOptions;
	},
): object {
	set.status = result.response.status;
	set.headers[IDEMPOTENCY_REPLAYED_HEADER] = String(result.kind === "replayed");

	if (result.response.headers) {
		for (const [key, value] of Object.entries(result.response.headers)) {
			// Only set replayable headers (already sanitized by the service)
			set.headers[key] = value;
		}
	}

	return result.response.body === undefined
		? (null as unknown as object)
		: (result.response.body as object);
}

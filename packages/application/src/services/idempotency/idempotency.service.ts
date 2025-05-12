/**
 * Idempotency Application Service (ADR-009 / W2-03C).
 *
 * Orchestrates the idempotent execution of local PostgreSQL commands.
 *
 * Responsibilities:
 * - Compute deterministic request hash (W2-03A)
 * - Acquire ownership via repository (W2-03B / W2-03B.1)
 * - Execute handler only when kind = "acquired"
 * - Replay COMPLETED responses without invoking the handler
 * - Propagate ownership fencing token to markCompleted/markFailed
 * - Filter replayable headers via whitelist
 *
 * This service handles local atomic operations only. Long-running operations
 * with external effects (SUNAT, third-party APIs) require an outbox/worker
 * pattern outside W2-03C scope.
 */

import { hashPayload } from "../../shared/idempotency/hash-payload";
import type {
	AcquireInput,
	IdempotencyRepository,
	TxClient,
} from "./repository-types";
import {
	IdempotencyInProgressError,
	IdempotencyPayloadMismatchError,
	IdempotencyTerminalFailureError,
} from "./errors";

// ─── Public types ────────────────────────────────────────────────────────────

export interface ExecuteIdempotentlyInput<TCommand> {
	organizationId: string;
	companyId: string;
	operation: string;
	idempotencyKey: string;
	payloadVersion: number;
	command: TCommand;
	ttlMs: number;
	processingTimeoutMs: number;
}

export interface IdempotentResponse<TBody = unknown> {
	status: number;
	body: TBody | null;
	headers?: Record<string, string>;
}

export type IdempotentExecutionResult<TBody> =
	| {
			kind: "executed";
			response: IdempotentResponse<TBody>;
			attemptCount: number;
	  }
	| {
			kind: "replayed";
			response: IdempotentResponse<TBody>;
			attemptCount: number;
	  };

// ─── Handler failure disposition ─────────────────────────────────────────────

export type IdempotencyFailureDisposition =
	| { kind: "functional-response"; response: IdempotentResponse }
	| { kind: "retryable"; code: string }
	| { kind: "terminal"; code: string }
	| { kind: "rollback-only" };

// ─── Replayable headers ──────────────────────────────────────────────────────

const REPLAYABLE_HEADERS = new Set(["content-type", "location", "etag"]);

function sanitizeReplayableHeaders(
	headers?: Record<string, string>,
): Record<string, string> {
	if (!headers) return {};
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(headers)) {
		const lower = key.toLowerCase();
		if (REPLAYABLE_HEADERS.has(lower)) {
			result[lower] = value;
		}
	}
	return result;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class IdempotencyApplicationService {
	constructor(private readonly repository: IdempotencyRepository) {}

	async execute<TCommand, TBody>(
		input: ExecuteIdempotentlyInput<TCommand>,
		tx: TxClient,
		handler: (
			tx: TxClient,
			command: TCommand,
		) => Promise<IdempotentResponse<TBody>>,
		onFailure?: (
			error: unknown,
			command: unknown,
		) => IdempotencyFailureDisposition,
	): Promise<IdempotentExecutionResult<TBody>> {
		// Step 1: Compute deterministic request hash
		const requestHash = hashPayload({
			operation: input.operation,
			payloadVersion: input.payloadVersion,
			payload: input.command,
		});

		// Step 2: Build acquire input
		const acquireInput: AcquireInput = {
			organizationId: input.organizationId,
			companyId: input.companyId,
			operation: input.operation,
			idempotencyKey: input.idempotencyKey,
			requestHash,
			ttlMs: input.ttlMs,
		};

		// Step 3: Acquire ownership
		const decision = await this.repository.acquire(
			tx,
			acquireInput,
			input.processingTimeoutMs,
		);

		// Step 4: Route by decision
		switch (decision.kind) {
			case "completed": {
				return {
					kind: "replayed",
					response: {
						status: decision.responseStatus,
						body: decision.responseBody as TBody | null,
					},
					attemptCount: 1,
				};
			}

			case "payload-mismatch":
				throw new IdempotencyPayloadMismatchError(
					input.operation,
					input.idempotencyKey,
				);

			case "in-progress":
				throw new IdempotencyInProgressError(
					input.operation,
					input.idempotencyKey,
				);

			case "terminal-failure":
				throw new IdempotencyTerminalFailureError(
					input.operation,
					input.idempotencyKey,
					decision.failureCode,
				);

			case "acquired": {
				try {
					const response = await handler(tx, input.command);

					const cleanHeaders = sanitizeReplayableHeaders(response.headers);

					await this.repository.markCompleted(tx, {
						recordId: decision.recordId,
						ownershipToken: decision.ownershipToken,
						responseStatus: response.status,
						responseBody: response.body,
						responseHeaders: cleanHeaders,
					});

					return {
						kind: "executed",
						response,
						attemptCount: decision.attemptCount,
					};
				} catch (error) {
					return this.handleHandlerError(
						tx,
						decision,
						error,
						onFailure,
					) as Promise<IdempotentExecutionResult<TBody>>;
				}
			}
		}

		// Exhaustive switch guard (all AcquireDecision variants covered above)
		throw new Error(`Unreachable: unexpected acquire decision kind`);
	}

	// ─── Private: handler error handling ───────────────────────────────────

	private async handleHandlerError<TBody>(
		tx: TxClient,
		decision: {
			recordId: string;
			ownershipToken: string;
			attemptCount: number;
		},
		error: unknown,
		onFailure?: (
			error: unknown,
			command: unknown,
		) => IdempotencyFailureDisposition,
	): Promise<IdempotentExecutionResult<TBody>> {
		if (!onFailure) {
			throw error;
		}

		const disposition = onFailure(error, null);

		switch (disposition.kind) {
			case "functional-response": {
				const cleanHeaders = sanitizeReplayableHeaders(
					disposition.response.headers,
				);
				await this.repository.markCompleted(tx, {
					recordId: decision.recordId,
					ownershipToken: decision.ownershipToken,
					responseStatus: disposition.response.status,
					responseBody: disposition.response.body,
					responseHeaders: cleanHeaders,
				});
				return {
					kind: "executed" as const,
					response: disposition.response as IdempotentResponse<TBody>,
					attemptCount: decision.attemptCount,
				};
			}

			case "retryable": {
				await this.repository.markFailed(tx, {
					recordId: decision.recordId,
					ownershipToken: decision.ownershipToken,
					failureCode: disposition.code,
					failureClass: "RETRYABLE",
				});
				throw error;
			}

			case "terminal": {
				await this.repository.markFailed(tx, {
					recordId: decision.recordId,
					ownershipToken: decision.ownershipToken,
					failureCode: disposition.code,
					failureClass: "TERMINAL",
				});
				throw error;
			}

			case "rollback-only":
				throw error;
		}
	}
}

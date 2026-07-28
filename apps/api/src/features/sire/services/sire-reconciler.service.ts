/**
 * SIRE Reconciler Service — Phase D (Durable Execution)
 *
 * Handles reconciliation of submissions stuck in UNKNOWN state by querying
 * SUNAT for the actual status via trackingId.
 *
 * State machine: UNKNOWN → RECONCILING → COMPLETED | FAILED_RETRYABLE
 *
 * @see REQ-D-002
 */

import { createLogger } from "../../../lib/logger";

const logger = createLogger({ module: "sire-reconciler" });

/** Maximum backoff for RECONCILING retries (1 hour in ms) */
const MAX_BACKOFF_MS = 60 * 60 * 1000;

/** Default backoff base (2 minutes in ms) */
const BASE_BACKOFF_MS = 2 * 60 * 1000;

/**
 * Raw SUNAT reconciliation API response shape.
 */
export interface SunatReconciliationResponse {
	status: string;
	ticket?: string;
	message?: string;
	retryAfter?: number;
}

/**
 * Result of a reconciliation attempt.
 */
export type ReconciliationResult =
	| { status: "COMPLETED"; sunatTicket?: string }
	| { status: "FAILED_RETRYABLE"; reason: string }
	| { status: "RECONCILING"; nextRetryAt: Date };

export class SireReconcilerService {
	/**
	 * Query SUNAT for the actual status of a submission in UNKNOWN state.
	 *
	 * State transitions: UNKNOWN → RECONCILING → COMPLETED | FAILED_RETRYABLE
	 *
	 * @param submissionId - The ID of the submission to reconcile
	 * @param sunatResponse - The response from the SUNAT status query API
	 * @returns ReconciliationResult indicating the new state
	 */
	static async reconcileUnknown(
		submissionId: string,
		sunatResponse: SunatReconciliationResponse,
	): Promise<ReconciliationResult> {
		logger.info(
			{ submissionId, sunatStatus: sunatResponse.status },
			"Reconciling UNKNOWN submission",
		);

		const determination =
			SireReconcilerService.determineReconciliationStatus(sunatResponse);

		switch (determination) {
			case "COMPLETED":
				logger.info(
					{ submissionId, sunatTicket: sunatResponse.ticket },
					"Reconciliation: SUNAT confirmed receipt → COMPLETED",
				);
				return {
					status: "COMPLETED",
					sunatTicket: sunatResponse.ticket,
				};

			case "FAILED_RETRYABLE":
				logger.info(
					{ submissionId, reason: sunatResponse.message },
					"Reconciliation: SUNAT has no record → FAILED_RETRYABLE",
				);
				return {
					status: "FAILED_RETRYABLE",
					reason:
						sunatResponse.message || "SUNAT has no record of this submission",
				};

			case "RECONCILING":
			default: {
				const backoffMs =
					(sunatResponse.retryAfter ?? 0) > 0
						? sunatResponse.retryAfter! * 1000
						: SireReconcilerService.computeBackoff(1);
				const nextRetryAt = new Date(Date.now() + backoffMs);

				logger.info(
					{ submissionId, nextRetryAt: nextRetryAt.toISOString() },
					"Reconciliation: SUNAT unavailable → staying in RECONCILING",
				);
				return {
					status: "RECONCILING",
					nextRetryAt,
				};
			}
		}
	}

	/**
	 * Determine the reconciliation status from a SUNAT API response.
	 *
	 * Acceptable SUNAT response statuses:
	 * - "ACEPTADO" / "ACCEPTED" → COMPLETED
	 * - "NOT_FOUND" / "NO_RECORD" → FAILED_RETRYABLE
	 * - "SERVICE_UNAVAILABLE" / 503 → RECONCILING
	 * - Anything else → RECONCILING (conservative)
	 */
	static determineReconciliationStatus(
		response: SunatReconciliationResponse,
	): "COMPLETED" | "FAILED_RETRYABLE" | "RECONCILING" {
		const status = response.status.trim().toUpperCase();

		if (status === "ACEPTADO" || status === "ACCEPTED") {
			return "COMPLETED";
		}

		if (
			status === "NOT_FOUND" ||
			status === "NO_RECORD" ||
			status === "NO_ENCONTRADO"
		) {
			return "FAILED_RETRYABLE";
		}

		// Conservative: treat unknown/unavailable as RECONCILING
		return "RECONCILING";
	}

	/**
	 * Compute exponential backoff delay for RECONCILING retries.
	 *
	 * Formula: min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2^attempt)
	 *
	 * @param attempt - Current attempt number (1-based)
	 * @returns Delay in milliseconds
	 */
	static computeBackoff(attempt: number): number {
		const exponent = Math.max(0, attempt - 1);
		const raw = BASE_BACKOFF_MS * 2 ** exponent;
		return Math.min(MAX_BACKOFF_MS, raw);
	}

	/**
	 * Sweeper: detect submissions stuck in RECONCILING for too long.
	 *
	 * Uses SELECT ... FOR UPDATE SKIP LOCKED pattern to prevent conflicts.
	 * Resets stuck submissions to UNKNOWN for re-enqueueing.
	 *
	 * @param stuckThresholdMs - How long a submission must be RECONCILING to be considered stuck (default 30 min)
	 * @returns Number of submissions reset
	 */
	static async sweepStuckReconciling(
		stuckThresholdMs: number = 30 * 60 * 1000,
	): Promise<number> {
		// This is a skeleton. In production, this queries the DB with:
		// SELECT ... FOR UPDATE SKIP LOCKED
		// WHERE status = 'RECONCILING' AND updated_at < now() - stuckThresholdMs
		// And resets to UNKNOWN
		logger.info(
			{ stuckThresholdMs },
			"RECONCILING sweeper triggered (DB integration pending)",
		);
		return 0;
	}
}

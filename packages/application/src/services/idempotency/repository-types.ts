/**
 * Minimal repository types for the IdempotencyApplicationService.
 *
 * The application service depends on the repository interface and its
 * input/output types. These are defined locally to avoid a hard runtime
 * dependency on the persistence package — they are pure TypeScript
 * interfaces that are erased at runtime.
 */

// ─── Transaction client ──────────────────────────────────────────────────────

/**
 * Transactional database client accepted by the service and passed
 * to the handler. Accepts both unit-of-work transactions and
 * direct database clients — the handler decides how to use it.
 */
export type TxClient = unknown;

// ─── Repository input types ──────────────────────────────────────────────────

export interface AcquireInput {
	organizationId: string;
	companyId: string;
	operation: string;
	idempotencyKey: string;
	requestHash: string;
	ttlMs?: number;
}

export interface MarkCompletedInput {
	recordId: string;
	ownershipToken: string;
	responseStatus: number;
	responseBody: unknown;
	responseHeaders: Record<string, string>;
}

export interface MarkFailedInput {
	recordId: string;
	ownershipToken: string;
	failureCode: string;
	failureClass: "RETRYABLE" | "TERMINAL";
}

// ─── Repository port ─────────────────────────────────────────────────────────

export type AcquireDecision =
	| {
			kind: "acquired";
			recordId: string;
			ownershipToken: string;
			attemptCount: number;
	  }
	| {
			kind: "completed";
			recordId: string;
			responseStatus: number;
			responseBody: unknown;
	  }
	| { kind: "in-progress"; recordId: string }
	| { kind: "terminal-failure"; recordId: string; failureCode: string }
	| { kind: "payload-mismatch"; recordId: string };

export interface IdempotencyRepository {
	acquire(
		tx: TxClient,
		input: AcquireInput,
		processingTimeoutMs: number,
	): Promise<AcquireDecision>;

	markCompleted(tx: TxClient, input: MarkCompletedInput): Promise<void>;

	markFailed(tx: TxClient, input: MarkFailedInput): Promise<void>;
}

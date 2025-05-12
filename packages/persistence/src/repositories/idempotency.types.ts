/**
 * Idempotency Repository Types (ADR-009 / W2-03B).
 *
 * Domain-relevant decisions returned by the repository.
 * No CRUD — only semantic acquisition results.
 */

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { DbTransaction } from "../unit-of-work";

/**
 * Transactional database client accepted by the repository.
 *
 * Accepts both:
 * - DbTransaction (from UnitOfWork / Drizzle's PgTransaction)
 * - PostgresJsDatabase (from TestDatabase.beginTransaction())
 *
 * Both implement the same query builder interface used by the repository.
 */
export type TxClient = DbTransaction | PostgresJsDatabase;

/**
 * Ownership fencing token generated on each acquire().
 * Used as compare-and-swap for markCompleted/markFailed to
 * prevent stale workers from modifying records after lease expiry.
 */
export type OwnershipToken = string;

// ─── Errors ───────────────────────────────────────────────────────────────────

export class IdempotencyStateError extends Error {
	constructor(
		message: string,
		public readonly expectedState: string,
		public readonly actualState: string,
		public readonly recordId: string,
	) {
		super(message);
		this.name = "IdempotencyStateError";
	}
}

/**
 * Thrown when markCompleted or markFailed cannot match the
 * expected ownership token, indicating another worker has
 * since acquired or completed this record.
 */
export class IdempotencyOwnershipLostError extends Error {
	constructor(
		public readonly recordId: string,
		public readonly operation: string,
	) {
		super(
			`Ownership lost for record ${recordId} during ${operation}: another worker has since acquired or completed this record`,
		);
		this.name = "IdempotencyOwnershipLostError";
	}
}

// ─── Input ────────────────────────────────────────────────────────────────────

/** Default TTL for new idempotency records (24 hours) */
export const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/** Extended TTL for fiscal operations (7 days) */
export const FISCAL_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AcquireInput {
	organizationId: string;
	companyId: string;
	operation: string;
	idempotencyKey: string;
	requestHash: string;
	/** TTL in milliseconds for newly created records (defaults to 24h) */
	ttlMs?: number;
}

export interface MarkCompletedInput {
	recordId: string;
	ownershipToken: OwnershipToken;
	responseStatus: number;
	responseBody: unknown;
	responseHeaders: Record<string, string>;
}

export interface MarkFailedInput {
	recordId: string;
	ownershipToken: OwnershipToken;
	failureCode: string;
	failureClass: "RETRYABLE" | "TERMINAL";
}

// ─── AcquireDecision — closed result type ─────────────────────────────────────

export type AcquireDecision =
	| {
			kind: "acquired";
			recordId: string;
			ownershipToken: OwnershipToken;
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

// ─── Repository port ──────────────────────────────────────────────────────────

export interface IdempotencyRepository {
	/**
	 * Atomically reserve or load an idempotency record.
	 *
	 * On acquire, generates a new ownershipToken used as CAS for
	 * subsequent markCompleted/markFailed calls.
	 */
	acquire(
		tx: TxClient,
		input: AcquireInput,
		processingTimeoutMs: number,
	): Promise<AcquireDecision>;

	/**
	 * Mark a record as COMPLETED with response data.
	 *
	 * Requires a valid ownershipToken from the acquire() call.
	 * @throws {IdempotencyOwnershipLostError} if token doesn't match
	 * @throws {IdempotencyStateError} if state is incompatible
	 */
	markCompleted(tx: TxClient, input: MarkCompletedInput): Promise<void>;

	/**
	 * Mark a record as FAILED with failure details.
	 *
	 * Requires a valid ownershipToken from the acquire() call.
	 * @throws {IdempotencyOwnershipLostError} if token doesn't match
	 * @throws {IdempotencyStateError} if state is incompatible
	 */
	markFailed(tx: TxClient, input: MarkFailedInput): Promise<void>;

	/**
	 * Read-only lookup by full scope.
	 */
	findByScopeAndKey(
		tx: TxClient,
		input: AcquireInput,
	): Promise<{
		id: string;
		status: string;
		requestHash: string;
		responseStatus: number | null;
		responseBody: unknown;
		failureClass: string | null;
		lockedAt: Date | null;
	} | null>;
}

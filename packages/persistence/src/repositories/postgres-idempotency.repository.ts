/**
 * PostgreSQL implementation of IdempotencyRepository (ADR-009 / W2-03B).
 *
 * All critical operations are atomic, using INSERT ON CONFLICT for
 * reservation and conditional UPDATE with WHERE + RETURNING for
 * compare-and-swap state transitions.
 *
 * Ownership fencing via processing_token: each acquire() generates a
 * unique UUID that must be presented in markCompleted/markFailed.
 * Workers with stale tokens (after lease expiry + recovery) cannot
 * modify the record.
 *
 * No SELECT ... FOR UPDATE is held across long operations — ownership
 * is acquired with a short atomic transition and released only via
 * markCompleted/markFailed within the same transaction.
 */

import { and, eq, sql } from "drizzle-orm";
import { idempotencyRecords } from "../schema/idempotency.schema";
import type {
	AcquireDecision,
	AcquireInput,
	IdempotencyRepository,
	MarkCompletedInput,
	MarkFailedInput,
	TxClient,
} from "./idempotency.types";

const DEFAULT_PROCESSING_TIMEOUT_MS = 30_000;

/** Shape returned by the SELECT after INSERT ON CONFLICT */
interface RecordRow {
	id: string;
	status: string;
	requestHash: string;
	responseStatus: number | null;
	responseBody: unknown;
	failureCode: string | null;
	failureClass: string | null;
	lockedAt: Date | null;
	processingToken: string | null;
	attemptCount: number;
}

export class PostgresIdempotencyRepository implements IdempotencyRepository {
	async acquire(
		tx: TxClient,
		input: AcquireInput,
		processingTimeoutMs: number = DEFAULT_PROCESSING_TIMEOUT_MS,
	): Promise<AcquireDecision> {
		void this.tryInsertPending(tx, input);
		const record = await this.selectByScope(tx, input);

		if (!record) {
			return {
				kind: "acquired",
				recordId: "",
				ownershipToken: "",
				attemptCount: 1,
			};
		}

		if (record.requestHash !== input.requestHash) {
			return { kind: "payload-mismatch", recordId: record.id };
		}

		return this.routeByStatus(tx, record, processingTimeoutMs);
	}

	async markCompleted(tx: TxClient, input: MarkCompletedInput): Promise<void> {
		const result = await tx.execute(
			sql`
				UPDATE idempotency_records
				SET
					status = 'COMPLETED',
					processing_token = NULL,
					response_status = ${input.responseStatus},
					response_body = ${JSON.stringify(input.responseBody)}::jsonb,
					response_headers = ${JSON.stringify(input.responseHeaders)}::jsonb,
					completed_at = NOW(),
					updated_at = NOW()
				WHERE id = ${input.recordId}
					AND status = 'PROCESSING'
					AND processing_token = ${input.ownershipToken}
				RETURNING id
			`,
		);

		if (result.length === 0) {
			await this.throwOwnershipOrStateError(
				tx,
				input.recordId,
				"COMPLETED",
				input.ownershipToken,
			);
		}
	}

	async markFailed(tx: TxClient, input: MarkFailedInput): Promise<void> {
		const result = await tx.execute(
			sql`
				UPDATE idempotency_records
				SET
					status = 'FAILED',
					processing_token = NULL,
					failure_code = ${input.failureCode},
					failure_class = ${input.failureClass}::failure_class,
					failed_at = NOW(),
					updated_at = NOW()
				WHERE id = ${input.recordId}
					AND status = 'PROCESSING'
					AND processing_token = ${input.ownershipToken}
				RETURNING id
			`,
		);

		if (result.length === 0) {
			await this.throwOwnershipOrStateError(
				tx,
				input.recordId,
				"FAILED",
				input.ownershipToken,
			);
		}
	}

	async findByScopeAndKey(
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
	} | null> {
		const rows = await tx
			.select({
				id: idempotencyRecords.id,
				status: idempotencyRecords.status,
				requestHash: idempotencyRecords.requestHash,
				responseStatus: idempotencyRecords.responseStatus,
				responseBody: idempotencyRecords.responseBody,
				failureClass: idempotencyRecords.failureClass,
				lockedAt: idempotencyRecords.lockedAt,
			})
			.from(idempotencyRecords)
			.where(
				and(
					eq(idempotencyRecords.organizationId, input.organizationId),
					eq(idempotencyRecords.companyId, input.companyId),
					eq(idempotencyRecords.operation, input.operation),
					eq(idempotencyRecords.idempotencyKey, input.idempotencyKey),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}

	// ─── Private helpers ──────────────────────────────────────────────────

	private async tryInsertPending(
		tx: TxClient,
		input: AcquireInput,
	): Promise<void> {
		const ttlMs = input.ttlMs ?? 24 * 60 * 60 * 1000;
		await tx.execute(
			sql`
				INSERT INTO idempotency_records (
					organization_id, company_id, operation, idempotency_key,
					request_hash, status, expires_at
				) VALUES (
					${input.organizationId}, ${input.companyId}, ${input.operation},
					${input.idempotencyKey}, ${input.requestHash}, 'PENDING',
					NOW() + (${ttlMs} || ' milliseconds')::interval
				)
				ON CONFLICT (organization_id, company_id, operation, idempotency_key)
				DO NOTHING
			`,
		);
	}

	private async selectByScope(
		tx: TxClient,
		input: AcquireInput,
	): Promise<RecordRow | null> {
		const rows = await tx
			.select({
				id: idempotencyRecords.id,
				status: idempotencyRecords.status,
				requestHash: idempotencyRecords.requestHash,
				responseStatus: idempotencyRecords.responseStatus,
				responseBody: idempotencyRecords.responseBody,
				failureCode: idempotencyRecords.failureCode,
				failureClass: idempotencyRecords.failureClass,
				lockedAt: idempotencyRecords.lockedAt,
				processingToken: idempotencyRecords.processingToken,
				attemptCount: idempotencyRecords.attemptCount,
			})
			.from(idempotencyRecords)
			.where(
				and(
					eq(idempotencyRecords.organizationId, input.organizationId),
					eq(idempotencyRecords.companyId, input.companyId),
					eq(idempotencyRecords.operation, input.operation),
					eq(idempotencyRecords.idempotencyKey, input.idempotencyKey),
				),
			)
			.limit(1);

		return rows[0] ?? null;
	}

	private async routeByStatus(
		tx: TxClient,
		record: RecordRow,
		timeoutMs: number,
	): Promise<AcquireDecision> {
		switch (record.status) {
			case "COMPLETED":
				return {
					kind: "completed",
					recordId: record.id,
					responseStatus: record.responseStatus ?? 200,
					responseBody: record.responseBody,
				};

			case "PROCESSING":
				return this.handleProcessing(tx, record, timeoutMs);

			case "FAILED":
				return this.handleFailed(tx, record);

			case "PENDING":
				return this.handlePending(tx, record);

			default:
				return { kind: "in-progress", recordId: record.id };
		}
	}

	private async handleProcessing(
		tx: TxClient,
		record: RecordRow,
		timeoutMs: number,
	): Promise<AcquireDecision> {
		const lockedAt = record.lockedAt;
		if (lockedAt) {
			const elapsed = Date.now() - lockedAt.getTime();
			if (elapsed < timeoutMs) {
				return { kind: "in-progress", recordId: record.id };
			}
		}

		// Stale: generate new token, compare-and-swap on locked_at
		const updated = await tx.execute(
			sql`
				UPDATE idempotency_records
				SET
					locked_at = NOW(),
					processing_token = gen_random_uuid(),
					attempt_count = attempt_count + 1,
					updated_at = NOW()
				WHERE id = ${record.id}
					AND status = 'PROCESSING'
					AND locked_at = ${record.lockedAt}
				RETURNING id, attempt_count, processing_token
			`,
		);

		if (updated.length > 0 && updated[0]?.id) {
			return {
				kind: "acquired",
				recordId: record.id,
				ownershipToken: updated[0].processing_token as string,
				attemptCount: Number(updated[0].attempt_count),
			};
		}
		return { kind: "in-progress", recordId: record.id };
	}

	private async handleFailed(
		tx: TxClient,
		record: RecordRow,
	): Promise<AcquireDecision> {
		if (record.failureClass === "TERMINAL") {
			return {
				kind: "terminal-failure",
				recordId: record.id,
				failureCode: record.failureCode ?? "UNKNOWN",
			};
		}

		// RETRYABLE: transition to PROCESSING with new token, clear failure fields
		const updated = await tx.execute(
			sql`
				UPDATE idempotency_records
				SET
					status = 'PROCESSING',
					locked_at = NOW(),
					processing_token = gen_random_uuid(),
					attempt_count = attempt_count + 1,
					failure_code = NULL,
					failure_class = NULL,
					failed_at = NULL,
					updated_at = NOW()
				WHERE id = ${record.id}
					AND status = 'FAILED'
					AND (failure_class = 'RETRYABLE' OR failure_class IS NULL)
				RETURNING id, attempt_count, processing_token
			`,
		);

		if (updated.length > 0 && updated[0]?.id) {
			return {
				kind: "acquired",
				recordId: record.id,
				ownershipToken: updated[0].processing_token as string,
				attemptCount: Number(updated[0].attempt_count),
			};
		}
		return {
			kind: "terminal-failure",
			recordId: record.id,
			failureCode: "CONCURRENCY_LOST",
		};
	}

	private async handlePending(
		tx: TxClient,
		record: RecordRow,
	): Promise<AcquireDecision> {
		const updated = await tx.execute(
			sql`
				UPDATE idempotency_records
				SET
					status = 'PROCESSING',
					locked_at = NOW(),
					processing_token = gen_random_uuid(),
					updated_at = NOW()
				WHERE id = ${record.id}
					AND status = 'PENDING'
				RETURNING id, attempt_count, processing_token
			`,
		);

		if (updated.length > 0 && updated[0]?.id) {
			return {
				kind: "acquired",
				recordId: record.id,
				ownershipToken: updated[0].processing_token as string,
				attemptCount: Number(updated[0].attempt_count),
			};
		}
		return { kind: "in-progress", recordId: record.id };
	}

	private async throwOwnershipOrStateError(
		tx: TxClient,
		recordId: string,
		target: string,
		expectedToken: string,
	): Promise<never> {
		const current = await tx
			.select({
				status: idempotencyRecords.status,
				processingToken: idempotencyRecords.processingToken,
			})
			.from(idempotencyRecords)
			.where(eq(idempotencyRecords.id, recordId))
			.limit(1);

		const row = current[0];

		if (!row) {
			throw new Error(`Record ${recordId} not found`);
		}

		const { status, processingToken } = row;

		// Token mismatch means another worker acquired ownership
		if (
			status === "PROCESSING" &&
			processingToken !== null &&
			processingToken !== expectedToken
		) {
			const lostErr = new Error(
				`Ownership lost for record ${recordId} during ${target}: another worker has since acquired this record`,
			);
			lostErr.name = "IdempotencyOwnershipLostError";
			throw lostErr;
		}

		// State mismatch
		const stateErr = new Error(
			`Cannot transition ${status} → ${target} for record ${recordId}`,
		);
		stateErr.name = "IdempotencyStateError";
		throw stateErr;
	}
}

export { DEFAULT_PROCESSING_TIMEOUT_MS };

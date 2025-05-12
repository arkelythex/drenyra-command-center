/**
 * PostgresIdempotencyRepository — PostgreSQL integration tests (W2-03B + W2-03B.1).
 *
 * Requires DATABASE_URL_TEST environment variable.
 *
 * Ownership fencing tests verify that processing_token gates all mutations.
 */

import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { TestDatabase } from "@drenyra/test-utils/database";
import { PostgresIdempotencyRepository } from "../postgres-idempotency.repository";
import type {
	AcquireInput,
	AcquireDecision,
	TxClient,
} from "../idempotency.types";

const runIfDb = describe;

const ORG_A = "test-org-a";
const C_A1 = "00000000-0000-0000-0000-0000000000a1";
const C_A2 = "00000000-0000-0000-0000-0000000000a2";
const OP = "test.op:v1";
const KEY = "test-idempotency-key-001";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const BASE_INPUT: AcquireInput = {
	organizationId: ORG_A,
	companyId: C_A1,
	operation: OP,
	idempotencyKey: KEY,
	requestHash: HASH_A,
	ttlMs: 3600_000,
};

const TIMEOUT_MS = 500;

// ─── Type guards ─────────────────────────────────────────────────────────────

function acquired(d: AcquireDecision): d is AcquireDecision & {
	kind: "acquired";
	ownershipToken: string;
	attemptCount: number;
} {
	return d.kind === "acquired";
}

function mustAcquire(d: AcquireDecision): {
	recordId: string;
	ownershipToken: string;
	attemptCount: number;
} {
	if (!acquired(d)) throw new Error(`Expected acquired, got ${d.kind}`);
	return {
		recordId: d.recordId,
		ownershipToken: d.ownershipToken,
		attemptCount: d.attemptCount,
	};
}

function isCompleted(d: AcquireDecision): d is AcquireDecision & {
	kind: "completed";
	responseStatus: number;
	responseBody: unknown;
} {
	return d.kind === "completed";
}

// ─── Transaction helper ──────────────────────────────────────────────────────

async function withTx<T>(
	fn: (repo: PostgresIdempotencyRepository, tx: TxClient) => Promise<T>,
): Promise<T> {
	const testDb = new TestDatabase();
	await testDb.setup();
	try {
		const tx = await testDb.beginTransaction();
		const repo = new PostgresIdempotencyRepository();
		try {
			return await fn(repo, tx as unknown as TxClient);
		} finally {
			await testDb.rollbackTransaction();
		}
	} finally {
		await testDb.teardown();
	}
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("PostgresIdempotencyRepository", () => {
	// ─── T1: First acquisition ────────────────────────────────────────────

	it("1. first acquire creates, acquires, and returns ownershipToken", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			expect(d.recordId).toBeTruthy();
			expect(d.ownershipToken).toBeTruthy();
			expect(typeof d.ownershipToken).toBe("string");
			expect(d.attemptCount).toBe(1);
		});
	});

	// ─── T2: Concurrent reservation ───────────────────────────────────────

	it("2. two concurrent acquires — only one succeeds", async () => {
		await withTx(async (repo, tx) => {
			const [d1, d2] = await Promise.all([
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
			]);

			expect([d1, d2].filter(acquired)).toHaveLength(1);
			expect([d1, d2].filter((d) => d.kind === "in-progress")).toHaveLength(1);
		});
	});

	// ─── T3: Payload mismatch ─────────────────────────────────────────────

	it("3. payload-mismatch on different hash", async () => {
		await withTx(async (repo, tx) => {
			mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));

			const mismatch = await repo.acquire(
				tx,
				{ ...BASE_INPUT, requestHash: HASH_B },
				TIMEOUT_MS,
			);
			expect(mismatch.kind).toBe("payload-mismatch");
		});
	});

	// ─── T4: COMPLETED replay ─────────────────────────────────────────────

	it("4. COMPLETED replays stored response", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			await repo.markCompleted(tx, {
				recordId: d.recordId,
				ownershipToken: d.ownershipToken,
				responseStatus: 201,
				responseBody: { id: "case-123" },
				responseHeaders: { "content-type": "application/json" },
			});

			const replay = await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS);
			expect(replay.kind).toBe("completed");
			if (isCompleted(replay)) {
				expect(replay.responseStatus).toBe(201);
				expect(replay.responseBody).toEqual({ id: "case-123" });
			}
		});
	});

	// ─── T5: FAILED(RETRYABLE) retry ──────────────────────────────────────

	it("5. FAILED(RETRYABLE) retries — acquires with incremented attempt and new token", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			await repo.markFailed(tx, {
				recordId: d.recordId,
				ownershipToken: d.ownershipToken,
				failureCode: "TIMEOUT",
				failureClass: "RETRYABLE",
			});

			const retry = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			expect(retry.attemptCount).toBe(2);
			expect(retry.ownershipToken).not.toBe(d.ownershipToken);
		});
	});

	// ─── T6: FAILED(TERMINAL) no retry ────────────────────────────────────

	it("6. FAILED(TERMINAL) returns terminal-failure", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			await repo.markFailed(tx, {
				recordId: d.recordId,
				ownershipToken: d.ownershipToken,
				failureCode: "FORBIDDEN_PERIOD",
				failureClass: "TERMINAL",
			});

			expect((await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS)).kind).toBe(
				"terminal-failure",
			);
		});
	});

	// ─── T7: PROCESSING recent ────────────────────────────────────────────

	it("7. PROCESSING (recent) returns in-progress", async () => {
		await withTx(async (repo, tx) => {
			mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			expect((await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS)).kind).toBe(
				"in-progress",
			);
		});
	});

	// ─── T8: PROCESSING stale ─────────────────────────────────────────────

	it("8. stale PROCESSING recovers — one winner, new token", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, 1));
			const oldToken = d.ownershipToken;

			await tx.execute(
				sql`UPDATE idempotency_records SET locked_at = NOW() - INTERVAL '10 seconds' WHERE id = ${d.recordId}`,
			);

			const [r1, r2] = await Promise.all([
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
			]);

			const winners = [r1, r2].filter(acquired);
			expect(winners).toHaveLength(1);
			expect(winners[0].ownershipToken).not.toBe(oldToken);
			expect([r1, r2].filter((r) => r.kind === "in-progress")).toHaveLength(1);
		});
	});

	// ─── T9: markCompleted from COMPLETED ─────────────────────────────────

	it("9. markCompleted from COMPLETED throws", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			await repo.markCompleted(tx, {
				recordId: d.recordId,
				ownershipToken: d.ownershipToken,
				responseStatus: 200,
				responseBody: null,
				responseHeaders: {},
			});

			await expect(
				repo.markCompleted(tx, {
					recordId: d.recordId,
					ownershipToken: d.ownershipToken,
					responseStatus: 200,
					responseBody: null,
					responseHeaders: {},
				}),
			).rejects.toThrow(/Cannot transition COMPLETED/);
		});
	});

	// ─── T10: markFailed from COMPLETED ───────────────────────────────────

	it("10. markFailed from COMPLETED throws", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			await repo.markCompleted(tx, {
				recordId: d.recordId,
				ownershipToken: d.ownershipToken,
				responseStatus: 200,
				responseBody: null,
				responseHeaders: {},
			});

			await expect(
				repo.markFailed(tx, {
					recordId: d.recordId,
					ownershipToken: d.ownershipToken,
					failureCode: "LATE",
					failureClass: "RETRYABLE",
				}),
			).rejects.toThrow(/Cannot transition COMPLETED/);
		});
	});

	// ─── T11: Cross-company isolation ─────────────────────────────────────

	it("11. same key across companies — independent", async () => {
		await withTx(async (repo, tx) => {
			const dA = mustAcquire(
				await repo.acquire(tx, { ...BASE_INPUT, companyId: C_A1 }, TIMEOUT_MS),
			);
			const dB = mustAcquire(
				await repo.acquire(tx, { ...BASE_INPUT, companyId: C_A2 }, TIMEOUT_MS),
			);
			expect(dA.recordId).not.toBe(dB.recordId);
		});
	});

	// ─── T12: Cross-organization isolation ────────────────────────────────

	it("12. same key across organizations — independent", async () => {
		await withTx(async (repo, tx) => {
			const dA = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, organizationId: ORG_A },
					TIMEOUT_MS,
				),
			);
			const dB = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, organizationId: "test-org-b" },
					TIMEOUT_MS,
				),
			);
			expect(dA.recordId).not.toBe(dB.recordId);
		});
	});

	// ─── T13: Same key, different operation ───────────────────────────────

	it("13. same key with different operation — independent", async () => {
		await withTx(async (repo, tx) => {
			const d1 = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, operation: "op1:v1" },
					TIMEOUT_MS,
				),
			);
			const d2 = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, operation: "op2:v1" },
					TIMEOUT_MS,
				),
			);
			expect(d1.recordId).not.toBe(d2.recordId);
		});
	});

	// ─── T14: Transaction rollback ────────────────────────────────────────

	it("14. on rollback, no record survives", async () => {
		const testDb = new TestDatabase();
		await testDb.setup();
		try {
			const tx1 = await testDb.beginTransaction();
			mustAcquire(
				await new PostgresIdempotencyRepository().acquire(
					tx1 as unknown as TxClient,
					BASE_INPUT,
					TIMEOUT_MS,
				),
			);
			await testDb.rollbackTransaction();

			const tx2 = await testDb.beginTransaction();
			const rows = await (tx2 as unknown as TxClient).execute(
				sql`SELECT id FROM idempotency_records WHERE idempotency_key = ${KEY}`,
			);
			expect(rows).toHaveLength(0);
			await testDb.rollbackTransaction();
		} finally {
			await testDb.teardown();
		}
	});

	// ══════════════════════════════════════════════════════════════════════
	// OWNERSHIP FENCING — W2-03B.1
	// ══════════════════════════════════════════════════════════════════════

	it("15. each acquire generates a distinct token", async () => {
		await withTx(async (repo, tx) => {
			const d1 = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, idempotencyKey: "k1" },
					TIMEOUT_MS,
				),
			);
			const d2 = mustAcquire(
				await repo.acquire(
					tx,
					{ ...BASE_INPUT, idempotencyKey: "k2" },
					TIMEOUT_MS,
				),
			);
			expect(d1.ownershipToken).not.toBe(d2.ownershipToken);
		});
	});

	it("16. stale recovery generates a different token", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, 1));
			const oldToken = d.ownershipToken;

			await tx.execute(
				sql`UPDATE idempotency_records SET locked_at = NOW() - INTERVAL '10 seconds' WHERE id = ${d.recordId}`,
			);

			const r = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));
			expect(r.ownershipToken).not.toBe(oldToken);
		});
	});

	it("17. old token cannot markCompleted after recovery", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, 1));
			const oldToken = d.ownershipToken;

			await tx.execute(
				sql`UPDATE idempotency_records SET locked_at = NOW() - INTERVAL '10 seconds' WHERE id = ${d.recordId}`,
			);
			// recover — ownershipToken changes
			mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));

			await expect(
				repo.markCompleted(tx, {
					recordId: d.recordId,
					ownershipToken: oldToken,
					responseStatus: 200,
					responseBody: null,
					responseHeaders: {},
				}),
			).rejects.toThrow(/Ownership lost/);
		});
	});

	it("18. old token cannot markFailed after recovery", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, 1));
			const oldToken = d.ownershipToken;

			await tx.execute(
				sql`UPDATE idempotency_records SET locked_at = NOW() - INTERVAL '10 seconds' WHERE id = ${d.recordId}`,
			);
			mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));

			await expect(
				repo.markFailed(tx, {
					recordId: d.recordId,
					ownershipToken: oldToken,
					failureCode: "STALE",
					failureClass: "RETRYABLE",
				}),
			).rejects.toThrow(/Ownership lost/);
		});
	});

	it("19. current token can markCompleted; processing_token becomes NULL", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));

			await expect(
				repo.markCompleted(tx, {
					recordId: d.recordId,
					ownershipToken: d.ownershipToken,
					responseStatus: 201,
					responseBody: { ok: true },
					responseHeaders: {},
				}),
			).resolves.toBeUndefined();

			const rows = await (tx as TxClient).execute(
				sql`SELECT processing_token FROM idempotency_records WHERE id = ${d.recordId}`,
			);
			expect(rows[0]?.processing_token).toBeNull();
		});
	});

	it("20. current token can markFailed; processing_token becomes NULL", async () => {
		await withTx(async (repo, tx) => {
			const d = mustAcquire(await repo.acquire(tx, BASE_INPUT, TIMEOUT_MS));

			await expect(
				repo.markFailed(tx, {
					recordId: d.recordId,
					ownershipToken: d.ownershipToken,
					failureCode: "ERR",
					failureClass: "RETRYABLE",
				}),
			).resolves.toBeUndefined();

			const rows = await (tx as TxClient).execute(
				sql`SELECT processing_token, status FROM idempotency_records WHERE id = ${d.recordId}`,
			);
			expect(rows[0]?.processing_token).toBeNull();
			expect(rows[0]?.status).toBe("FAILED");
		});
	});

	it("21. two concurrent stale recoverers — token holder completes, loser cannot", async () => {
		await withTx(async (repo, tx) => {
			mustAcquire(await repo.acquire(tx, BASE_INPUT, 1));

			await tx.execute(
				sql`UPDATE idempotency_records SET locked_at = NOW() - INTERVAL '10 seconds'`,
			);

			const [r1, r2] = await Promise.all([
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
				repo.acquire(tx, BASE_INPUT, TIMEOUT_MS),
			]);

			const winners = [r1, r2].filter(acquired);
			expect(winners).toHaveLength(1);

			// Token holder can complete
			await expect(
				repo.markCompleted(tx, {
					recordId: winners[0].recordId,
					ownershipToken: winners[0].ownershipToken,
					responseStatus: 200,
					responseBody: null,
					responseHeaders: {},
				}),
			).resolves.toBeUndefined();

			// Loser cannot (wrong token — they never got one)
			const loser = [r1, r2].find((r) => r.kind === "in-progress")!;
			await expect(
				repo.markCompleted(tx, {
					recordId: loser.recordId,
					ownershipToken: "",
					responseStatus: 200,
					responseBody: null,
					responseHeaders: {},
				}),
			).rejects.toThrow();
		});
	});
});

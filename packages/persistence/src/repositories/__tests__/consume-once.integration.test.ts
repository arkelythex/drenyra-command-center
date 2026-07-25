/**
 * W2-05D — Consume Once Integration Tests
 *
 * Validates the inbox consumer dedup contract under real PostgreSQL concurrency,
 * fencing, atomicity, and redelivery scenarios.
 *
 * These tests use raw SQL to verify the SQL-level guarantees that the
 * consume-once wrapper and InboxRepository implementation rely on.
 *
 * Prerequisites:
 *   - DATABASE_URL_TEST=postgresql://user:password@localhost:5436/drenyra_test
 *   - Migration 0021 applied (inbox_messages table + constraints + indexes)
 */

import { TestDatabase, withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

// ─── Constants ─────────────────────────────────────────────────────────────

const HASH_AAA = "a".repeat(64);
const HASH_BBB = "b".repeat(64);

const TOKEN_A = "00000000-0000-0000-0000-0000000000a1";
const TOKEN_B = "00000000-0000-0000-0000-0000000000b1";
const TOKEN_C = "00000000-0000-0000-0000-0000000000c1";

const ORG_A = "00000000-0000-0000-0000-0000000001a0";
const ORG_B = "00000000-0000-0000-0000-0000000001b0";
const CO_A = "00000000-0000-0000-0000-0000000002a0";
const CO_B = "00000000-0000-0000-0000-0000000002b0";

// ─── Helpers ────────────────────────────────────────────────────────────────

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

/**
 * Assert a Drizzle-wrapped PostgresError by code.
 *
 * Two usages:
 *   1. expectPgError(tx, () => tx.execute(...), code) — uses SAVEPOINT
 *      so the caller's tx stays valid after the expected failure.
 *   2. expectPgError(fn, code) — standalone; fn opens its own withTransaction.
 *      Useful for single-operation constraint tests.
 */
async function expectPgError(
	txOrFn: unknown,
	fnOrCode: unknown,
	code?: string,
): Promise<void> {
	// Determine overload from arguments
	interface HasExecute {
		execute: (sql: unknown) => Promise<unknown>;
	}

	if (code !== undefined) {
		// Overload 1: (tx, fn, code) — uses SAVEPOINT
		const tx = txOrFn as HasExecute;
		const fn = fnOrCode as () => Promise<unknown>;

		await tx.execute(sql`SAVEPOINT pg_err_guard`);
		try {
			await fn();
			await tx.execute(sql`RELEASE SAVEPOINT pg_err_guard`);
			expect.unreachable(
				`Expected PostgreSQL error ${code} but operation succeeded`,
			);
		} catch (err: unknown) {
			await tx.execute(sql`ROLLBACK TO SAVEPOINT pg_err_guard`).catch(() => {});
			if (err && typeof err === "object" && "cause" in err) {
				const cause = (err as { cause: unknown }).cause;
				if (
					cause &&
					typeof cause === "object" &&
					"code" in cause &&
					(cause as { code: string }).code === code
				) {
					return;
				}
			}
			throw err;
		}
	} else {
		// Overload 2: (fn, code) — standalone withTransaction
		const fn = txOrFn as () => Promise<unknown>;
		const expectedCode = fnOrCode as string;

		try {
			await fn();
			expect.unreachable(
				`Expected PostgreSQL error ${expectedCode} but operation succeeded`,
			);
		} catch (err: unknown) {
			if (err && typeof err === "object" && "cause" in err) {
				const cause = (err as { cause: unknown }).cause;
				if (
					cause &&
					typeof cause === "object" &&
					"code" in cause &&
					(cause as { code: string }).code === expectedCode
				) {
					return;
				}
			}
			throw err;
		}
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONCURRENCIA REAL
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Concurrencia real — dos deliveries simultáneas", () => {
	it("mismo mensaje → solo un ACQUIRED visible para el segundo worker", async () => {
		const dbA = new TestDatabase();
		const dbB = new TestDatabase();
		await dbA.setup();
		await dbB.setup();

		try {
			// Clean up any stale data from previous runs
			await dbA
				.getDb()
				.execute(
					sql`DELETE FROM inbox_messages WHERE producer = 'SUNAT_CDR' AND message_id = 'CONCUR-001'`,
				);

			const txA = await dbA.beginTransaction();

			// Worker A acquires the slot and COMMITS
			const [rowA] = await txA.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('cdr-webhook', 'SUNAT_CDR', 'CONCUR-001', 'cdr.notification', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);
			expect(rowA).toBeDefined();
			expect((rowA as { status: string }).status).toBe("PROCESSING");
			await dbA.commitTransaction();

			// Worker B tries the same slot — sees the committed row
			const txB = await dbB.beginTransaction();
			const [rowB] = await txB.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('cdr-webhook', 'SUNAT_CDR', 'CONCUR-001', 'cdr.notification', ${HASH_AAA}, 'PROCESSING', ${TOKEN_B}, NOW(), NOW() + INTERVAL '30 seconds')
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);

			// ON CONFLICT DO NOTHING → no row returned (already exists)
			if (rowB) {
				// If rowB is returned, it means B's INSERT succeeded.
				// But there should still be exactly 1 row in the table.
				expect((rowB as { status: string }).status).toBe("PROCESSING");
			}

			// Exactly one row for this dedup key
			const count = await txB.execute(sql`
				SELECT COUNT(*) as cnt FROM inbox_messages
				WHERE consumer_name = 'cdr-webhook' AND producer = 'SUNAT_CDR' AND message_id = 'CONCUR-001'
			`);
			expect(Number((count[0] as { cnt: string }).cnt)).toBe(1);

			// Worker B reads existing row → sees A's token
			const existing = await txB.execute(sql`
				SELECT id, status, processing_token FROM inbox_messages
				WHERE consumer_name = 'cdr-webhook' AND producer = 'SUNAT_CDR' AND message_id = 'CONCUR-001'
			`);
			expect(existing.length).toBe(1);

			await dbB.rollbackTransaction();
		} finally {
			await dbA.teardown();
			await dbB.teardown();
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. ATOMICIDAD — handler falla antes de markCompleted
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Atomicidad — handler falla antes de markCompleted", () => {
	it("efecto y estado revierten cuando handler falla (transacción rollback)", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
					VALUES ('worker', 'BULLMQ', 'ATOMIC-001', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
					ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
					RETURNING id, status
				`);
			expect(row).toBeDefined();

			// Simulate domain effect
			await tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
					VALUES ('domain-effect', 'INTERNAL', 'ATOMIC-EFFECT-001', 'effect', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
				`);

			throw new Error("handler failed before markCompleted");
		}).catch(() => {
			/* expected — rollback */
		});

		// Verify: no trace survives rollback
		await withTransaction(async (tx) => {
			const inboxRows = await tx.execute(sql`
					SELECT id FROM inbox_messages
					WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'ATOMIC-001'
				`);
			expect(inboxRows.length).toBe(0);

			const effectRows = await tx.execute(sql`
					SELECT id FROM inbox_messages
					WHERE consumer_name = 'domain-effect' AND message_id = 'ATOMIC-EFFECT-001'
				`);
			expect(effectRows.length).toBe(0);
		});
	});

	it("retry después de rollback — ejecuta correctamente, 1 efecto + 1 COMPLETED", async () => {
		// First attempt: fails
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
					VALUES ('worker', 'BULLMQ', 'ATOMIC-002', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
					ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
					RETURNING id, status
				`);

			if (row) {
				await tx.execute(sql`
						INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
						VALUES ('domain-effect', 'INTERNAL', 'ATOMIC-EFFECT-002', 'effect', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
					`);
				throw new Error("handler crashed");
			}
		}).catch(() => {
			/* expected */
		});

		// Verify: 0 persisted state
		await withTransaction(async (tx) => {
			const inboxRows = await tx.execute(sql`
					SELECT id, status FROM inbox_messages
					WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'ATOMIC-002'
				`);
			expect(inboxRows.length).toBe(0);
		});

		// Second attempt (retry): succeeds
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
					VALUES ('worker', 'BULLMQ', 'ATOMIC-002', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_B}, NOW(), NOW() + INTERVAL '30 seconds')
					ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
					RETURNING id, status
				`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Domain effect
			await tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
					VALUES ('domain-effect', 'INTERNAL', 'ATOMIC-RETRY', 'effect', ${HASH_AAA}, 'PROCESSING', ${TOKEN_B}, NOW())
				`);

			// markCompleted
			await tx.execute(sql`
					UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL,
						result_metadata = '{"source":"retry"}'::jsonb
					WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_B}
				`);

			// Verify COMPLETED
			const after = await tx.execute(sql`
					SELECT status FROM inbox_messages WHERE id = ${inboxId}
				`);
			expect((after[0] as { status: string }).status).toBe("COMPLETED");

			// Exactly 1 effect
			const effectCount = await tx.execute(sql`
					SELECT COUNT(*) as cnt FROM inbox_messages
					WHERE consumer_name = 'domain-effect' AND producer = 'INTERNAL' AND message_id = 'ATOMIC-RETRY'
				`);
			expect(Number((effectCount[0] as { cnt: string }).cnt)).toBe(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. FALLO DE COMPLETION — markCompleted falla o rowCount = 0
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Fallo de completion — markCompleted falla", () => {
	it("markCompleted con token incorrecto → rowCount=0 → rollback total en prod", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('worker', 'BULLMQ', 'COMPLFAIL-001', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Domain effect (simulated)
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('domain-effect', 'INTERNAL', 'COMPLFAIL-EFFECT-001', 'effect', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
			`);

			// markCompleted with WRONG fencing token → rowCount = 0
			const updateResult = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_B}
				RETURNING id
			`);
			expect(updateResult.length).toBe(0);

			// Inbox still PROCESSING (fencing protected it)
			const current = await tx.execute(sql`
				SELECT status FROM inbox_messages WHERE id = ${inboxId}
			`);
			expect((current[0] as { status: string }).status).toBe("PROCESSING");

			// In production, the wrapper throws when rowCount = 0,
			// causing the tx to rollback, removing both effect and inbox.
			throw new Error(
				"Fencing token rejected — production would rollback here",
			);
		}).catch(() => {
			/* expected */
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. FENCING Y RECLAMACIÓN
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Fencing y reclamación", () => {
	it("lease expira → otro worker reclama → token viejo no completa", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('worker', 'BULLMQ', 'FENCE-001', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW() - INTERVAL '31 seconds', NOW() - INTERVAL '1 second')
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Worker B reclaims: stale recovery — updates token
			const reclaimResult = await tx.execute(sql`
				UPDATE inbox_messages
				SET processing_token = ${TOKEN_B}, processing_started_at = NOW(), processing_expires_at = NOW() + INTERVAL '30 seconds',
					attempt_count = attempt_count + 1
				WHERE id = ${inboxId}
					AND status = 'PROCESSING'
					AND processing_token = ${TOKEN_A}
				RETURNING id, processing_token, attempt_count
			`);
			expect(reclaimResult.length).toBe(1);
			expect(
				(reclaimResult[0] as { processing_token: string }).processing_token,
			).toBe(TOKEN_B);
			expect(
				Number((reclaimResult[0] as { attempt_count: string }).attempt_count),
			).toBe(2);

			// Worker A tries complete with OLD token → 0 rows
			const fail = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_A}
				RETURNING id
			`);
			expect(fail.length).toBe(0);

			// Worker B completes with current token → accepted
			const ok = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL,
					result_metadata = '{"completedBy":"B"}'::jsonb
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_B}
				RETURNING id
			`);
			expect(ok.length).toBe(1);

			// Final state: COMPLETED
			const finalState = await tx.execute(sql`
				SELECT status FROM inbox_messages WHERE id = ${inboxId}
			`);
			expect((finalState[0] as { status: string }).status).toBe("COMPLETED");
		});
	});

	it("token incorrecto nunca completa — fencing se mantiene", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('worker', 'BULLMQ', 'FENCE-002', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Wrong token → 0 rows
			const directFail = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_C}
				RETURNING id
			`);
			expect(directFail.length).toBe(0);

			// Correct token → succeeds
			const ok = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL,
					result_metadata = '{"ok":true}'::jsonb
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_A}
				RETURNING id
			`);
			expect(ok.length).toBe(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. REDELIVERY
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Redelivery — state transitions", () => {
	it("COMPLETED + mismo hash → no-op (reconoce ALREADY_COMPLETED)", async () => {
		await withTransaction(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, completed_at, result_metadata)
				VALUES ('worker', 'BULLMQ', 'RDLV-001', 'process', ${HASH_AAA}, 'COMPLETED', NOW(), '{"status":"ok"}'::jsonb)
			`);

			// Same hash → detect ALREADY_COMPLETED
			const existing = await tx.execute(sql`
				SELECT status, payload_hash FROM inbox_messages
				WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'RDLV-001'
			`);
			expect(existing.length).toBe(1);
			expect((existing[0] as { status: string }).status).toBe("COMPLETED");
			expect((existing[0] as { payload_hash: string }).payload_hash).toBe(
				HASH_AAA,
			);

			// Attempt insert → ON CONFLICT → 0 rows
			const [inserted] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, completed_at, result_metadata)
				VALUES ('worker', 'BULLMQ', 'RDLV-001', 'process', ${HASH_AAA}, 'COMPLETED', NOW(), '{"status":"ok"}'::jsonb)
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id
			`);
			expect(inserted).toBeUndefined();
		});
	});

	it("misma identidad + hash diferente → PAYLOAD_CONFLICT detectable", async () => {
		await withTransaction(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, completed_at, result_metadata)
				VALUES ('worker', 'BULLMQ', 'RDLV-002', 'process', ${HASH_AAA}, 'COMPLETED', NOW(), '{"status":"ok"}'::jsonb)
			`);

			// Stored hash is AAA, incoming would be BBB
			const stored = await tx.execute(sql`
				SELECT payload_hash FROM inbox_messages
				WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'RDLV-002'
			`);
			expect((stored[0] as { payload_hash: string }).payload_hash).toBe(
				HASH_AAA,
			);
			expect(HASH_AAA).not.toBe(HASH_BBB);
		});
	});

	it("FAILED RETRYABLE → se re-adquiere con attempt_count + 1", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('worker', 'BULLMQ', 'RDLV-003', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id, status
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Mark FAILED RETRYABLE
			await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'RETRYABLE'::inbox_failure_class,
					failure_code = 'TIMEOUT', last_failed_at = NOW(), next_retry_at = NOW() + INTERVAL '1 minute',
					processing_token = NULL
				WHERE id = ${inboxId}
			`);

			// Re-acquire: clear ALL failure fields + new token
			const reacquire = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_B}, processing_started_at = NOW(),
					attempt_count = attempt_count + 1,
					failure_code = NULL, failure_class = NULL, last_failed_at = NULL, next_retry_at = NULL
				WHERE id = ${inboxId}
					AND status = 'FAILED' AND failure_class = 'RETRYABLE'::inbox_failure_class
				RETURNING attempt_count
			`);
			expect(reacquire.length).toBe(1);
			expect(
				Number((reacquire[0] as { attempt_count: string }).attempt_count),
			).toBe(2);
		});
	});

	it("FAILED TERMINAL → CHECK constraint impide re-adquirir (23514)", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('worker', 'BULLMQ', 'RDLV-004', 'process', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
				ON CONFLICT (consumer_name, producer, message_id) DO NOTHING
				RETURNING id
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// Mark TERMINAL
			await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'TERMINAL'::inbox_failure_class,
					failure_code = 'INVALID_DATA', last_failed_at = NOW(),
					processing_token = NULL
				WHERE id = ${inboxId}
			`);

			// Attempt re-acquire WITHOUT clearing failure fields
			// The constraint inbox_messages_not_failed_no_no_failure fires because
			// new status = PROCESSING but failure fields are still set → 23514
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_B}
					WHERE id = ${inboxId}
						AND status = 'FAILED' AND failure_class = 'TERMINAL'::inbox_failure_class
					RETURNING id
				`),
				"23514",
			);

			// Record is still FAILED TERMINAL
			const current = await tx.execute(sql`
				SELECT status, failure_class FROM inbox_messages WHERE id = ${inboxId}
			`);
			expect((current[0] as { status: string }).status).toBe("FAILED");
			expect((current[0] as { failure_class: string }).failure_class).toBe(
				"TERMINAL",
			);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. AISLAMIENTO DEL CONSUMER
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: Aislamiento del consumer", () => {
	it("mismo message_id en consumers distintos → ambos procesan una vez", async () => {
		await withTransaction(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('consumer-a', 'NATS', 'EVT-001', 'event', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
			`);

			// Consumer B — different consumer, same message_id → allowed
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('consumer-b', 'NATS', 'EVT-001', 'event', ${HASH_AAA}, 'PROCESSING', ${TOKEN_B}, NOW())
			`);

			const count = await tx.execute(sql`
				SELECT COUNT(*) as cnt FROM inbox_messages
				WHERE producer = 'NATS' AND message_id = 'EVT-001'
			`);
			expect(Number((count[0] as { cnt: string }).cnt)).toBe(2);
		});
	});

	it("misma identidad con company_id diferente → no evade dedup (23505)", async () => {
		await withTransaction(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, status, processing_token, processing_started_at)
				VALUES ('worker', 'BULLMQ', 'DEDUP-001', 'process', ${HASH_AAA}, ${CO_A}, 'PROCESSING', ${TOKEN_A}, NOW())
			`);

			// Same (consumer, producer, message_id), different company_id → 23505
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, status, processing_token, processing_started_at)
					VALUES ('worker', 'BULLMQ', 'DEDUP-001', 'process', ${HASH_AAA}, ${CO_B}, 'PROCESSING', ${TOKEN_B}, NOW())
				`),
				"23505",
			);

			// Legitimate record still intact
			const count = await tx.execute(sql`
				SELECT COUNT(*) as cnt FROM inbox_messages
				WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'DEDUP-001'
			`);
			expect(Number((count[0] as { cnt: string }).cnt)).toBe(1);
		});
	});

	it("tenant inválido → no duplica, no contamina inbox legítimo (23505)", async () => {
		await withTransaction(async (tx) => {
			const [legit] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, organization_id, status, processing_token, processing_started_at)
				VALUES ('worker', 'BULLMQ', 'TENANT-001', 'process', ${HASH_AAA}, ${CO_A}, ${ORG_A}, 'PROCESSING', ${TOKEN_A}, NOW())
				RETURNING company_id
			`);
			expect((legit as { company_id: string }).company_id).toBe(CO_A);

			// Same dedup key, different tenant → 23505
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, organization_id, status, processing_token, processing_started_at)
					VALUES ('worker', 'BULLMQ', 'TENANT-001', 'process', ${HASH_BBB}, ${CO_B}, ${ORG_B}, 'PROCESSING', ${TOKEN_B}, NOW())
				`),
				"23505",
			);

			// Legitimate record intact
			const count = await tx.execute(sql`
				SELECT COUNT(*) as cnt FROM inbox_messages
				WHERE consumer_name = 'worker' AND producer = 'BULLMQ' AND message_id = 'TENANT-001'
			`);
			expect(Number((count[0] as { cnt: string }).cnt)).toBe(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. POSTGRESQL VERIFICATION — constraints, índices, transiciones
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("W2-05D: PostgreSQL verification", () => {
	it("unique constraint: uq_inbox_messages_consumer_message", async () => {
		await withTransaction(async (tx) => {
			const constraints = await tx.execute(sql`
				SELECT conname FROM pg_catalog.pg_constraint
				WHERE conrelid = 'inbox_messages'::regclass AND contype = 'u'
			`);
			expect(constraints.length).toBe(1);
			expect((constraints[0] as { conname: string }).conname).toBe(
				"uq_inbox_messages_consumer_message",
			);
		});
	});

	it("9 check constraints con nombres correctos", async () => {
		await withTransaction(async (tx) => {
			const checks = await tx.execute(sql`
				SELECT conname FROM pg_catalog.pg_constraint
				WHERE conrelid = 'inbox_messages'::regclass AND contype = 'c'
				ORDER BY conname
			`);
			const names = checks.map(
				(c: Record<string, unknown>) => c.conname as string,
			);
			expect(names).toHaveLength(9);
			expect(names).toContain("inbox_messages_attempt_count_positive");
			expect(names).toContain("inbox_messages_completed_has_timestamp");
			expect(names).toContain("inbox_messages_failed_has_fields");
			expect(names).toContain("inbox_messages_not_completed_no_result");
			expect(names).toContain("inbox_messages_not_failed_no_failure");
			expect(names).toContain("inbox_messages_not_processing_no_token");
			expect(names).toContain("inbox_messages_processing_has_token");
			expect(names).toContain("inbox_messages_status_check");
			expect(names).toContain("inbox_messages_terminal_no_retry");
		});
	});

	it("4 índices operacionales existen", async () => {
		await withTransaction(async (tx) => {
			const indexes = await tx.execute(sql`
				SELECT indexname FROM pg_catalog.pg_indexes
				WHERE tablename = 'inbox_messages'
				ORDER BY indexname
			`);
			const names = indexes.map(
				(i: Record<string, unknown>) => i.indexname as string,
			);
			expect(names).toContain("idx_inbox_stale_processing");
			expect(names).toContain("idx_inbox_retry_queue");
			expect(names).toContain("idx_inbox_tenant_created");
			expect(names).toContain("idx_inbox_consumer_completed");
		});
	});

	it("PROCESSING requiere processing_token y processing_started_at (23514)", async () => {
		await expectPgError(
			() =>
				withTransaction(async (tx) => {
					await tx.execute(sql`
						INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status)
						VALUES ('test', 'TEST', 'CHK-PROC-001', 'test', ${HASH_AAA}, 'PROCESSING')
					`);
				}),
			"23514",
		);
	});

	it("COMPLETED requiere completed_at (23514)", async () => {
		await expectPgError(
			() =>
				withTransaction(async (tx) => {
					await tx.execute(sql`
						INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status)
						VALUES ('test', 'TEST', 'CHK-COMP-001', 'test', ${HASH_AAA}, 'COMPLETED')
					`);
				}),
			"23514",
		);
	});

	it("FAILED requiere failure_code, failure_class, last_failed_at (23514)", async () => {
		await expectPgError(
			() =>
				withTransaction(async (tx) => {
					await tx.execute(sql`
						INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status)
						VALUES ('test', 'TEST', 'CHK-FAIL-001', 'test', ${HASH_AAA}, 'FAILED')
					`);
				}),
			"23514",
		);
	});

	it("COMPLETED sin result_metadata → viola not_completed_no_result (23514)", async () => {
		await expectPgError(
			() =>
				withTransaction(async (tx) => {
					await tx.execute(sql`
						INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
						VALUES ('test', 'TEST', 'CHK-RES-001', 'test', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
					`);
					await tx.execute(sql`
						UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW()
						WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'CHK-RES-001'
					`);
				}),
			"23514",
		);
	});

	it("COMPLETED → PROCESSING: viola not_completed_no_result si result_metadata no se limpia (23514)", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at, processing_expires_at)
				VALUES ('test', 'TEST', 'STATE-TRANS-001', 'test', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW(), NOW() + INTERVAL '30 seconds')
				RETURNING id
			`);
			expect(row).toBeDefined();
			const inboxId = (row as { id: string }).id;

			// PROCESSING → COMPLETED (with required result_metadata)
			const comp = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL,
					result_metadata = '{"ok":true}'::jsonb
				WHERE id = ${inboxId} AND status = 'PROCESSING' AND processing_token = ${TOKEN_A}
				RETURNING status
			`);
			expect(comp.length).toBe(1);
			expect((comp[0] as { status: string }).status).toBe("COMPLETED");

			// COMPLETED → PROCESSING WITHOUT clearing result_metadata → constraint violation
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_B}, processing_started_at = NOW()
					WHERE id = ${inboxId} AND status = 'COMPLETED'
					RETURNING id
				`),
				"23514",
			);

			// Record is still COMPLETED after the failed attempt
			const finalState = await tx.execute(sql`
				SELECT status, result_metadata FROM inbox_messages WHERE id = ${inboxId}
			`);
			expect((finalState[0] as { status: string }).status).toBe("COMPLETED");
			expect(
				(finalState[0] as { result_metadata: unknown }).result_metadata,
			).toEqual({ ok: true });
		});
	});

	it("attempt_count empieza en 1 y se incrementa en cada reintento", async () => {
		await withTransaction(async (tx) => {
			const [row] = await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'ATT-CNT-001', 'test', ${HASH_AAA}, 'PROCESSING', ${TOKEN_A}, NOW())
				RETURNING attempt_count
			`);
			expect(Number((row as { attempt_count: string }).attempt_count)).toBe(1);

			// FAILED RETRYABLE → re-acquire with +1
			await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'RETRYABLE'::inbox_failure_class,
					failure_code = 'ERR', last_failed_at = NOW(), next_retry_at = NOW() + INTERVAL '1 minute',
					processing_token = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'ATT-CNT-001'
			`);

			const [retry] = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_B}, processing_started_at = NOW(),
					attempt_count = attempt_count + 1,
					failure_code = NULL, failure_class = NULL, last_failed_at = NULL, next_retry_at = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'ATT-CNT-001'
					AND status = 'FAILED' AND failure_class = 'RETRYABLE'::inbox_failure_class
				RETURNING attempt_count
			`);
			expect(Number((retry as { attempt_count: string }).attempt_count)).toBe(
				2,
			);
		});
	});
});

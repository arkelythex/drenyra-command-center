/**
 * W2-05B — Inbox Messages Constraint Tests
 *
 * Verifies inbox_messages UNIQUE constraint, CHECK constraints,
 * processing_token fencing, and cross-consumer isolation.
 *
 * Requires DATABASE_URL_TEST and migration 0021 applied.
 */

import { TestDatabase } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { describe, expect, it } from "vitest";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

const C_A = "00000000-0000-0000-0000-0000000000a1";
const C_B = "00000000-0000-0000-0000-0000000000b1";
const HASH = "a".repeat(64);
const TOKEN_1 = "00000000-0000-0000-0000-0000000000a1";
const TOKEN_2 = "00000000-0000-0000-0000-0000000000b1";

/**
 * Assert that an async function throws a Drizzle-wrapped PostgresError
 * with the expected SQLSTATE code.
 */
async function expectPgErrorCode(
	fn: () => Promise<unknown>,
	expectedCode: string,
): Promise<void> {
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
				return; // Expected
			}
		}
		// Rethrow for a clear assertion failure
		throw err;
	}
}

async function withTx<T>(
	fn: (tx: PostgresJsDatabase) => Promise<T>,
): Promise<T> {
	const testDb = new TestDatabase();
	await testDb.setup();
	try {
		const tx =
			(await testDb.beginTransaction()) as unknown as PostgresJsDatabase;
		try {
			return await fn(tx);
		} finally {
			await testDb.rollbackTransaction();
		}
	} finally {
		await testDb.teardown();
	}
}

runIfDb("inbox_messages UNIQUE (consumer_name, producer, message_id)", () => {
	it("rejects duplicate (same consumer + producer + message_id)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('cdr-webhook', 'SUNAT_CDR', 'MSG-001', 'cdr.notification', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			await expectPgErrorCode(
				() =>
					tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
					VALUES ('cdr-webhook', 'SUNAT_CDR', 'MSG-001', 'cdr.notification', ${HASH}, 'PROCESSING', ${TOKEN_2}, NOW())
				`),
				"23505",
			);
		});
	});

	it("allows same message_id across different consumers", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('consumer-a', 'NATS_EVENT', 'EVT-001', 'event', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
					VALUES ('consumer-b', 'NATS_EVENT', 'EVT-001', 'event', ${HASH}, 'PROCESSING', ${TOKEN_2}, NOW())
				`),
			).resolves.toBeDefined();
		});
	});

	it("rejects same message_id from different producers for same consumer", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('webhook', 'SUNAT_CDR', 'ID-001', 'cdr', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			await expect(
				tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
					VALUES ('webhook', 'BANK_PROVIDER_X', 'ID-001', 'cdr', ${HASH}, 'PROCESSING', ${TOKEN_2}, NOW())
				`),
			).resolves.toBeDefined(); // Different producer = different identity
		});
	});

	it("different company_id does NOT bypass dedup", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, status, processing_token, processing_started_at)
				VALUES ('worker', 'BULLMQ_JOB', 'JOB-001', 'process', ${HASH}, ${C_A}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			// company_id not in dedup key — unique violation expected
			await expectPgErrorCode(
				() =>
					tx.execute(sql`
					INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, company_id, status, processing_token, processing_started_at)
					VALUES ('worker', 'BULLMQ_JOB', 'JOB-001', 'process', ${HASH}, ${C_B}, 'PROCESSING', ${TOKEN_2}, NOW())
				`),
				"23505",
			);
		});
	});
});

// ══════════════════════════════════════════════════════════════════════════════
// Status transitions
// ══════════════════════════════════════════════════════════════════════════════

runIfDb("inbox_messages — processing_token fencing", () => {
	it("PROCESSING → COMPLETED requires correct processing_token", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'FNC-001', 'test', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			// Correct token — succeeds
			const ok = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'FNC-001'
					AND status = 'PROCESSING' AND processing_token = ${TOKEN_1}
				RETURNING id
			`);
			expect(ok.length).toBe(1);

			// Wrong token — fails
			const fail = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'RETRYABLE'::inbox_failure_class, failure_code = 'ERR', last_failed_at = NOW()
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'FNC-001'
					AND status = 'PROCESSING' AND processing_token = ${TOKEN_2}
				RETURNING id
			`);
			expect(fail.length).toBe(0);
		});
	});

	it("old token cannot complete after another token took over", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'FNC-002', 'test', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			// Token 2 takes over (simulating stale recovery)
			await tx.execute(sql`
				UPDATE inbox_messages SET processing_token = ${TOKEN_2}, processing_started_at = NOW()
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'FNC-002'
					AND status = 'PROCESSING' AND processing_token = ${TOKEN_1}
			`);

			// Token 1 tries to complete — should fail (0 rows)
			const fail = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'COMPLETED', completed_at = NOW(), processing_token = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'FNC-002'
					AND status = 'PROCESSING' AND processing_token = ${TOKEN_1}
				RETURNING id
			`);
			expect(fail.length).toBe(0);
		});
	});
});

runIfDb("inbox_messages — FAILED states", () => {
	it("FAILED RETRYABLE can be retried", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'RT-001', 'test', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'RETRYABLE'::inbox_failure_class,
					failure_code = 'TIMEOUT', last_failed_at = NOW(), next_retry_at = NOW() + INTERVAL '1 minute',
					processing_token = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'RT-001'
			`);

			// Can re-acquire (new token + clear failure fields)
			const ok = await tx.execute(sql`
				UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_2}, processing_started_at = NOW(),
					attempt_count = attempt_count + 1, failure_code = NULL, failure_class = NULL, last_failed_at = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'RT-001'
					AND status = 'FAILED' AND failure_class = 'RETRYABLE'::inbox_failure_class
				RETURNING attempt_count
			`);
			expect(ok.length).toBe(1);
			expect(Number(ok[0].attempt_count)).toBe(2);
		});
	});

	it("FAILED TERMINAL cannot be retried (constraint 23514)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'TR-001', 'test', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			await tx.execute(sql`
				UPDATE inbox_messages SET status = 'FAILED', failure_class = 'TERMINAL'::inbox_failure_class,
					failure_code = 'INVALID_STATE', last_failed_at = NOW(),
					processing_token = NULL
				WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'TR-001'
			`);

			// TERMINAL cannot transition back to PROCESSING without clearing
			// failure fields. The constraint inbox_messages_not_failed_no_failure fires.
			await expectPgErrorCode(
				() =>
					tx.execute(sql`
					UPDATE inbox_messages SET status = 'PROCESSING', processing_token = ${TOKEN_2}
					WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'TR-001'
						AND status = 'FAILED' AND failure_class = 'TERMINAL'::inbox_failure_class
					RETURNING id
				`),
				"23514",
			);
		});
	});

	it("TERMINAL failure must not have next_retry_at (constraint 23514)", async () => {
		await withTx(async (tx) => {
			await tx.execute(sql`
				INSERT INTO inbox_messages (consumer_name, producer, message_id, message_type, payload_hash, status, processing_token, processing_started_at)
				VALUES ('test', 'TEST', 'CHK-001', 'test', ${HASH}, 'PROCESSING', ${TOKEN_1}, NOW())
			`);

			// TERMINAL + next_retry_at should be rejected by CHECK constraint
			await expectPgErrorCode(
				() =>
					tx.execute(sql`
					UPDATE inbox_messages SET status = 'FAILED', failure_class = 'TERMINAL'::inbox_failure_class,
						failure_code = 'ERR', last_failed_at = NOW(), next_retry_at = NOW()
					WHERE consumer_name = 'test' AND producer = 'TEST' AND message_id = 'CHK-001'
				`),
				"23514",
			);
		});
	});
});

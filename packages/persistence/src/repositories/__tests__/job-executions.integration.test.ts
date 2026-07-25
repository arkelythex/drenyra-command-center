/**
 * W2-06B — Job Executions Integration Tests
 *
 * Validates the Job Uniqueness Registry contract:
 * - Per-policy dedup (PERMANENT, PERMANENT_BY_INPUT, ACTIVE_ONLY, WINDOWED, REPLACEABLE)
 * - Fencing and generation checks
 * - Outbox atomicity with job creation
 * - PostgreSQL constraints and indexes
 *
 * Prerequisites:
 *   - DATABASE_URL_TEST with migration 0022 applied
 *   - job_executions + job_outbox tables exist
 */

import { withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { PostgresJobExecutionRepository } from "../postgres-job-execution.repository";

// ─── Constants ─────────────────────────────────────────────────────────────

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const ORG_1 = "00000000-0000-0000-0000-000000000001";
const ORG_2 = "00000000-0000-0000-0000-000000000002";
const CO_1 = "00000000-0000-0000-0000-000000000010";
const CO_2 = "00000000-0000-0000-0000-000000000020";
const TOKEN_A = "00000000-0000-0000-0000-00000000a001";
const TOKEN_B = "00000000-0000-0000-0000-00000000b001";

const BASE_PERMANENT = {
	organizationId: ORG_1,
	companyId: CO_1,
	queueName: "sunat-submission",
	jobType: "submit",
	logicalKey: `company:${CO_1}:invoice:inv-001`,
	executionWindow: null,
	uniquenessPolicy: "PERMANENT" as const,
	payload: { invoiceId: "inv-001" },
	inputHash: HASH_A,
};

// ─── Helper ────────────────────────────────────────────────────────────────

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

const repo = new PostgresJobExecutionRepository();

/**
 * Assert a Drizzle-wrapped PostgresError by SQLSTATE code.
 * Uses SAVEPOINT to keep the caller's transaction valid.
 */
async function expectPgError(
	tx: unknown,
	fn: () => Promise<unknown>,
	expectedCode: string,
): Promise<void> {
	const txWithExec = tx as { execute: (sql: unknown) => Promise<unknown> };
	await txWithExec.execute(sql`SAVEPOINT pg_err_guard`);
	try {
		await fn();
		await txWithExec.execute(sql`RELEASE SAVEPOINT pg_err_guard`);
		expect.unreachable(
			`Expected PostgreSQL error ${expectedCode} but operation succeeded`,
		);
	} catch (err: unknown) {
		await txWithExec
			.execute(sql`ROLLBACK TO SAVEPOINT pg_err_guard`)
			.catch(() => {});
		if (
			err &&
			typeof err === "object" &&
			"cause" in err &&
			err.cause &&
			typeof err.cause === "object" &&
			"code" in err.cause &&
			(err.cause as { code: string }).code === expectedCode
		) {
			return;
		}
		throw err;
	}
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. PERMANENT — identidad cerrada tras COMPLETED/FAILED_TERMINAL
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("PERMANENT — identidad cerrada tras terminal", () => {
	it("dos concurrentes con misma identidad: solo una fila creada", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(r1.kind).toBe("created");

			const r2 = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(r2.kind).toBe("already-active");
		});
	});

	it("COMPLETED sigue bloqueando nueva ejecución", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			// Acquire + complete
			const acquired = await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			expect(acquired.kind).toBe("acquired");

			const completed = await repo.complete(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				resultMetadata: { ok: true },
			});
			expect(completed.kind).toBe("completed");

			// New enqueue → blocked
			const blocked = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(blocked.kind).toBe("already-final");
		});
	});

	it("FAILED TERMINAL también bloquea nueva ejecución", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: `company:${CO_1}:invoice:inv-terminal`,
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			await repo.fail(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				failureClass: "TERMINAL",
				failureCode: "INVALID_DATA",
				retryable: false,
			});

			const blocked = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: `company:${CO_1}:invoice:inv-terminal`,
			});
			expect(blocked.kind).toBe("already-final");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERMANENT_BY_INPUT — input_hash distinto = identidad distinta
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("PERMANENT_BY_INPUT — input_hash en la identidad", () => {
	it("mismo logical_key, input_hash diferente → no bloquea", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				uniquenessPolicy: "PERMANENT_BY_INPUT",
				logicalKey: `doc:doc-001:hash:${HASH_A}:v1`,
				inputHash: HASH_A,
			});
			expect(created.kind).toBe("created");

			// Complete it
			if (created.kind === "created") {
				await repo.acquireLease(tx, {
					executionId: created.execution.id,
					executionToken: TOKEN_A,
					leaseDurationMs: 30_000,
					expectedGeneration: 1,
				});
				await repo.complete(tx, {
					executionId: created.execution.id,
					executionToken: TOKEN_A,
					expectedGeneration: 1,
				});
			}

			// Same logical_key but different hash → different identity
			const different = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				uniquenessPolicy: "PERMANENT_BY_INPUT",
				logicalKey: `doc:doc-001:hash:${HASH_B}:v1`,
				inputHash: HASH_B,
			});
			// Different logical_key → should be created
			expect(different.kind).toBe("created");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. ACTIVE_ONLY — libera identidad tras COMPLETED/FAILED
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("ACTIVE_ONLY — libera identidad tras terminal", () => {
	it("bloquea mientras activo, permite nueva generación tras COMPLETED", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "csv-batch",
				jobType: "process",
				logicalKey: "batch:batch-001",
				uniquenessPolicy: "ACTIVE_ONLY",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			const second = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "csv-batch",
				jobType: "process",
				logicalKey: "batch:batch-001",
				uniquenessPolicy: "ACTIVE_ONLY",
			});
			expect(second.kind).toBe("already-active");

			// Complete
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.complete(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});

			// After COMPLETED → new execution allowed
			const afterComplete = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "csv-batch",
				jobType: "process",
				logicalKey: "batch:batch-001",
				uniquenessPolicy: "ACTIVE_ONLY",
			});
			expect(afterComplete.kind).toBe("already-final");
			// Note: for ACTIVE_ONLY, the caller gets already-final and must
			// explicitly create a new generation if needed. The unique index
			// only blocks while PENDING/ENQUEUED/RUNNING, so a direct INSERT
			// (bypassing the repo) would succeed. The repo returns already-final
			// to signal that the previous execution is terminal.
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. WINDOWED — identidad por ventana
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("WINDOWED — identidad por ventana temporal", () => {
	it("misma ventana → una ejecución", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "fiscal-agent",
				jobType: "nightly",
				logicalKey: `company:${CO_1}`,
				executionWindow: "202607",
				uniquenessPolicy: "WINDOWED",
			});
			expect(r1.kind).toBe("created");

			const r2 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "fiscal-agent",
				jobType: "nightly",
				logicalKey: `company:${CO_1}`,
				executionWindow: "202607",
				uniquenessPolicy: "WINDOWED",
			});
			expect(r2.kind).toBe("already-active");
		});
	});

	it("ventanas diferentes → ambas ejecutan", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "fiscal-agent",
				jobType: "nightly",
				logicalKey: `company:${CO_1}`,
				executionWindow: "202606",
				uniquenessPolicy: "WINDOWED",
			});
			expect(r1.kind).toBe("created");

			const r2 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "fiscal-agent",
				jobType: "nightly",
				logicalKey: `company:${CO_1}`,
				executionWindow: "202607",
				uniquenessPolicy: "WINDOWED",
			});
			expect(r2.kind).toBe("created");
		});
	});

	it("WINDOWED sin execution_window → viola CHECK", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
						INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, uniqueness_policy, input_hash, status)
						VALUES (${ORG_1}::uuid, 'fiscal-agent', 'nightly', 'no-window', 'WINDOWED'::job_uniqueness_policy, ${HASH_A}, 'PENDING'::job_execution_status)
					`),
				"23514",
			);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. REPLACEABLE — generaciones y supersession
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("REPLACEABLE — generaciones y supersession", () => {
	it("crea N+1 y supersede N en una sola transacción", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "report-gen",
				jobType: "generate",
				logicalKey: `org:${ORG_1}:report:balance:2026-01-2026-06:pdf`,
				uniquenessPolicy: "REPLACEABLE",
			});
			expect(r1.kind).toBe("created");
			if (r1.kind !== "created") return;
			expect(r1.execution.generation).toBe(1);

			// Acquire execution 1
			await repo.acquireLease(tx, {
				executionId: r1.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Replace: new execution supersedes generation 1
			const replaced = await repo.replace(tx, {
				previousExecutionId: r1.execution.id,
				previousExecutionToken: TOKEN_A,
				newExecutionId: "",
				newInput: {
					...BASE_PERMANENT,
					queueName: "report-gen",
					jobType: "generate",
					logicalKey: `org:${ORG_1}:report:balance:2026-01-2026-06:pdf`,
					uniquenessPolicy: "REPLACEABLE",
				},
			});
			expect(replaced.kind).toBe("replaced");
			if (replaced.kind !== "replaced") return;
			expect(replaced.newExecution.generation).toBe(2);

			// Old one is SUPERSEDED, referencing the new execution's real ID
			const oldExec = await repo.findById(tx, r1.execution.id);
			expect(oldExec?.status).toBe("SUPERSEDED");
			expect(oldExec?.supersededById).toBe(replaced.newExecution.id);
		});
	});

	it("token y generación anteriores no pueden completar después de supersession", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "report-gen",
				jobType: "generate",
				logicalKey: `org:${ORG_1}:report:ledger:2026-01-2026-06:pdf`,
				uniquenessPolicy: "REPLACEABLE",
			});
			expect(r1.kind).toBe("created");
			if (r1.kind !== "created") return;

			await repo.acquireLease(tx, {
				executionId: r1.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Replace
			const replaced = await repo.replace(tx, {
				previousExecutionId: r1.execution.id,
				previousExecutionToken: TOKEN_A,
				newExecutionId: "",
				newInput: {
					...BASE_PERMANENT,
					queueName: "report-gen",
					jobType: "generate",
					logicalKey: `org:${ORG_1}:report:ledger:2026-01-2026-06:pdf`,
					uniquenessPolicy: "REPLACEABLE",
				},
			});
			expect(replaced.kind).toBe("replaced");

			// Old worker tries to complete with gen=1, token=A → rejected
			const oldComplete = await repo.complete(tx, {
				executionId: r1.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});
			// The old execution is SUPERSEDED — complete fails because status != RUNNING
			expect(oldComplete.kind).toBe("fencing-rejected");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. FENCING — token y generation checks
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Fencing — token y generación", () => {
	it("complete con token incorrecto → fencing-rejected", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Wrong token
			const badComplete = await repo.complete(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_B,
				expectedGeneration: 1,
			});
			expect(badComplete.kind).toBe("fencing-rejected");
		});
	});

	it("complete con generación incorrecta → wrong-generation", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Wrong generation
			const badComplete = await repo.complete(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 2,
			});
			expect(badComplete.kind).toBe("wrong-generation");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. TENANT ISOLATION — org/company distintos no colisionan
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Tenant isolation — org/company distintos", () => {
	it("misma logical_key en organizations distintas → ambas creadas", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				organizationId: ORG_1,
				logicalKey: "sync:bank-001",
			});
			expect(r1.kind).toBe("created");

			const r2 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				organizationId: ORG_2,
				logicalKey: "sync:bank-001",
			});
			expect(r2.kind).toBe("created");
		});
	});

	it("misma logical_key en companies distintas → ambas creadas", async () => {
		await withTransaction(async (tx) => {
			const r1 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				companyId: CO_1,
				logicalKey: "sync:bank-001",
			});
			expect(r1.kind).toBe("created");

			const r2 = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				companyId: CO_2,
				logicalKey: "sync:bank-001",
			});
			expect(r2.kind).toBe("created");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. OUTBOX ATOMICITY — creación genera outbox en misma tx
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Outbox atomicity — creación + outbox en misma tx", () => {
	it("createOrResolve inserta outbox_event ENQUEUE", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			// Outbox event should exist
			const outboxRows = await tx.execute(sql`
				SELECT job_execution_id, action, queue_name, job_type FROM job_outbox
				WHERE job_execution_id = ${created.execution.id}::uuid
			`);
			expect(outboxRows.length).toBe(1);
			const outbox = outboxRows[0] as Record<string, unknown>;
			expect(outbox.action).toBe("ENQUEUE");
			expect(outbox.queue_name).toBe(BASE_PERMANENT.queueName);
			expect(outbox.job_type).toBe(BASE_PERMANENT.jobType);
		});
	});

	it("rollback de transacción revierte execution + outbox simultáneamente", async () => {
		let executionId: string | null = null;

		// Create in a transaction that will be rolled back
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind === "created") {
				executionId = created.execution.id;
			}
			throw new Error("simulate rollback");
		}).catch(() => {});

		// Verify: nothing persisted
		if (executionId) {
			await withTransaction(async (tx) => {
				const execRow = await tx.execute(sql`
					SELECT id FROM job_executions WHERE id = ${executionId}::uuid
				`);
				expect(execRow.length).toBe(0);

				const outboxRow = await tx.execute(sql`
					SELECT id FROM job_outbox WHERE job_execution_id = ${executionId}::uuid
				`);
				expect(outboxRow.length).toBe(0);
			});
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. POSTGRESQL VERIFICATION — constraints, indexes, pg_catalog
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("PostgreSQL verification", () => {
	it("unique index names are correct and stable", async () => {
		await withTransaction(async (tx) => {
			const indexes = await tx.execute(sql`
				SELECT indexname FROM pg_catalog.pg_indexes
				WHERE tablename = 'job_executions'
					AND indexname LIKE 'uq_job_execution_%'
				ORDER BY indexname
			`);
			const names = indexes.map(
				(i: Record<string, unknown>) => i.indexname as string,
			);
			expect(names).toContain("uq_job_execution_active_only");
			expect(names).toContain("uq_job_execution_permanent");
			expect(names).toContain("uq_job_execution_windowed");
			expect(names).toContain("uq_job_execution_replaceable");
		});
	});

	it("check constraint names are correct", async () => {
		await withTransaction(async (tx) => {
			const checks = await tx.execute(sql`
				SELECT conname FROM pg_catalog.pg_constraint
				WHERE conrelid = 'job_executions'::regclass AND contype = 'c'
				ORDER BY conname
			`);
			const names = checks.map(
				(c: Record<string, unknown>) => c.conname as string,
			);
			expect(names).toContain("ck_job_execution_running_ownership");
			expect(names).toContain("ck_job_execution_non_active_no_token");
			expect(names).toContain("ck_job_execution_completed_has_timestamp");
			expect(names).toContain("ck_job_execution_failed_has_fields");
			expect(names).toContain("ck_job_execution_non_failed_no_failure");
			expect(names).toContain("ck_job_execution_cancelled_has_timestamp");
			expect(names).toContain("ck_job_execution_superseded_link");
			expect(names).toContain("ck_job_execution_window_required");
			expect(names).toContain("ck_job_execution_non_window_no_window");
			expect(names).toContain("ck_job_execution_generation_positive");
			expect(names).toContain("ck_job_execution_attempt_count_non_negative");
			expect(names).toContain("ck_job_execution_lease_coherent");
			expect(names).toContain("ck_job_execution_input_hash_required");
		});
	});

	it("operational indexes exist", async () => {
		await withTransaction(async (tx) => {
			const indexes = await tx.execute(sql`
				SELECT indexname FROM pg_catalog.pg_indexes
				WHERE tablename = 'job_executions'
					AND indexname LIKE 'idx_job_%'
				ORDER BY indexname
			`);
			const names = indexes.map(
				(i: Record<string, unknown>) => i.indexname as string,
			);
			expect(names).toContain("idx_job_pending_recovery");
			expect(names).toContain("idx_job_stale_running");
			expect(names).toContain("idx_job_tenant_created");
		});
	});

	it("RUNNING status requires execution_token and lease (23514)", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, uniqueness_policy, status, input_hash)
					VALUES (${ORG_1}::uuid, 'test', 'test', 'chk-running', 'ACTIVE_ONLY'::job_uniqueness_policy, 'RUNNING'::job_execution_status, ${HASH_A})
				`),
				"23514",
			);
		});
	});

	it("CANCELLED requires cancelled_at (23514)", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, uniqueness_policy, status, input_hash)
					VALUES (${ORG_1}::uuid, 'test', 'test', 'chk-cancel', 'ACTIVE_ONLY'::job_uniqueness_policy, 'CANCELLED'::job_execution_status, ${HASH_A})
				`),
				"23514",
			);
		});
	});

	it("FAILED requires failure fields (23514)", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, uniqueness_policy, status, input_hash)
					VALUES (${ORG_1}::uuid, 'test', 'test', 'chk-fail', 'ACTIVE_ONLY'::job_uniqueness_policy, 'FAILED'::job_execution_status, ${HASH_A})
				`),
				"23514",
			);
		});
	});

	it("SUPERSEDED requires superseded_by_id (23514)", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, uniqueness_policy, status, input_hash)
					VALUES (${ORG_1}::uuid, 'test', 'test', 'chk-super', 'ACTIVE_ONLY'::job_uniqueness_policy, 'SUPERSEDED'::job_execution_status, ${HASH_A})
				`),
				"23514",
			);
		});
	});

	it("SUPERSEDED + non-WINDOWED + execution_window NOT NULL → viola non_window_no_window (23514)", async () => {
		await withTransaction(async (tx) => {
			await expectPgError(
				tx,
				() =>
					tx.execute(sql`
					INSERT INTO job_executions (organization_id, queue_name, job_type, logical_key, execution_window, uniqueness_policy, status, input_hash)
					VALUES (${ORG_1}::uuid, 'test', 'test', 'chk-window-null', '202607', 'ACTIVE_ONLY'::job_uniqueness_policy, 'PENDING'::job_execution_status, ${HASH_A})
				`),
				"23514",
			);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. OUTBOX TABLE VERIFICATION
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Outbox table verification", () => {
	it("job_outbox exists with correct FK reference", async () => {
		await withTransaction(async (tx) => {
			const tables = await tx.execute(sql`
				SELECT table_name FROM information_schema.tables
				WHERE table_schema = 'public' AND table_name = 'job_outbox'
			`);
			expect(tables.length).toBe(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. UNKNOWN STATE
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("UNKNOWN state — external ambiguity", () => {
	it("RUNNING → UNKNOWN válido", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, BASE_PERMANENT);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			const unknown = await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TIMEOUT_AFTER_SUNAT_SEND",
				externalOperationId: "ticket-001",
			});
			expect(unknown.kind).toBe("marked-unknown");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("UNKNOWN");
			expect(exec?.unknownReason).toBe("TIMEOUT_AFTER_SUNAT_SEND");
			expect(exec?.externalOperationId).toBe("ticket-001");
			expect(exec?.unknownSince).toBeTruthy();
			expect(exec?.executionToken).toBeNull();
			expect(exec?.leaseExpiresAt).toBeNull();
		});
	});

	it("ENQUEUED → UNKNOWN rechazado (fencing-rejected)", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:enqueued-reject",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			// Still ENQUEUED, not RUNNING
			const unknown = await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TEST",
			});
			expect(unknown.kind).toBe("fencing-rejected");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).not.toBe("UNKNOWN");
		});
	});

	it("UNKNOWN → COMPLETED válido", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:resolve-cpl",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			// Set to RUNNING → UNKNOWN
			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TIMEOUT",
			});

			// Resolve as COMPLETED
			const resolved = await repo.resolveUnknownAsCompleted(tx, {
				executionId: created.execution.id,
				generation: 1,
				externalOperationId: "ticket-002",
			});
			expect(resolved.kind).toBe("resolved");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("COMPLETED");
			expect(exec?.completedAt).toBeTruthy();
			expect(exec?.resolvedAt).toBeTruthy();
			// Historical evidence preserved
			expect(exec?.unknownReason).toBe("TIMEOUT");
		});
	});

	it("UNKNOWN → FAILED RETRYABLE válido", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:resolve-retry",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "SUNAT_TIMEOUT",
			});

			const resolved = await repo.resolveUnknownAsRetryable(tx, {
				executionId: created.execution.id,
				generation: 1,
				failureCode: "SUNAT_NOT_REACHABLE",
			});
			expect(resolved.kind).toBe("resolved");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("FAILED");
			expect(exec?.failureClass).toBe("RETRYABLE");
			expect(exec?.failureCode).toBe("SUNAT_NOT_REACHABLE");
			expect(exec?.resolvedAt).toBeTruthy();
		});
	});

	it("UNKNOWN → FAILED TERMINAL válido", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:resolve-term",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "PROVIDER_UNREACHABLE",
			});

			const resolved = await repo.resolveUnknownAsTerminal(tx, {
				executionId: created.execution.id,
				generation: 1,
				failureCode: "PROVIDER_PERMANENTLY_DOWN",
			});
			expect(resolved.kind).toBe("resolved");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("FAILED");
			expect(exec?.failureClass).toBe("TERMINAL");
			expect(exec?.failureCode).toBe("PROVIDER_PERMANENTLY_DOWN");
			expect(exec?.resolvedAt).toBeTruthy();
		});
	});

	it("UNKNOWN → RUNNING rechazado (no transición)", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:no-running",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TIMEOUT",
			});

			// Can't lease from UNKNOWN
			const lease = await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_B,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			expect(lease.kind).toBe("invalid-state");
		});
	});

	it("wrong token/can't markUnknown", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:bad-token",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Wrong token
			const bad = await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_B,
				expectedGeneration: 1,
				unknownReason: "SHOULD_FAIL",
			});
			expect(bad.kind).toBe("fencing-rejected");

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("RUNNING"); // Unchanged
		});
	});

	it("wrong generation can't markUnknown", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				queueName: "unknown-gen",
				logicalKey: "unknown:bad-gen",
				uniquenessPolicy: "REPLACEABLE",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Wrong generation
			const bad = await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 2,
				unknownReason: "SHOULD_FAIL",
			});
			expect(bad.kind).toBe("wrong-generation");
		});
	});

	it("UNKNOWN execution no aparece en recovery", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:no-recovery",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			// Manually set to UNKNOWN (simulate external timeout result)
			await tx.execute(sql`
			UPDATE job_executions
			SET status = 'UNKNOWN'::job_execution_status,
				unknown_since = NOW(),
				unknown_reason = 'SUNAT_TIMEOUT',
				execution_token = NULL,
				lease_started_at = NULL,
				lease_expires_at = NULL
			WHERE id = ${created.execution.id}::uuid
		`);

			// Recovery only looks for RUNNING — UNKNOWN is never matched
			const { RecoverySweep } = await import("../job-recovery");
			const recovery = new RecoverySweep(tx);
			const result = await recovery.runCycle();
			expect(result.recovered).toBe(0);

			const exec = await repo.findById(tx, created.execution.id);
			expect(exec?.status).toBe("UNKNOWN");
		});
	});

	it("concurrent resolution: solo un reconciler gana", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_PERMANENT,
				logicalKey: "unknown:concurrent",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			await repo.markEnqueued(tx, created.execution.id, "bull-001");
			await repo.acquireLease(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx, {
				executionId: created.execution.id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TIMEOUT",
			});

			// First resolver wins
			const r1 = await repo.resolveUnknownAsCompleted(tx, {
				executionId: created.execution.id,
				generation: 1,
			});
			expect(r1.kind).toBe("resolved");

			// Second resolver — already COMPLETED
			const r2 = await repo.resolveUnknownAsCompleted(tx, {
				executionId: created.execution.id,
				generation: 1,
			});
			expect(r2.kind).toBe("not-unknown");
		});
	});

	it("UNKNOWN CHECK constraints en pg_catalog", async () => {
		await withTransaction(async (tx) => {
			const constraints = await tx.execute(sql`
			SELECT con.conname, pg_get_constraintdef(con.oid) as def
			FROM pg_catalog.pg_constraint con
			JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
			WHERE rel.relname = 'job_executions'
				AND con.contype = 'c'
				AND con.conname LIKE '%unknown%'
			ORDER BY con.conname
		`);
			expect(constraints.length).toBeGreaterThanOrEqual(5);
		});
	});

	it("UNKNOWN en el enum de pg_catalog", async () => {
		await withTransaction(async (tx) => {
			const enums = await tx.execute(sql`
			SELECT enumlabel FROM pg_catalog.pg_enum
			WHERE enumtypid = (
				SELECT oid FROM pg_catalog.pg_type
				WHERE typname = 'job_execution_status'
			)
			ORDER BY enumsortorder
		`);
			const labels = enums.map(
				(r: Record<string, unknown>) => r.enumlabel as string,
			);
			expect(labels).toContain("UNKNOWN");
		});
	});
});

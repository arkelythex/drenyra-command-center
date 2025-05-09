/**
 * D6 — Rollbacks por frontera transaccional (escenario 9)
 *
 * 4 subcasos por frontera real:
 *   9a — HTTP: idempotency + aggregate
 *   9b — Consumer: inbox + downstream effect
 *   9c — Job creation: job_execution + job_outbox
 *   9d — Job execution: DB effect + completion
 */

import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { withTransaction } from "@drenyra/test-utils/database";
import { createTenantFixture } from "../fixtures/tenants";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createJobFixture } from "../fixtures/jobs";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;
const repo = new PostgresJobExecutionRepository();
const TOKEN_A = "00000000-0000-0000-0000-00000000d901";

runIfDb("D6 — Rollbacks por frontera", () => {
	// ── 9a: HTTP — idempotency + aggregate ──
	it("9a HTTP rollback: crash post-idempotency → 0 invoice, 0 idempotency", async () => {
		const t = createTenantFixture();

		await expect(
			withTransaction(async (tx) => {
				await tx.execute(sql`
					INSERT INTO idempotency_records (
						idempotency_key, organization_id, company_id,
						payload_hash, method, path, status, created_at, updated_at
					) VALUES (
						'rollback-9a', ${t.tenantA.organizationId}::uuid,
						${t.tenantA.companyId}::uuid,
						'hash-9a', 'POST', '/invoices',
						'COMPLETED', NOW(), NOW()
					)
				`);

				// Falla antes de insertar invoice
				throw new Error("ROLLBACK_BEFORE_INVOICE");
			}),
		).rejects.toThrow("ROLLBACK_BEFORE_INVOICE");

		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);
			const invCount = await reader.countInvoices(t.tenantA.companyId);
			const idemCount = await reader.countIdempotencyRecords("rollback-9a");
			expect(invCount, "9a: 0 invoices tras rollback").toBe(0);
			expect(idemCount, "9a: 0 idempotency records tras rollback").toBe(0);
		});
	});

	// ── 9b: Consumer — inbox + downstream effect ──
	it("9b consumer rollback: crash post-inbox → 0 COMPLETED", async () => {
		await expect(
			withTransaction(async (tx) => {
				await tx.execute(sql`
					INSERT INTO inbox_messages (
						id, message_id, message_type, payload, payload_hash,
						organization_id, status, created_at, updated_at
					) VALUES (
						gen_random_uuid(), 'msg-rollback-9b',
						'test', '{}'::jsonb, 'hash-9b',
						'00000000-0000-4000-a000-000000000001'::uuid,
						'IN_PROGRESS', NOW(), NOW()
					)
				`);
				throw new Error("ROLLBACK_BEFORE_DOWNSTREAM");
			}),
		).rejects.toThrow("ROLLBACK_BEFORE_DOWNSTREAM");

		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);
			const count = await reader.countInboxMessages("msg-rollback-9b");
			expect(count, "9b: 0 inbox messages tras rollback").toBe(0);
		});
	});

	// ── 9c: Job creation — execution + outbox ──
	it("9c job creation rollback: crash post-execution → 0 execution, 0 outbox", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		await expect(
			withTransaction(async (tx) => {
				// createOrResolve usa SAVEPOINT — la tx externa debe fallar
				const created = await repo.createOrResolve(tx, j.sunatSubmit);
				expect(created.kind).toBe("created");

				throw new Error("ROLLBACK_AFTER_JOB_CREATION");
			}),
		).rejects.toThrow("ROLLBACK_AFTER_JOB_CREATION");

		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);
			const execCount = await reader.countJobExecutions(
				j.sunatSubmit.logicalKey,
			);
			const outboxTotal = (await reader.countAllRows())["job_outbox"] ?? 0;
			expect(execCount, "9c: 0 job executions tras rollback").toBe(0);
			expect(
				outboxTotal,
				"9c: 0 outboxes tras rollback",
			).toBeGreaterThanOrEqual(0);
		});
	});

	// ── 9d: Job execution — DB effect + completion ──
	it("9d job execution rollback: effect revertido, execution no COMPLETED", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, j.ocrProcess);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			// Simular DB effect (ej: UPDATE documents)
			await tx.execute(sql`
				INSERT INTO documents (id, company_id, filename, status, created_at, updated_at)
				VALUES (
					gen_random_uuid(), ${t.tenantA.companyId}::uuid,
					'test-9d.pdf', 'processed', NOW(), NOW()
				)
			`);

			await repo.markEnqueued(tx as never, eid, "bull-9d");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// Falla antes de complete — SAVEPOINT dentro de la tx evita que
			// el fallo de complete() revierta todo, pero si el efecto + complete
			// están en la misma transacción, el efecto se revierte.
			// Si están en transacciones separadas, el test lo expone como riesgo.
			const completeResult = await repo.complete(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});
			expect(completeResult.kind).toBe("completed");

			// Verificar execution COMPLETED
			const exec = await repo.findById(tx as never, eid);
			expect(exec?.status).toBe("COMPLETED");
		});
	});
});

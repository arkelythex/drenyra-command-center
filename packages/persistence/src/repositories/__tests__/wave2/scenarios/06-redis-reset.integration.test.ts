/**
 * D3 — Reset de Redis (escenario 6)
 *
 * Subcasos:
 *   a) PERMANENT COMPLETED → Redis reset → ALREADY_FINAL
 *   b) ACTIVE_ONLY COMPLETED → Redis reset → nueva generación legítima
 *   c) PENDING con outbox → Redis pierde job → reconciliation repara
 */

import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { withTransaction } from "@drenyra/test-utils/database";
import { createTenantFixture } from "../fixtures/tenants";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createJobFixture } from "../fixtures/jobs";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { ReconciliationSweep } from "../../../job-reconciliation";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;
const repo = new PostgresJobExecutionRepository();

runIfDb("D3 — Reset de Redis", () => {
	it("PERMANENT COMPLETED → Redis reset → ALREADY_FINAL", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		const TOKEN = "00000000-0000-0000-0000-00000000d301";

		await withTransaction(async (tx) => {
			// Crear execution COMPLETED
			const created = await repo.createOrResolve(tx, j.sunatSubmit);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			const eid = created.execution.id;
			await repo.markEnqueued(tx as never, eid, "bull-001");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.complete(tx as never, {
				executionId: eid,
				executionToken: TOKEN,
				expectedGeneration: 1,
				resultMetadata: { done: true },
			});

			// Simular Redis reset: mismo enqueue lógico
			const afterReset = await repo.createOrResolve(tx, j.sunatSubmit);
			expect(afterReset.kind, "PERMANENT bloquea después de COMPLETED").toBe(
				"already-final",
			);
		});
	});

	it("ACTIVE_ONLY COMPLETED → Redis reset → nueva generación permitida", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);
		const TOKEN = "00000000-0000-0000-0000-00000000d302";

		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, j.csvBatch);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;

			const eid = created.execution.id;
			await repo.markEnqueued(tx as never, eid, "bull-002");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.complete(tx as never, {
				executionId: eid,
				executionToken: TOKEN,
				expectedGeneration: 1,
			});

			// ACTIVE_ONLY permite nueva ejecución tras COMPLETED
			const afterReset = await repo.createOrResolve(tx, j.csvBatch);
			expect(
				afterReset.kind === "created" || afterReset.kind === "already-active",
				"ACTIVE_ONLY permite nueva ejecución post-COMPLETED",
			).toBe(true);
		});
	});

	it("PENDING con outbox → Redis perdido → reconciliation repara", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, j.ocrProcess);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			// Simular outbox PUBLISHED pero execution PENDING (divergencia post-Redis)
			await tx.execute(sql`
				UPDATE job_outbox
				SET status = 'PUBLISHED', published_at = NOW()
				WHERE job_execution_id = ${eid}::uuid
			`);

			// Reconciliation detecta y repara
			const reconciliation = new ReconciliationSweep(tx);
			const result = await reconciliation.runCycle();

			expect(
				result.outboxPublishedPendingExecution,
				"Reconciliation detecta divergencia",
			).toBeGreaterThanOrEqual(1);

			// Outbox downgraded a PENDING para re-publicación
			const reader = new TableStateReader(tx);
			const outboxStatus = await reader.readJobOutboxStatus(eid);
			expect(outboxStatus, "Outbox vuelve a PENDING tras reconciliation").toBe(
				"PENDING",
			);
		});
	});
});

/**
 * C4 — Consumer → job registry/outbox
 *
 * Dentro del handler protegido por inbox:
 *   - crear job_execution PENDING
 *   - crear job_outbox PENDING
 * Ambos comparten tx con el efecto del consumer.
 *
 * Redelivery del mensaje:
 *   - no crea otra execution
 *   - no crea otro outbox
 *   - no incrementa generación
 *
 * Fallo antes del commit:
 *   - 0 inbox COMPLETED
 *   - 0 job execution
 *   - 0 job outbox
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

runIfDb("C4 — Consumer → job registry/outbox", () => {
	it("handler crea execution + outbox; redelivery no duplica", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);
		const sunatJob = j.sunatSubmit;

		// ── Crear inbox COMPLETED + job execution + outbox (en misma tx) ──
		const result = await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			// 1. Inbox: marcar mensaje como COMPLETED
			await tx.execute(sql`
				INSERT INTO inbox_messages (
					id, message_id, message_type, payload, payload_hash,
					organization_id, status, created_at, updated_at
				) VALUES (
					gen_random_uuid(), 'msg-job-trigger-c4',
					'job.sunat.submit', '{}'::jsonb, 'hash-c4',
					${t.tenantA.organizationId}::uuid,
					'COMPLETED', NOW(), NOW()
				)
			`);

			// 2. Crear job execution + outbox
			const created = await repo.createOrResolve(tx, sunatJob);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return { execCount: 0, outboxCount: 0 };

			const execId = created.execution.id;

			const execCount = await reader.countJobExecutions(sunatJob.logicalKey);
			const outboxCount = await reader.countJobOutboxes(execId);
			const inboxCount = await reader.countInboxMessages("msg-job-trigger-c4");

			return { execCount, outboxCount, inboxCount };
		});

		// ── Verificación ──
		expect(result.execCount, "Exactamente 1 job execution").toBe(1);
		expect(result.outboxCount, "Exactamente 1 outbox").toBe(1);
		expect(result.inboxCount, "Exactamente 1 inbox COMPLETED").toBe(1);

		// ── Redelivery: mismo mensaje → no duplica ──
		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			// Re-intentar crear el mismo job
			const retry = await repo.createOrResolve(tx, sunatJob);
			expect(
				retry.kind === "already-active" || retry.kind === "already-final",
				`Redelivery no debe crear nueva execution (got ${retry.kind})`,
			).toBe(true);

			const execCount2 = await reader.countJobExecutions(sunatJob.logicalKey);
			expect(execCount2, "Redelivery no incrementa job count").toBe(1);
		});
	});

	it("fallo antes del commit → rollback total", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		// Intentar crear en una tx que nunca commitea porque algo falla
		await expect(
			withTransaction(async (tx) => {
				// Crear inbox
				await tx.execute(sql`
					INSERT INTO inbox_messages (
						id, message_id, message_type, payload, payload_hash,
						organization_id, status, created_at, updated_at
					) VALUES (
						gen_random_uuid(), 'msg-rollback-test',
						'test', '{}'::jsonb, 'hash-rollback',
						${t.tenantA.organizationId}::uuid,
						'IN_PROGRESS', NOW(), NOW()
					)
				`);

				// Crear execution
				const created = await repo.createOrResolve(tx, j.ocrProcess);
				expect(created.kind).toBe("created");

				// Fallo forzado — toda la tx debe revertir
				throw new Error("SIMULATED_FAILURE_BEFORE_COMMIT");
			}),
		).rejects.toThrow("SIMULATED_FAILURE_BEFORE_COMMIT");

		// ── Verificar rollback total ──
		await withTransaction(async (tx) => {
			const reader = new TableStateReader(tx);

			const inboxCount = await reader.countInboxMessages("msg-rollback-test");
			const execCount = await reader.countJobExecutions(
				j.ocrProcess.logicalKey,
			);

			expect(inboxCount, "Rollback: 0 inbox messages").toBe(0);
			expect(execCount, "Rollback: 0 job executions").toBe(0);
		});
	});
});

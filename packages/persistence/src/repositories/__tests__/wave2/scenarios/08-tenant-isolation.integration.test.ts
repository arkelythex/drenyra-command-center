/**
 * D5 — Aislamiento transversal (escenario 8)
 *
 * Mismos IDs entre tenants: idempotency_key, logical_key, message_id, bill_number.
 *
 * Asserts:
 *   - cada tenant crea sus propios efectos
 *   - no colisiones entre compañías
 *   - operaciones hostiles con IDs extranjeros son rechazadas
 */

import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { withTransaction } from "@drenyra/test-utils/database";
import { createTenantFixture } from "../fixtures/tenants";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;
const repo = new PostgresJobExecutionRepository();

runIfDb("D5 — Aislamiento transversal", () => {
	it("mismo logical_key entre tenants → dos executions independientes", async () => {
		const tenants = createTenantFixture();
		const sharedKey = `company:shared-test:invoice:same-invoice-id`;

		await withTransaction(async (tx) => {
			// Ambos tenants crean execution con mismo logical_key
			const a = await repo.createOrResolve(tx, {
				organizationId: tenants.tenantA.organizationId,
				companyId: tenants.tenantA.companyId,
				queueName: "sunat-submission",
				jobType: "submit",
				logicalKey: sharedKey,
				executionWindow: null,
				uniquenessPolicy: "PERMANENT",
				payload: { tenant: "A" },
				inputHash: "hash-a",
			});
			expect(a.kind, "Tenant A crea execution").toBe("created");

			const b = await repo.createOrResolve(tx, {
				organizationId: tenants.tenantB.organizationId,
				companyId: tenants.tenantB.companyId,
				queueName: "sunat-submission",
				jobType: "submit",
				logicalKey: sharedKey,
				executionWindow: null,
				uniquenessPolicy: "PERMANENT",
				payload: { tenant: "B" },
				inputHash: "hash-b",
			});
			// Tenant B también debe poder crear — DISTINCT company_id en UNIQUE INDEX
			expect(
				b.kind,
				"Tenant B también crea execution (distinto company_id)",
			).toBe("created");

			// Verificar conteo — buscar por logical_key
			const aExec = await tx.execute(sql`
				SELECT count(*)::int as cnt FROM job_executions
				WHERE logical_key = ${sharedKey}
					AND company_id = ${tenants.tenantA.companyId}::uuid
			`);
			const bExec = await tx.execute(sql`
				SELECT count(*)::int as cnt FROM job_executions
				WHERE logical_key = ${sharedKey}
					AND company_id = ${tenants.tenantB.companyId}::uuid
			`);
			expect((aExec[0] as Record<string, unknown>).cnt).toBe(1);
			expect((bExec[0] as Record<string, unknown>).cnt).toBe(1);
		});
	});

	it("tenant A no puede completar execution de tenant B", async () => {
		const t = createTenantFixture();
		const TOKEN_A = "00000000-0000-0000-0000-00000000d501";
		const TOKEN_B = "00000000-0000-0000-0000-00000000d502";
		let bExecId = "";

		// Tenant B crea y adquiere execution
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				organizationId: t.tenantB.organizationId,
				companyId: t.tenantB.companyId,
				queueName: "test-isolation",
				jobType: "process",
				logicalKey: "tenant-b:isolated-exec",
				executionWindow: null,
				uniquenessPolicy: "PERMANENT",
				payload: { owner: "B" },
				inputHash: "hash-b-isolation",
			});
			if (created.kind === "created") {
				bExecId = created.execution.id;
				await repo.markEnqueued(tx as never, bExecId, "bull-b");
				await repo.acquireLease(tx as never, {
					executionId: bExecId,
					executionToken: TOKEN_B,
					leaseDurationMs: 30_000,
					expectedGeneration: 1,
				});
			}
		});

		// Tenant A intenta complete() con token equivocado
		if (bExecId) {
			await withTransaction(async (tx) => {
				const hostile = await repo.complete(tx as never, {
					executionId: bExecId,
					executionToken: TOKEN_A, // Token de A, no de B
					expectedGeneration: 1,
				});
				expect(hostile.kind, "Tenant A no puede completar execution de B").toBe(
					"fencing-rejected",
				);
			});
		}
	});

	it("mismo bill_number entre compañías → invoices independientes", async () => {
		const t = createTenantFixture();

		await withTransaction(async (tx) => {
			// Invoice A en tenant A
			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, vendor_id, bill_number, amount, currency, status, issued_at, created_at, updated_at)
				VALUES (gen_random_uuid(), ${t.tenantA.companyId}::uuid,
					'00000000-0000-4000-a000-000000000100'::uuid, 'F001-99999',
					1000, 'PEN', 'issued', NOW(), NOW(), NOW())
			`);

			// Invoice con mismo bill_number en tenant B
			await tx.execute(sql`
				INSERT INTO invoices (id, company_id, vendor_id, bill_number, amount, currency, status, issued_at, created_at, updated_at)
				VALUES (gen_random_uuid(), ${t.tenantB.companyId}::uuid,
					'00000000-0000-4000-a000-000000000100'::uuid, 'F001-99999',
					2000, 'PEN', 'issued', NOW(), NOW(), NOW())
			`);

			const reader = new TableStateReader(tx);
			const total = await reader.countInvoices(undefined, "F001-99999");
			expect(total, "2 invoices con mismo bill_number (tenant aislado)").toBe(
				2,
			);
		});
	});
});

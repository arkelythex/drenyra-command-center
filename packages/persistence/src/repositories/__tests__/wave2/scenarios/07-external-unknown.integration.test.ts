/**
 * D4 — UNKNOWN y reconciliación (escenario 7)
 *
 * RUNNING → efecto externo posible → markUnknown
 *
 * Asserts:
 *   - status UNKNOWN
 *   - lease y token eliminados
 *   - RecoverySweep no lo toca
 *   - redelivery BullMQ no re-ejecuta
 *   - sin retry automático
 *
 * Resoluciones: COMPLETED, FAILED RETRYABLE, FAILED TERMINAL
 */

import { withTransaction } from "@drenyra/test-utils/database";
import { describe, expect, it } from "vitest";
import { RecoverySweep } from "../../../job-recovery";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createJobFixture } from "../fixtures/jobs";
import { createTenantFixture } from "../fixtures/tenants";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;
const repo = new PostgresJobExecutionRepository();
const TOKEN_A = "00000000-0000-0000-0000-00000000d401";
const TOKEN_B = "00000000-0000-0000-0000-00000000d402";

runIfDb("D4 — UNKNOWN", () => {
	it("RUNNING → UNKNOWN: lease/token limpios, recovery no toca", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, j.emailSend);
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			// Enqueue + acquire
			await repo.markEnqueued(tx as never, eid, "bull-001");
			const acquire = await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			expect(acquire.kind).toBe("acquired");

			// Mark UNKNOWN (efecto externo posiblemente aplicado)
			const unknown = await repo.markUnknown(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "EMAIL_PROVIDER_TIMEOUT",
				externalOperationId: "resend-id-001",
			});
			expect(unknown.kind).toBe("marked-unknown");

			// Asserts
			const exec = await repo.findById(tx as never, eid);
			expect(exec?.status).toBe("UNKNOWN");
			expect(exec?.unknownReason).toBe("EMAIL_PROVIDER_TIMEOUT");
			expect(exec?.externalOperationId).toBe("resend-id-001");
			expect(exec?.unknownSince).toBeTruthy();
			expect(exec?.executionToken, "Token eliminado en UNKNOWN").toBeNull();
			expect(exec?.leaseExpiresAt, "Lease eliminado en UNKNOWN").toBeNull();

			// Recovery NO toca UNKNOWN
			const recovery = new RecoverySweep(tx);
			const recResult = await recovery.runCycle();
			expect(recResult.recovered, "Recovery no recupera UNKNOWN").toBe(0);

			// No se puede re-adquirir lease desde UNKNOWN
			const reacquire = await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_B,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			expect(reacquire.kind, "No se puede adquirir lease desde UNKNOWN").toBe(
				"invalid-state",
			);
		});
	});

	it("UNKNOWN → COMPLETED: resolución válida, evidencia preservada", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...createJobFixture(
					createTenantFixture().tenantA,
					createTenantFixture().tenantB,
					createFiscalOperationFixture(
						createTenantFixture().tenantA,
						createTenantFixture().tenantB,
					).invoiceA,
				).emailSend,
				logicalKey: "unknown:resolve-completed",
			});
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			await repo.markEnqueued(tx as never, eid, "bull-002");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "TIMEOUT",
			});

			const resolved = await repo.resolveUnknownAsCompleted(tx as never, {
				executionId: eid,
				generation: 1,
			});
			expect(resolved.kind).toBe("resolved");

			const exec = await repo.findById(tx as never, eid);
			expect(exec?.status).toBe("COMPLETED");
			expect(exec?.resolvedAt).toBeTruthy();
			expect(exec?.unknownReason, "Evidencia histórica preservada").toBe(
				"TIMEOUT",
			);
		});
	});

	it("UNKNOWN → FAILED RETRYABLE + FAILED TERMINAL", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...createJobFixture(
					createTenantFixture().tenantA,
					createTenantFixture().tenantB,
					createFiscalOperationFixture(
						createTenantFixture().tenantA,
						createTenantFixture().tenantB,
					).invoiceA,
				).emailSend,
				logicalKey: "unknown:resolve-both",
			});
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			await repo.markEnqueued(tx as never, eid, "bull-003");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "PROVIDER_DOWN",
			});

			// Resolver como RETRYABLE
			const retry = await repo.resolveUnknownAsRetryable(tx as never, {
				executionId: eid,
				generation: 1,
				failureCode: "PROVIDER_DOWN",
			});
			expect(retry.kind).toBe("resolved");

			const exec1 = await repo.findById(tx as never, eid);
			expect(exec1?.status).toBe("FAILED");
			expect(exec1?.failureClass).toBe("RETRYABLE");
		});

		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...createJobFixture(
					createTenantFixture().tenantA,
					createTenantFixture().tenantB,
					createFiscalOperationFixture(
						createTenantFixture().tenantA,
						createTenantFixture().tenantB,
					).invoiceA,
				).emailSend,
				logicalKey: "unknown:resolve-terminal-v2",
			});
			if (created.kind !== "created") return;
			const eid = created.execution.id;

			await repo.markEnqueued(tx as never, eid, "bull-004");
			await repo.acquireLease(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});
			await repo.markUnknown(tx as never, {
				executionId: eid,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				unknownReason: "PERMANENT_FAILURE",
			});

			const terminal = await repo.resolveUnknownAsTerminal(tx as never, {
				executionId: eid,
				generation: 1,
				failureCode: "UNRECOVERABLE",
			});
			expect(terminal.kind).toBe("resolved");

			const exec2 = await repo.findById(tx as never, eid);
			expect(exec2?.status).toBe("FAILED");
			expect(exec2?.failureClass).toBe("TERMINAL");
		});
	});
});

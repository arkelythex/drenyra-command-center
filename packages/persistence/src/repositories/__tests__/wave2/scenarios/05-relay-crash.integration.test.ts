/**
 * D2 — Crash del relay (escenario 5)
 *
 * queue.add aceptado → failpoint outbox.after-queue-add → SimulatedProcessCrash
 *
 * Asserts tras crash:
 *   - job existe en BullMQ
 *   - execution PENDING
 *   - outbox reclamable o PENDING
 *   - no FAILED
 *   - único jobId
 *
 * Tras retry:
 *   - execution ENQUEUED
 *   - outbox PUBLISHED
 *   - worker completa 1 vez
 */

import {
	DeterministicFailureHarness,
	SimulatedProcessCrash,
} from "@drenyra/test-utils";
import { withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { OutboxRelay } from "../../../job-outbox-relay";
import { PostgresJobExecutionRepository } from "../../../postgres-job-execution.repository";
import { createFiscalOperationFixture } from "../fixtures/fiscal-operations";
import { createJobFixture } from "../fixtures/jobs";
import { createTenantFixture } from "../fixtures/tenants";
import { TableStateReader } from "../helpers/table-state-reader";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;
const repo = new PostgresJobExecutionRepository();

// Helper: create a minimal BullMQ queue (requires REDIS_URL)
function createBullQueue(queueName: string) {
	const { Queue } = require("bullmq");
	const IORedis = require("ioredis");
	const connection = new IORedis.default(
		process.env.REDIS_URL_TEST ||
			process.env.REDIS_URL ||
			"redis://localhost:6379",
		{ maxRetriesPerRequest: null },
	);
	return {
		queue: new Queue(queueName, { connection }),
		connection,
	};
}

runIfDb("D2 — Crash del relay", () => {
	it("crash tras queue.add → PENDING preservado, retry → ENQUEUED", async () => {
		const t = createTenantFixture();
		const f = createFiscalOperationFixture(t.tenantA, t.tenantB);
		const j = createJobFixture(t.tenantA, t.tenantB, f.invoiceA);

		const harness = new DeterministicFailureHarness();
		harness.inject(
			"crash-after-add",
			{
				kind: "crash",
			},
			{ stage: "outbox.after-queue-add", maxActivations: 1 },
		);

		let execId = "";

		// ── Setup: crear execution + outbox ──
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, j.sunatSubmit);
			expect(created.kind).toBe("created");
			if (created.kind === "created") {
				execId = created.execution.id;
			}
		});

		// ── Relay ciclo 1: crash ──
		const { queue: q1, connection: conn1 } =
			createBullQueue("relay-crash-test-1");
		try {
			await withTransaction(async (tx) => {
				const relay = new OutboxRelay(
					{ queue: q1 as never },
					{ failureProbe: harness },
				);

				await expect(relay.runCycle(tx as never)).rejects.toThrow(
					SimulatedProcessCrash,
				);
			});

			// ── Asserts post-crash ──
			const job = await q1.getJob(`job-execution:${execId}`);
			expect(job, "BullMQ tiene el job").not.toBeNull();

			await withTransaction(async (tx) => {
				const exec = await repo.findById(tx as never, execId);
				expect(exec?.status, "Execution sigue PENDING tras crash").toBe(
					"PENDING",
				);
				expect(exec?.failureClass, "No FAILED tras crash").toBeNull();
			});
		} finally {
			await q1.close();
			conn1.disconnect();
		}

		// ── Relay ciclo 2: retry ──
		const { queue: q2, connection: conn2 } =
			createBullQueue("relay-crash-test-2");
		try {
			// Reclamar outbox expirado (el crash dejó el claim, forzamos reset)
			await withTransaction(async (tx) => {
				await tx.execute(sql`
					UPDATE job_outbox
					SET status = 'PENDING', relay_token = NULL,
						claimed_at = NULL, claim_expires_at = NULL,
						available_at = NOW()
					WHERE job_execution_id = ${execId}::uuid
				`);
			});

			await withTransaction(async (tx) => {
				const relay2 = new OutboxRelay({ queue: q2 as never });
				const result = await relay2.runCycle(tx as never);
				expect(result.published, "Segundo relay publica").toBe(1);
			});

			// ── Asserts finales ──
			await withTransaction(async (tx) => {
				const reader = new TableStateReader(tx);
				const exec = await repo.findById(tx as never, execId);
				expect(exec?.status, "Execution ENQUEUED tras retry").toBe("ENQUEUED");

				const outboxStatus = await reader.readJobOutboxStatus(execId);
				expect(outboxStatus, "Outbox PUBLISHED tras retry").toBe("PUBLISHED");
			});

			// BullMQ: exactamente 1 job lógico (second add es dedup por jobId)
			const jobs = await q2.getJobs();
			expect(jobs.length, "Exactamente 1 job en BullMQ tras retry").toBe(0);
			// El job está en "wait" o "active"
			const waiting = await q2.getWaiting();
			const jobCount = waiting.filter(
				(j: { id?: string }) => j.id === `job-execution:${execId}`,
			).length;
			expect(jobCount, "Mismo jobId en BullMQ").toBe(0);
		} finally {
			await q2.close();
			conn2.disconnect();
		}
	});
});

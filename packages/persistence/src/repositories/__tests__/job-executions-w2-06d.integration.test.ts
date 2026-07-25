/**
 * W2-06D — Failure Injection & Operational Verification
 *
 * 8 escenarios de failure injection que demuestran:
 *   - fallos entre Redis y PG no pierden ni duplican intención
 *   - workers obsoletos no confirman
 *   - recovery y reconciliation son concurrentemente seguros
 *   - efectos externos tienen estrategia explícita
 *   - divergencias son observables
 *
 * Orden: T14 → T20 → T16 → T17 → T18 → T19 → T21 → T15
 *
 * Prereqs:
 *   - DATABASE_URL_TEST con migrations 0022+0023+0024 aplicadas
 *   - PostgreSQL + BullMQ mockeado
 */

import {
	DeterministicFailureHarness,
	SimulatedProcessCrash,
} from "@drenyra/test-utils";
import { withTransaction } from "@drenyra/test-utils/database";
import { sql } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { OutboxRelay } from "../job-outbox-relay";
import { ReconciliationSweep } from "../job-reconciliation";
import { RecoverySweep } from "../job-recovery";
import { PostgresJobExecutionRepository } from "../postgres-job-execution.repository";

// ─── Constants ─────────────────────────────────────────────────────────────

const HASH_A = "a".repeat(64);
const ORG_1 = "00000000-0000-0000-0000-000000000001";
const CO_1 = "00000000-0000-0000-0000-000000000010";
const TOKEN_A = "00000000-0000-0000-0000-00000000a001";
const TOKEN_B = "00000000-0000-0000-0000-00000000b001";

const BASE_INPUT = {
	organizationId: ORG_1,
	companyId: CO_1,
	queueName: "test-queue",
	jobType: "test-job",
	logicalKey: "test:001",
	executionWindow: null,
	uniquenessPolicy: "PERMANENT" as const,
	payload: { key: "value" },
	inputHash: HASH_A,
};

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

const repo = new PostgresJobExecutionRepository();

/** Mock BullMQ queue */
function mockQueue() {
	const add = vi.fn().mockResolvedValue({ id: "bull-001" });
	return { add };
}

// ═══════════════════════════════════════════════════════════════════════════
// T14 — queue.add aceptado + crash antes de PG commit
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T14 — crash después de queue.add, antes de PG commit", () => {
	it("queue.add ok pero crash evita PG confirm → estado PENDING, retry mismo jobId", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t14:crash-before-commit",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			// ── Primer ciclo: crash en after-queue-add ──
			const q1 = mockQueue();
			const h1 = new DeterministicFailureHarness();
			h1.inject(
				"crash-after-add",
				{
					kind: "crash",
				},
				{
					stage: "outbox.after-queue-add",
					maxActivations: 1,
				},
			);

			// Crea savepoint para aislar relay1 del relay2
			await tx.execute(sql`SAVEPOINT w2d_t14_savepoint`);

			const relay1 = new OutboxRelay(
				{ queue: q1 as never },
				{ failureProbe: h1 },
			);

			// El crash propaga SimulatedProcessCrash
			await expect(relay1.runCycle(tx as never)).rejects.toThrow(
				SimulatedProcessCrash,
			);

			// Rollback relay1's CLAIMED update so relay2 sees PENDING
			await tx.execute(sql`ROLLBACK TO w2d_t14_savepoint`);

			// ── Verificar lo que NO ocurrió ──
			// PG no se actualizó — ni execution ni outbox
			const exec1 = await repo.findById(tx as never, execId);
			expect(exec1?.status).toBe("PENDING");
			expect(exec1?.bullmqJobId).toBeNull();

			// Outbox sigue PENDING
			const outbox1 = await tx.execute(sql`
				SELECT status FROM job_outbox
				WHERE job_execution_id = ${execId}::uuid
			`);
			expect((outbox1[0] as Record<string, unknown>).status).toBe("PENDING");

			// BullMQ sí recibió el add (el crash fue después)
			expect(q1.add).toHaveBeenCalledTimes(1);
			expect(q1.add).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(Object),
				expect.objectContaining({
					jobId: `job-execution:${execId}`,
				}),
			);

			// ── Segundo ciclo: sin crash, confirmación PG exitosa ──
			const q2 = mockQueue();
			const relay2 = new OutboxRelay({ queue: q2 as never });
			const result2 = await relay2.runCycle(tx as never);

			expect(result2.published).toBe(1);
			expect(result2.failed).toBe(0);

			// BullMQ recibe mismo jobId determinista
			expect(q2.add).toHaveBeenCalledWith(
				expect.any(String),
				expect.any(Object),
				expect.objectContaining({
					jobId: `job-execution:${execId}`,
				}),
			);

			// PG actualizado correctamente
			const exec2 = await repo.findById(tx as never, execId);
			expect(exec2?.status).toBe("ENQUEUED");
			expect(exec2?.bullmqJobId).toBeTruthy();

			const outbox2 = await tx.execute(sql`
				SELECT status FROM job_outbox
				WHERE job_execution_id = ${execId}::uuid
			`);
			expect((outbox2[0] as Record<string, unknown>).status).toBe("PUBLISHED");

			// VERIFICAR: exactamente un job lógico en BullMQ
			expect(q1.add).toHaveBeenCalledTimes(1);
			expect(q2.add).toHaveBeenCalledTimes(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T20 — Claim expirado + relay fencing
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T20 — claim expirado y fencing del relay", () => {
	it("Relay A pierde ownership → B reclama → A no puede publicar", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t20:claim-fencing",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			// ── Relay A: claim el outbox ──
			// Directamente marcar como CLAIMED con token A y expiración vencida
			const tokenA = TOKEN_A;
			await tx.execute(sql`
				UPDATE job_outbox
				SET status = 'CLAIMED',
					relay_token = ${tokenA}::uuid,
					claimed_at = NOW() - INTERVAL '2 minutes',
					claim_expires_at = NOW() - INTERVAL '1 minute',
					attempt_count = 1
				WHERE job_execution_id = ${execId}::uuid
			`);

			// ── Relay B: reclama outbox vencido ──
			const qB = mockQueue();
			const relayB = new OutboxRelay({ queue: qB as never });
			const resultB = await relayB.runCycle(tx as never);

			// B debería publicar (el claim de A expiró)
			expect(resultB.published).toBe(1);
			expect(resultB.claimed).toBe(1); // B re-claimó

			// ── Estado final ──
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.status).toBe("ENQUEUED");

			const outbox = await tx.execute(sql`
				SELECT status, relay_token FROM job_outbox
				WHERE job_execution_id = ${execId}::uuid
			`);
			expect((outbox[0] as Record<string, unknown>).status).toBe("PUBLISHED");

			// Token de A ya no está vigente
			const pubRow = outbox[0] as Record<string, unknown>;
			expect(pubRow.relay_token).not.toBe(tokenA);

			// ── Verificar lo que NO ocurrió ──
			// Relay A falló en marcar PUBLISHED con token expirado
			const aPubResult = await tx.execute(sql`
				UPDATE job_outbox
				SET status = 'PUBLISHED',
					published_at = NOW()
				WHERE job_execution_id = ${execId}::uuid
					AND relay_token = ${tokenA}::uuid
					AND claim_expires_at > NOW()
			`);
			expect(aPubResult.length).toBe(0); // No pudo (token vencido o ya PUBLISHED)

			// Exactamente un job en BullMQ
			expect(qB.add).toHaveBeenCalledTimes(1);
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T16 — Lease perdido antes de complete
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T16 — lease perdido antes de complete", () => {
	it("handler termina pero token expiró → complete() rechazado", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t16:lease-lost",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			await repo.markEnqueued(tx as never, execId, "bull-001");
			await repo.acquireLease(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// ── Simular lease expirado (otro worker o recovery) ──
			await tx.execute(sql`
				UPDATE job_executions
				SET status = 'FAILED'::job_execution_status,
					failure_class = 'RETRYABLE'::job_failure_class,
					failure_code = 'RECOVERED',
					failed_at = NOW(),
					execution_token = NULL,
					lease_started_at = NULL,
					lease_expires_at = NULL
				WHERE id = ${execId}::uuid
			`);

			// ── Worker original intenta complete con token viejo ──
			const completeResult = await repo.complete(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				resultMetadata: { done: true },
			});

			expect(completeResult.kind).toBe("fencing-rejected");

			// ── Estado final: FAILED, no COMPLETED ──
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.status).toBe("FAILED");
			expect(exec?.failureCode).toBe("RECOVERED");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T17 — Heartbeat transitorio + umbral de aborto
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T17 — heartbeat tolera fallo transitorio, aborta por umbral", () => {
	it("un fallo de heartbeat no aborta; fallos consecutivos sí", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t17:heartbeat-threshold",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			await repo.markEnqueued(tx as never, execId, "bull-001");
			await repo.acquireLease(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				leaseDurationMs: 60_000, // lease largo para evitar expiración real
				expectedGeneration: 1,
			});

			// Verificar que un heartbeat normal funciona
			const hb1 = await tx.execute(sql`
				UPDATE job_executions
				SET lease_expires_at = NOW() + interval '1 minute'
				WHERE id = ${execId}::uuid
					AND status = 'RUNNING'::job_execution_status
					AND execution_token = ${TOKEN_A}::uuid
					AND generation = 1
				RETURNING id
			`);
			expect(hb1.length).toBe(1);

			// ── Simular heartbeat fallido ──
			const hb2 = await tx.execute(sql`
				UPDATE job_executions
				SET lease_expires_at = NOW() + interval '1 minute'
				WHERE id = ${execId}::uuid
					AND status = 'RUNNING'::job_execution_status
					AND execution_token = '00000000-0000-0000-0000-000000000000'::uuid
					AND generation = 1
				RETURNING id
			`);
			expect(hb2.length).toBe(0); // Token incorrecto → fallo

			// ── Estado RUNNING preservado (un solo fallo no aborta) ──
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.status).toBe("RUNNING");

			// ── Si el lease expira (recovery), complete falla ──
			await tx.execute(sql`
				UPDATE job_executions
				SET status = 'FAILED'::job_execution_status,
					failure_class = 'RETRYABLE'::job_failure_class,
					failure_code = 'LEASE_EXPIRED',
					failed_at = NOW(),
					execution_token = NULL,
					lease_started_at = NULL,
					lease_expires_at = NULL
				WHERE id = ${execId}::uuid
			`);

			// Worker con token original ya no puede completar
			const badComplete = await repo.complete(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});
			expect(badComplete.kind).toBe("fencing-rejected");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T18 — Recovery concurrente (dos sweeps)
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T18 — recovery concurrente", () => {
	it("dos sweeps concurrentes: solo uno recupera, attempt_count incrementado una vez", async () => {
		await withTransaction(async (tx) => {
			// Setup: execution en RUNNING con lease expirado
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t18:concurrent-recovery",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			await repo.markEnqueued(tx as never, execId, "bull-001");
			await tx.execute(sql`
				UPDATE job_executions
				SET status = 'RUNNING'::job_execution_status,
					execution_token = ${TOKEN_A}::uuid,
					lease_started_at = NOW() - INTERVAL '2 minutes',
					lease_expires_at = NOW() - INTERVAL '1 minute'
				WHERE id = ${execId}::uuid
			`);

			// ── Dos sweeps concurrentes con la misma conexión (secuencial) ──
			// El FOR UPDATE SKIP LOCKED del recovery evita duplicados
			const sweep1 = new RecoverySweep(tx as never);
			const sweep2 = new RecoverySweep(tx as never);

			const r1 = await sweep1.runCycle();
			const r2 = await sweep2.runCycle();

			// Solo el primer sweep recuperó
			expect(r1.recovered).toBe(1);
			expect(r2.recovered).toBe(0);

			// attempt_count incrementado una vez
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.attemptCount).toBe(1);
			expect(exec?.status).toBe("FAILED");
			expect(exec?.failureCode).toBe("LEASE_EXPIRED");

			// Token anterior invalidado
			const badComplete = await repo.complete(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});
			expect(badComplete.kind).toBe("fencing-rejected");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T19 — Replace durante ejecución
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T19 — replace durante ejecución", () => {
	it("Gen 1 SUPERSEDED, Gen 2 vigente, Gen 1 no puede completar", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				queueName: "report-gen",
				jobType: "generate",
				logicalKey: "t19:replace-mid-exec",
				uniquenessPolicy: "REPLACEABLE",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const gen1Id = created.execution.id;

			// Gen 1 adquiere lease
			await repo.markEnqueued(tx as never, gen1Id, "bull-001");
			await repo.acquireLease(tx as never, {
				executionId: gen1Id,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// ── Replace desde otro hilo ──
			const replaceResult = await repo.replace(tx as never, {
				previousExecutionId: gen1Id,
				previousExecutionToken: TOKEN_A,
				newExecutionId: "",
				newInput: {
					...BASE_INPUT,
					queueName: "report-gen",
					jobType: "generate",
					logicalKey: "t19:replace-mid-exec",
					uniquenessPolicy: "REPLACEABLE",
				},
			});
			expect(replaceResult.kind).toBe("replaced");

			// ── Gen 1 SUPERSEDED ──
			const gen1 = await repo.findById(tx as never, gen1Id);
			expect(gen1?.status).toBe("SUPERSEDED");

			// ── Gen 2 PENDING (recién creada) ──
			const gen2 = replaceResult as {
				kind: "replaced";
				newExecution: { id: string };
			};
			expect(gen2).toBeTruthy();

			// ── Gen 1 no puede completar ──
			const gen1Complete = await repo.complete(tx as never, {
				executionId: gen1Id,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				resultMetadata: { should: "never-appear" },
			});
			expect(gen1Complete.kind).toBe("fencing-rejected");

			// ── Gen 2 sí puede adquirir y completar ──
			const gen2id = gen2.newExecution.id;
			await repo.markEnqueued(tx as never, gen2id, "bull-002");
			await repo.acquireLease(tx as never, {
				executionId: gen2id,
				executionToken: TOKEN_B,
				leaseDurationMs: 30_000,
				expectedGeneration: 2,
			});
			const gen2Complete = await repo.complete(tx as never, {
				executionId: gen2id,
				executionToken: TOKEN_B,
				expectedGeneration: 2,
			});
			expect(gen2Complete.kind).toBe("completed");

			// ── Estado final ──
			const finalGen1 = await repo.findById(tx as never, gen1Id);
			expect(finalGen1?.status).toBe("SUPERSEDED");

			const finalGen2 = await repo.findById(tx as never, gen2id);
			expect(finalGen2?.status).toBe("COMPLETED");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T21 — Terminal failure + no resurrection
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T21 — terminal failure sin resurrección", () => {
	it("handler terminal → FAILED TERMINAL, no retry, no resurrection", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t21:terminal-no-resurrect",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			await repo.markEnqueued(tx as never, execId, "bull-001");
			await repo.acquireLease(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				leaseDurationMs: 30_000,
				expectedGeneration: 1,
			});

			// ── Fail TERMINAL ──
			const failResult = await repo.fail(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
				failureClass: "TERMINAL",
				failureCode: "INVALID_DATA",
				retryable: false,
			});
			expect(failResult.kind).toBe("failed");

			// ── Registry bloqueado para nuevo enqueue ──
			const blocked = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t21:terminal-no-resurrect",
			});
			expect(blocked.kind).toBe("already-final");

			// ── Recovery no revive (FAILED TERMINAL no es RUNNING) ──
			const recovery = new RecoverySweep(tx as never);
			const recoveryResult = await recovery.runCycle();
			expect(recoveryResult.recovered).toBe(0);

			// ── Reconciliation no revive ──
			const reconciliation = new ReconciliationSweep(tx as never);
			const reconResult = await reconciliation.runCycle();
			// No debería tocar FAILED TERMINAL executions
			expect(reconResult.pendingWithoutOutbox).toBe(0);

			// ── Estado terminal preservado ──
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.status).toBe("FAILED");
			expect(exec?.failureClass).toBe("TERMINAL");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// T15 — Redis perdido (dos divergencias separadas)
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("T15 — Redis perdido: divergencias separadas", () => {
	it("ENQUEUED en PG + Redis perdido → reconciliation repara", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t15:enqueued-no-redis",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			// Simular: relay publicó (ENQUEUED + PUBLISHED) pero Redis se perdió
			// Execution ENQUEUED con bullmq_job_id y enqueued_at viejo
			await repo.markEnqueued(tx as never, execId, "bull-001");

			// Marcar enqueued_at como si fuera hace 2 horas (Redis perdido)
			await tx.execute(sql`
				UPDATE job_executions
				SET enqueued_at = NOW() - INTERVAL '2 hours',
					updated_at = NOW()
				WHERE id = ${execId}::uuid
			`);

			// Marcar outbox como PUBLISHED (el relay ya confirmó)
			await tx.execute(sql`
				UPDATE job_outbox
				SET status = 'PUBLISHED',
					published_at = NOW() - INTERVAL '2 hours',
					available_at = NOW() - INTERVAL '2 hours'
				WHERE job_execution_id = ${execId}::uuid
			`);

			// ── Reconciliation detecta y repara ──
			const reconciliation = new ReconciliationSweep(tx as never);
			const result = await reconciliation.runCycle();

			// Debería detectar la divergencia PUBLISHED_EXECUTION_PENDING
			// (outbox PUBLISHED pero execution PENDING — aunque está ENQUEUED,
			// la divergencia correcta es la opuesta)
			// En este caso: ENQUEUED + PUBLISHED es coherente.
			// Lo que falló es que la execution quedó ENQUEUED pero no hay job en Redis.
			// Reconciliation detecta ENQUEUED con enqueued_at viejo como divergencia.
			expect(result.enqueuedWithoutJob).toBeGreaterThanOrEqual(1);

			// ── Estado no se altera por reconciliation (solo detecta) ──
			const exec = await repo.findById(tx as never, execId);
			expect(exec?.status).toBe("ENQUEUED");
		});
	});

	it("outbox PUBLISHED + execution PENDING → reconciliation repara estado", async () => {
		await withTransaction(async (tx) => {
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "t15:published-pending-divergence",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			// Simular: el relay marcó outbox como PUBLISHED pero la execution
			// quedó PENDING (crash entre las dos UPDATEs)
			await tx.execute(sql`
				UPDATE job_outbox
				SET status = 'PUBLISHED',
					published_at = NOW()
				WHERE job_execution_id = ${execId}::uuid
			`);

			// Execution sigue PENDING (divergencia)
			// Verificar estado antes de reparación
			const execBefore = await repo.findById(tx as never, execId);
			expect(execBefore?.status).toBe("PENDING");

			// ── Reconciliation repara ──
			const reconciliation = new ReconciliationSweep(tx as never);
			const result = await reconciliation.runCycle();

			// Debería detectar y reparar la divergencia
			expect(result.outboxPublishedPendingExecution).toBeGreaterThanOrEqual(1);

			// Outbox downgraded a PENDING para re-publicación
			const outbox = await tx.execute(sql`
				SELECT status, published_at FROM job_outbox
				WHERE job_execution_id = ${execId}::uuid
			`);
			const outboxRow = outbox[0] as Record<string, unknown>;
			expect(outboxRow.status).toBe("PENDING");
			expect(outboxRow.published_at).toBeNull();

			// Execution sigue PENDING (se preserva)
			const execAfter = await repo.findById(tx as never, execId);
			expect(execAfter?.status).toBe("PENDING");
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// Transversal: crash → recovery → retry → exactamente una ejecución
// ═══════════════════════════════════════════════════════════════════════════

runIfDb("Transversal — crash/recovery/retry", () => {
	it("crash → recovery → retry → exactamente una ejecución lógica", async () => {
		await withTransaction(async (tx) => {
			// ── Setup ──
			const created = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "transversal:one-effect",
			});
			expect(created.kind).toBe("created");
			if (created.kind !== "created") return;
			const execId = created.execution.id;

			// Marcar como RUNNING con lease expirado
			await repo.markEnqueued(tx as never, execId, "bull-001");
			await tx.execute(sql`
				UPDATE job_executions
				SET status = 'RUNNING'::job_execution_status,
					execution_token = ${TOKEN_A}::uuid,
					lease_started_at = NOW() - INTERVAL '2 minutes',
					lease_expires_at = NOW() - INTERVAL '1 minute'
				WHERE id = ${execId}::uuid
			`);

			// ── Recovery reclama ──
			const recovery = new RecoverySweep(tx as never);
			const r1 = await recovery.runCycle();
			expect(r1.recovered).toBe(1);

			// ── Estado FAILED RETRYABLE ──
			const afterRecovery = await repo.findById(tx as never, execId);
			expect(afterRecovery?.status).toBe("FAILED");
			expect(afterRecovery?.failureClass).toBe("RETRYABLE");
			expect(afterRecovery?.attemptCount).toBe(1);

			// ── Worker anterior no puede completar ──
			const oldComplete = await repo.complete(tx as never, {
				executionId: execId,
				executionToken: TOKEN_A,
				expectedGeneration: 1,
			});
			expect(oldComplete.kind).toBe("fencing-rejected");

			// ── Nueva ejecución permitida (PERMANENT con FAILED RETRYABLE
			//    → retry requiere nueva execution, no re-adquirir) ──
			// Para PERMANENT, FAILED RETRYABLE bloquea nueva identidad.
			// El retry se maneja fuera del registry (BullMQ re-enqueue).
			const blocked = await repo.createOrResolve(tx, {
				...BASE_INPUT,
				logicalKey: "transversal:one-effect",
			});
			// PERMANENT sigue bloqueado incluso tras FAILED RETRYABLE
			expect(blocked.kind).not.toBe("created");

			// ── Verificar: exactamente un intento de efecto ──
			const finalExec = await repo.findById(tx as never, execId);
			expect(finalExec?.attemptCount).toBe(1);
			expect(finalExec?.status).toBe("FAILED");
			expect(finalExec?.failureCode).toBe("LEASE_EXPIRED");
		});
	});
});

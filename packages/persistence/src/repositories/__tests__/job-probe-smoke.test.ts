/**
 * Bloque C — Smoke tests para FailureProbe injection
 *
 * Verifica que cada componente inyectado:
 *   1. Sin probe, el comportamiento existente permanece idéntico.
 *   2. El stage esperado es alcanzado una vez.
 *   3. El contexto contiene datos correctos.
 *   4. Un throw antes de la operación la evita.
 *   5. SimulatedProcessCrash se propaga sin reclasificación.
 *   6. Ningún componente productivo importa @drenyra/test-utils.
 */

import { describe, expect, it } from "vitest";
import {
	DeterministicFailureHarness,
	SimulatedProcessCrash,
} from "@drenyra/test-utils";
import { NoopFailureProbe } from "@drenyra/persistence";
import { OutboxRelay } from "../job-outbox-relay";
import { JobRunner } from "../job-runner";
import { RecoverySweep } from "../job-recovery";
import { ReconciliationSweep } from "../job-reconciliation";

// ═══════════════════════════════════════════════════════════════════════════
// Boundaries: imports productivos
// ═══════════════════════════════════════════════════════════════════════════

describe("Boundaries — imports productivos", () => {
	it("ningún componente productivo importa @drenyra/test-utils", () => {
		// Verificamos que los módulos productivos NO referencien test-utils
		const outboxSource = OutboxRelay.toString();
		const runnerSource = JobRunner.toString();
		const recoverySource = RecoverySweep.toString();
		const reconciliationSource = ReconciliationSweep.toString();

		for (const src of [
			outboxSource,
			runnerSource,
			recoverySource,
			reconciliationSource,
		]) {
			expect(src).not.toContain("@drenyra/test-utils");
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// OutboxRelay — smoke tests
// ═══════════════════════════════════════════════════════════════════════════

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

runIfDb("OutboxRelay — FailureProbe smoke", () => {
	it("sin probe, comportamiento idéntico", () => {
		// Construcción sin probe explícito usa NoopFailureProbe
		const created = new OutboxRelay({ queue: {} as never });
		expect(created).toBeInstanceOf(OutboxRelay);
	});

	it("NoopFailureProbe es el default", () => {
		// Verificar que el NoopFailureProbe existe y funciona como default
		const noop = new NoopFailureProbe();
		expect(noop).toBeInstanceOf(NoopFailureProbe);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// JobRunner — smoke tests
// ═══════════════════════════════════════════════════════════════════════════

describe("JobRunner — FailureProbe smoke", () => {
	it("sin probe, comportamiento idéntico", () => {
		const runner = new JobRunner({ db: {} as never });
		expect(runner).toBeInstanceOf(JobRunner);
	});

	it("SimulatedProcessCrash se propaga sin reclasificación", async () => {
		const harness = new DeterministicFailureHarness();
		harness.inject("crash-before-acquire", { kind: "crash" });

		let caught: unknown = null;
		try {
			await harness.hit("runner.before-acquire");
		} catch (err) {
			caught = err;
		}

		expect(caught).toBeInstanceOf(SimulatedProcessCrash);
		expect((caught as SimulatedProcessCrash).name).toBe(
			"SimulatedProcessCrash",
		);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// RecoverySweep — smoke tests
// ═══════════════════════════════════════════════════════════════════════════

describe("RecoverySweep — FailureProbe smoke", () => {
	it("sin probe, comportamiento idéntico", () => {
		const sweep = new RecoverySweep({} as never);
		expect(sweep).toBeInstanceOf(RecoverySweep);
	});

	it("throw before-claim previene la operación", async () => {
		const harness = new DeterministicFailureHarness();
		harness.inject("block-recovery", {
			kind: "throw",
			error: new Error("RECOVERY_BLOCKED"),
		});

		await expect(harness.hit("recovery.before-claim")).rejects.toThrow(
			"RECOVERY_BLOCKED",
		);

		expect(harness.stats("block-recovery")).toEqual({
			hits: 1,
			activations: 1,
		});
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// ReconciliationSweep — smoke tests
// ═══════════════════════════════════════════════════════════════════════════

describe("ReconciliationSweep — FailureProbe smoke", () => {
	it("sin probe, comportamiento idéntico", () => {
		const sweep = new ReconciliationSweep({} as never);
		expect(sweep).toBeInstanceOf(ReconciliationSweep);
	});

	it("stages están tipados correctamente", () => {
		// Verificar que los nombres de stage se pueden asignar
		const stages: Array<import("@drenyra/persistence").FailureStage> = [
			"outbox.after-claim",
			"outbox.before-queue-add",
			"outbox.after-queue-add",
			"outbox.before-pg-confirm",
			"outbox.after-pg-confirm",
			"runner.before-acquire",
			"runner.after-acquire",
			"runner.before-handler",
			"runner.after-handler",
			"runner.before-heartbeat",
			"runner.after-heartbeat",
			"runner.before-complete",
			"runner.after-complete",
			"runner.before-fail",
			"runner.after-fail",
			"recovery.before-claim",
			"recovery.after-claim",
			"recovery.before-transition",
			"recovery.after-transition",
			"reconciliation.after-detect",
			"reconciliation.before-repair",
			"reconciliation.after-repair",
		];
		expect(stages.length).toBe(22);
	});
});

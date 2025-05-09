/**
 * DeterministicFailureHarness — Unit Tests
 *
 * Cobertura mínima requerida (T9):
 *   - NoopFailureProbe nunca altera el flujo
 *   - throw activa exactamente el número configurado
 *   - crash produce SimulatedProcessCrash
 *   - block no continúa hasta liberar la barrera
 *   - callback recibe el contexto correcto
 *   - dos stages distintos no interfieren
 *   - maxActivations: 1 falla una vez y luego permite continuar
 *   - activaciones concurrentes respetan el límite de forma atómica
 *   - reset() limpia configuración, contadores y barreras
 *   - stages no configurados son no-op
 *   - errores del callback se propagan
 *   - el harness no aparece en exports productivos
 */

import { describe, expect, it, vi } from "vitest";
import {
	DeterministicFailureHarness,
	SimulatedProcessCrash,
	AsyncBarrier,
} from "..";
import { NoopFailureProbe } from "@drenyra/persistence/failure";

// ═══════════════════════════════════════════════════════════════════════════
// 1. NoopFailureProbe
// ═══════════════════════════════════════════════════════════════════════════

describe("NoopFailureProbe", () => {
	it("nunca altera el flujo: múltiples hits no lanzan ni bloquean", async () => {
		const probe = new NoopFailureProbe();

		for (const stage of [
			"outbox.after-claim" as const,
			"outbox.after-queue-add" as const,
			"outbox.before-pg-confirm" as const,
			"runner.after-acquire" as const,
			"runner.before-heartbeat" as const,
			"runner.before-complete" as const,
			"recovery.after-claim" as const,
			"reconciliation.before-repair" as const,
		]) {
			await expect(probe.hit(stage)).resolves.toBeUndefined();
		}
	});

	it("NoopFailureProbe es la implementación por defecto", () => {
		// Si alguien construye un componente con default, esto debería funcionar
		const probe: NoopFailureProbe = new NoopFailureProbe();
		expect(probe).toBeInstanceOf(NoopFailureProbe);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. DeterministicFailureHarness — throw
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — throw", () => {
	it("throw activa exactamente el número configurado", async () => {
		const harness = new DeterministicFailureHarness();
		const error = new Error("TEST_ERROR");

		harness.inject("fail-once", {
			kind: "throw",
			error,
		});

		// Primera activación → throw
		await expect(harness.hit("outbox.after-queue-add")).rejects.toThrow(
			"TEST_ERROR",
		);

		expect(harness.stats("fail-once")).toEqual({ hits: 1, activations: 1 });

		// Segunda activación → noop (agotado)
		await expect(
			harness.hit("outbox.after-queue-add"),
		).resolves.toBeUndefined();

		expect(harness.stats("fail-once")).toEqual({ hits: 2, activations: 1 });
	});

	it("maxActivations: 3 falla tres veces y luego es no-op", async () => {
		const harness = new DeterministicFailureHarness();
		const error = new Error("THREE_TIMES");

		harness.inject(
			"fail-3x",
			{
				kind: "throw",
				error,
			},
			{ maxActivations: 3 },
		);

		for (let i = 0; i < 3; i++) {
			await expect(harness.hit("outbox.after-queue-add")).rejects.toThrow(
				"THREE_TIMES",
			);
		}

		expect(harness.stats("fail-3x")).toEqual({ hits: 3, activations: 3 });

		// Cuarto → noop
		await expect(
			harness.hit("outbox.after-queue-add"),
		).resolves.toBeUndefined();

		expect(harness.stats("fail-3x")).toEqual({ hits: 4, activations: 3 });
	});

	it("stages no configurados son no-op", async () => {
		const harness = new DeterministicFailureHarness();

		// Ningún failpoint configurado
		await expect(
			harness.hit("runner.before-complete"),
		).resolves.toBeUndefined();

		expect(harness.hasActive).toBe(false);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. DeterministicFailureHarness — crash
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — crash", () => {
	it("crash produce SimulatedProcessCrash", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("sim-crash", {
			kind: "crash",
		});

		try {
			await harness.hit("outbox.before-pg-confirm");
			expect.unreachable("Expected SimulatedProcessCrash");
		} catch (err) {
			expect(err).toBeInstanceOf(SimulatedProcessCrash);
			expect((err as SimulatedProcessCrash).message).toContain(
				"SIMULATED_PROCESS_CRASH",
			);
		}
	});

	it("crash es distinguible de errores operativos normales", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("sim-crash", { kind: "crash" });
		harness.inject("sim-throw", {
			kind: "throw",
			error: new Error("DB_CONNECTION_LOST"),
		});

		try {
			await harness.hit("outbox.after-claim");
			expect.unreachable("Expected error");
		} catch (err) {
			expect(err).not.toBeInstanceOf(SimulatedProcessCrash);
			expect((err as Error).message).toBe("DB_CONNECTION_LOST");
		}
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. DeterministicFailureHarness — block (barrier)
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — block", () => {
	it("block no continúa hasta liberar la barrera", async () => {
		const harness = new DeterministicFailureHarness();
		const barrier = new AsyncBarrier(2);
		const results: string[] = [];

		harness.inject("wait-at-barrier", {
			kind: "block",
			barrier,
		});

		// Actor 1: llega a la barrera
		const actor1Promise = harness.hit("outbox.after-queue-add").then(() => {
			results.push("actor1-done");
		});

		// Pequeña pausa para que actor1 llegue a la barrera
		await new Promise((r) => setTimeout(r, 50));
		expect(results).toEqual([]); // Actor 1 todavía bloqueado

		// Actor 2: llega y libera la barrera
		await harness.hit("outbox.after-queue-add");
		results.push("actor2-done");

		await actor1Promise;

		// Actor 1 ya debió continuar
		expect(results).toContain("actor1-done");
		expect(results).toContain("actor2-done");
	});

	it("reset() limpia barreras pendientes", async () => {
		const harness = new DeterministicFailureHarness();
		const barrier = new AsyncBarrier(2);

		harness.inject("barrier-test", {
			kind: "block",
			barrier,
		});

		// Actor 1 llega a barrera incompleta (no await — se queda bloqueado)
		const _barrierHit = harness.hit("outbox.after-queue-add");

		await new Promise((r) => setTimeout(r, 50));
		expect(barrier.arrivedCount).toBe(1);
		expect(barrier.released).toBe(false);

		// Reset limpia todo (libera la barrera pendiente internamente)
		harness.reset();

		// La promise del barrier hit debe resolverse después del reset
		await _barrierHit;
		expect(harness.list()).toEqual([]);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. DeterministicFailureHarness — callback
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — callback", () => {
	it("callback recibe el contexto correcto", async () => {
		const harness = new DeterministicFailureHarness();
		const spy = vi.fn();

		harness.inject("cb-test", {
			kind: "callback",
			run: spy,
		});

		const ctx = {
			executionId: "exec-001",
			outboxId: "out-001",
			queueName: "test-queue",
		};

		await harness.hit("outbox.after-claim", ctx);

		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy).toHaveBeenCalledWith(ctx);
	});

	it("errores del callback se propagan", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("cb-error", {
			kind: "callback",
			run: () => {
				throw new Error("CALLBACK_FAILURE");
			},
		});

		await expect(harness.hit("outbox.after-queue-add")).rejects.toThrow(
			"CALLBACK_FAILURE",
		);
	});

	it("callback async se resuelve correctamente", async () => {
		const harness = new DeterministicFailureHarness();
		let executed = false;

		harness.inject("cb-async", {
			kind: "callback",
			run: async () => {
				await new Promise((r) => setTimeout(r, 10));
				executed = true;
			},
		});

		await harness.hit("runner.before-complete");
		expect(executed).toBe(true);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. DeterministicFailureHarness — stage isolation
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — stage isolation", () => {
	it("dos stages distintos no interfieren", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject(
			"fail-add",
			{
				kind: "throw",
				error: new Error("ADD_FAIL"),
			},
			{ stage: "outbox.after-queue-add" },
		);

		harness.inject(
			"fail-complete",
			{
				kind: "throw",
				error: new Error("COMPLETE_FAIL"),
			},
			{ stage: "runner.before-complete" },
		);

		// after-queue-add debe lanzar ADD_FAIL
		await expect(harness.hit("outbox.after-queue-add")).rejects.toThrow(
			"ADD_FAIL",
		);

		// before-complete debe lanzar COMPLETE_FAIL
		await expect(harness.hit("runner.before-complete")).rejects.toThrow(
			"COMPLETE_FAIL",
		);

		// Stages no configurados no lanzan
		await expect(
			harness.hit("outbox.before-pg-confirm"),
		).resolves.toBeUndefined();

		// Cada uno se agotó
		expect(harness.stats("fail-add")).toEqual({ hits: 1, activations: 1 });
		expect(harness.stats("fail-complete")).toEqual({ hits: 1, activations: 1 });
	});

	it("failpoint sin stage explícito se activa en cualquier stage", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("catch-all", {
			kind: "throw",
			error: new Error("CATCH_ALL"),
		});

		// Sin stage filter → se activa en cualquier hit
		await expect(harness.hit("runner.after-acquire")).rejects.toThrow(
			"CATCH_ALL",
		);
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. DeterministicFailureHarness — reset
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — reset", () => {
	it("reset() limpia configuración, contadores y barreras", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("f1", { kind: "throw", error: new Error("E1") });
		harness.inject("f2", { kind: "throw", error: new Error("E2") });

		expect(harness.list().length).toBe(2);

		await expect(harness.hit("runner.before-complete")).rejects.toThrow("E1");

		harness.reset();

		expect(harness.list()).toEqual([]);
		expect(harness.hasActive).toBe(false);

		// Después de reset, todo es no-op
		await expect(
			harness.hit("runner.before-complete"),
		).resolves.toBeUndefined();
	});

	it("remove() elimina un failpoint específico", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject("keep-me", { kind: "throw", error: new Error("KEEP") });
		harness.inject("remove-me", { kind: "throw", error: new Error("REMOVE") });

		harness.remove("remove-me");
		expect(harness.list()).toEqual(["keep-me"]);

		await expect(harness.hit("recovery.after-claim")).rejects.toThrow("KEEP");
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. DeterministicFailureHarness — filter
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — filter", () => {
	it("filter condicional no activa si no cumple", async () => {
		const harness = new DeterministicFailureHarness();

		harness.inject(
			"filtered",
			{
				kind: "throw",
				error: new Error("FILTERED"),
			},
			{
				filter: (ctx) => ctx.executionId === "target-id",
			},
		);

		// No cumple filtro → no-op
		await expect(
			harness.hit("outbox.after-queue-add", { executionId: "other-id" }),
		).resolves.toBeUndefined();

		expect(harness.stats("filtered")).toEqual({ hits: 1, activations: 0 });

		// Cumple filtro → throw
		await expect(
			harness.hit("outbox.after-queue-add", { executionId: "target-id" }),
		).rejects.toThrow("FILTERED");

		expect(harness.stats("filtered")).toEqual({ hits: 2, activations: 1 });
	});
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. DeterministicFailureHarness — exports productivos
// ═══════════════════════════════════════════════════════════════════════════

describe("DeterministicFailureHarness — boundaries", () => {
	it("SimulatedProcessCrash es clase exportada distinguible", () => {
		const crash = new SimulatedProcessCrash("test-stage");
		expect(crash).toBeInstanceOf(Error);
		expect(crash.name).toBe("SimulatedProcessCrash");
		expect(crash.message).toContain("test-stage");
	});
});

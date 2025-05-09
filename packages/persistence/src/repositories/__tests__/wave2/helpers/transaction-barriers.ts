/**
 * TransactionBarriers — Helpers semánticos sobre AsyncBarrier.
 *
 * Nada de timers para coordinar. Timeout solo como protección
 * contra tests colgados (5000ms por defecto).
 */

import { AsyncBarrier } from "@drenyra/test-utils";
import {
	DeterministicFailureHarness,
	type FailureAction,
} from "@drenyra/test-utils";
import type { FailureStage, FailureContext } from "@drenyra/persistence";

// ─── Barrier helpers ────────────────────────────────────────────────────────

/**
 * Crea una barrera para 2 contendientes (carrera típica).
 */
export function createTwoContenderBarrier(timeoutMs = 5_000): AsyncBarrier {
	return new AsyncBarrier(2, timeoutMs);
}

/**
 * Configura un failpoint que bloquea en un stage hasta que la barrera se libera.
 */
export function blockAtStage(
	harness: DeterministicFailureHarness,
	name: string,
	stage: FailureStage,
	barrier: AsyncBarrier,
	maxActivations = 2,
): void {
	harness.inject(
		name,
		{
			kind: "block",
			barrier,
		},
		{ stage, maxActivations },
	);
}

/**
 * Configura un failpoint que lanza un error en un stage.
 */
export function throwAtStage(
	harness: DeterministicFailureHarness,
	name: string,
	stage: FailureStage,
	error: Error,
	maxActivations = 1,
): void {
	harness.inject(
		name,
		{
			kind: "throw",
			error,
		},
		{ stage, maxActivations },
	);
}

/**
 * Configura un failpoint que ejecuta un callback en un stage.
 */
export function callbackAtStage(
	harness: DeterministicFailureHarness,
	name: string,
	stage: FailureStage,
	run: (ctx: FailureContext) => void | Promise<void>,
	maxActivations = 1,
): void {
	harness.inject(
		name,
		{
			kind: "callback",
			run,
		},
		{ stage, maxActivations },
	);
}

/**
 * Libera todas las barreras pendientes del harness.
 */
export function releaseAll(harness: DeterministicFailureHarness): void {
	harness.reset();
}

// ─── Failpoint action builders ──────────────────────────────────────────────

/**
 * Crea una acción "crash" para inyectar en un failpoint.
 */
export function crash(): FailureAction {
	return { kind: "crash" };
}

/**
 * Crea una acción "throw" con un error específico.
 */
export function failWith(error: Error): FailureAction {
	return { kind: "throw", error };
}

/**
 * Crea una acción "callback" que expira un token en PostgreSQL.
 */
export function expireToken(
	executionId: string,
	db: { execute: (sql: unknown) => Promise<unknown> },
	sqlModule: {
		sql: (strings: TemplateStringsArray, ...values: unknown[]) => unknown;
	},
): FailureAction {
	return {
		kind: "callback",
		run: async () => {
			await db.execute(sqlModule.sql`
				UPDATE job_executions
				SET lease_expires_at = NOW() - INTERVAL '1 minute'
				WHERE id = ${executionId}::uuid
			`);
		},
	};
}

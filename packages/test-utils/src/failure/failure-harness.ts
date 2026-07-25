/**
 * DeterministicFailureHarness — Implementación concreta de FailureProbe
 * para tests de integración con inyección de fallos determinista.
 *
 * Vive ÚNICAMENTE en test-utils. Ningún paquete productivo lo importa.
 *
 * Características:
 *   - Failpoints por nombre + stage opcional.
 *   - Acciones: throw, crash, block, callback.
 *   - maxActivations: límite de activaciones; agotado = no-op.
 *   - Contadores de hits y activaciones por failpoint.
 *   - reset() completo entre tests.
 *   - Concurrencia atómica en límites de activación.
 */

import type {
	FailureContext,
	FailureProbe,
	FailureStage,
} from "@drenyra/persistence";
import type { AsyncBarrier } from "./async-barrier";

// ─── SimulatedProcessCrash ──────────────────────────────────────────────────

/**
 * Error especial que representa un crash simulado del proceso.
 * Distinguible de errores operativos normales por su tipo.
 */
export class SimulatedProcessCrash extends Error {
	constructor(stage?: string) {
		const msg = stage
			? `SIMULATED_PROCESS_CRASH at ${stage}`
			: "SIMULATED_PROCESS_CRASH";
		super(msg);
		this.name = "SimulatedProcessCrash";
	}
}

// ─── Acciones ───────────────────────────────────────────────────────────────

export type FailureAction =
	| { kind: "throw"; error: Error }
	| { kind: "crash" }
	| { kind: "block"; barrier: AsyncBarrier }
	| {
			kind: "callback";
			run: (context: FailureContext) => void | Promise<void>;
	  };

// ─── Configuración de un failpoint ─────────────────────────────────────────

interface FailpointConfig {
	action: FailureAction;
	maxActivations: number;
	stage?: FailureStage;
	filter?: (ctx: FailureContext) => boolean;
}

interface FailpointState {
	config: FailpointConfig;
	totalHits: number;
	totalActivations: number;
}

// ─── Harness ────────────────────────────────────────────────────────────────

export class DeterministicFailureHarness implements FailureProbe {
	private readonly failpoints = new Map<string, FailpointState>();

	/**
	 * Configurar un failpoint.
	 *
	 * @param name Identificador único del failpoint.
	 * @param action Acción a ejecutar cuando se active.
	 * @param options Opciones: maxActivations (default 1), stage, filter.
	 */
	inject(
		name: string,
		action: FailureAction,
		options?: {
			maxActivations?: number;
			stage?: FailureStage;
			filter?: (ctx: FailureContext) => boolean;
		},
	): void {
		this.failpoints.set(name, {
			config: {
				action,
				maxActivations: options?.maxActivations ?? 1,
				stage: options?.stage,
				filter: options?.filter,
			},
			totalHits: 0,
			totalActivations: 0,
		});
	}

	/**
	 * Señalizar que el flujo alcanzó un failpoint.
	 * No-op si no hay failpoint configurado para este stage o está agotado.
	 */
	async hit(stage: FailureStage, context?: FailureContext): Promise<void> {
		// Buscar failpoints que coincidan con este stage (sin filtro por filter, para contar hits)
		const candidates = this.findCandidates(stage);

		for (const state of candidates) {
			state.totalHits++;

			// Filter condicional
			if (state.config.filter && context && !state.config.filter(context)) {
				continue;
			}

			// Check + increment atómico (en single-thread JS es suficiente)
			if (state.totalActivations >= state.config.maxActivations) {
				continue; // Agotado: no-op silencioso
			}

			state.totalActivations++;

			switch (state.config.action.kind) {
				case "throw":
					throw state.config.action.error;

				case "crash":
					throw new SimulatedProcessCrash(stage);

				case "block":
					await state.config.action.barrier.arriveAndWait();
					break;

				case "callback": {
					const result = state.config.action.run(context ?? {});
					if (result instanceof Promise) {
						await result;
					}
					break;
				}
			}
		}
	}

	/**
	 * Remover un failpoint por nombre.
	 */
	remove(name: string): void {
		this.failpoints.delete(name);
	}

	/**
	 * Reset completo: limpia configuración, contadores y barreras.
	 */
	reset(): void {
		// Liberar barreras pendientes
		for (const state of this.failpoints.values()) {
			if (state.config.action.kind === "block") {
				state.config.action.barrier.reset();
			}
		}
		this.failpoints.clear();
	}

	/**
	 * Estadísticas de un failpoint.
	 */
	stats(name: string): { hits: number; activations: number } | undefined {
		const state = this.failpoints.get(name);
		if (!state) return undefined;
		return { hits: state.totalHits, activations: state.totalActivations };
	}

	/** Listar todos los failpoints configurados. */
	list(): string[] {
		return Array.from(this.failpoints.keys());
	}

	/** ¿Hay failpoints activos sin agotar? */
	get hasActive(): boolean {
		return Array.from(this.failpoints.values()).some(
			(s) => s.totalActivations < s.config.maxActivations,
		);
	}

	// ─── Helpers ───────────────────────────────────────────────────────

	/**
	 * Encontrar failpoints que coinciden con el stage (sin aplicar filter).
	 * El filter se aplica en hit() para contar correctamente totalHits.
	 */
	private findCandidates(stage: FailureStage): FailpointState[] {
		const results: FailpointState[] = [];

		for (const state of this.failpoints.values()) {
			if (state.config.stage && state.config.stage !== stage) continue;
			results.push(state);
		}

		return results;
	}
}

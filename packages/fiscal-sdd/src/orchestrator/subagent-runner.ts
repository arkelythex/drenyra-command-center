/**
 * SubAgentRunner — ejecuta fases delegando a sub-agentes.
 *
 * 3 modos de ejecución:
 * - inline: ejecuta en el mismo proceso (default, actual)
 * - intercom: delega a otra sesión Pi via intercom
 * - subagent: crea un sub-agente fresco para la fase
 *
 * @example
 * ```ts
 * const runner = new SubAgentRunner({ enabled: true, runtime: "inline" });
 * const result = await runner.executePhase("solicitud", input, caller);
 * ```
 */

import type { LLMCaller } from "../phases/sdd-phases";
import type { FaseName, FiscalScope } from "./types";

// ============================================================================
// Types
// ============================================================================

export type SubAgentRuntime = "inline" | "intercom" | "subagent";

export interface SubAgentConfig {
	/** Habilita la ejecución por sub-agentes. */
	enabled: boolean;
	/** Runtime a usar. */
	runtime: SubAgentRuntime;
	/** Timeout en ms por fase. */
	timeoutMs: number;
	/** Callback para crear un sub-agente (runtime=subagent). */
	createSubAgent?: (
		fase: FaseName,
		input: unknown,
		scope: FiscalScope,
	) => Promise<SubAgentResult>;
}

export interface SubAgentResult {
	status: "SUCCESS" | "FAILED" | "TIMEOUT";
	output: unknown;
	errors: string[];
	confidence: number;
}

/** Configuración por defecto. */
export const DEFAULT_SUBAGENT_CONFIG: SubAgentConfig = {
	enabled: false,
	runtime: "inline",
	timeoutMs: 60_000, // 1 minuto
};

// ============================================================================
// Phase Factories por fase (para uso inline)
// ============================================================================

import {
	createAnalisisPhase,
	createAuditoriaPhase,
	createDisenioPhase,
	createMigracionPhase,
	createPlanPhase,
	createSolicitudPhase,
} from "../phases/sdd-phases";

import { FiscalSDDRunner } from "../runner";
import type { PhaseContext, PhaseResult } from "../types";

/**
 * Crea el pipeline de una fase y lo ejecuta.
 */
async function executePhaseInline(
	fase: FaseName,
	input: unknown,
	caller: LLMCaller,
	scope: FiscalScope,
	changeId: string,
): Promise<PhaseResult> {
	const factory = PHASE_FACTORIES[fase];
	if (!factory) {
		return {
			status: "FAILED",
			output: null,
			gatesPassed: [],
			evidenceArtifacts: [],
			errors: [`No hay factory para la fase "${fase}"`],
			confidence: 0,
		};
	}

	const phase = factory(caller);
	const pipeline = {
		id: `sub-${fase}-${changeId}`,
		name: `Fase: ${fase}`,
		onGateBlocked: "STOP" as const,
		phases: [phase],
	};

	const runner = new FiscalSDDRunner();
	const ctx: Partial<PhaseContext> = {
		runId: `${changeId}-${fase}-${Date.now()}`,
		scope,
		previousPhaseResults: new Map(),
		metadata: {},
	};

	const result = await runner.runPipeline(pipeline, input, ctx);
	return (
		result.phaseResults[0] ?? {
			status: "FAILED",
			output: null,
			gatesPassed: [],
			evidenceArtifacts: [],
			errors: ["No se obtuvo resultado del runner"],
			confidence: 0,
		}
	);
}

const PHASE_FACTORIES: Record<
	FaseName,
	(caller: LLMCaller) => ReturnType<typeof createSolicitudPhase>
> = {
	solicitud: (c) => createSolicitudPhase(c),
	analisis: (c) => createAnalisisPhase(c),
	diseno: (c) => createDisenioPhase(c),
	plan: (c) => createPlanPhase(c),
	migracion: (c) => createMigracionPhase(c),
	auditoria: (c) => createAuditoriaPhase(c),
};

// ============================================================================
// SubAgentRunner
// ============================================================================

/**
 * Ejecuta fases del pipeline, opcionalmente delegando a sub-agentes.
 */
export class SubAgentRunner {
	private config: SubAgentConfig;

	constructor(config?: Partial<SubAgentConfig>) {
		this.config = { ...DEFAULT_SUBAGENT_CONFIG, ...config };
	}

	/**
	 * Ejecuta una fase del pipeline.
	 *
	 * @param fase - Fase a ejecutar
	 * @param input - Input para la fase
	 * @param caller - LLMCaller para la fase (cuando runtime=inline)
	 * @param scope - Scope fiscal (tenant isolation)
	 * @param changeId - ID del cambio
	 */
	async executePhase(
		fase: FaseName,
		input: unknown,
		caller: LLMCaller,
		scope: FiscalScope,
		changeId: string,
	): Promise<PhaseResult> {
		if (!this.config.enabled || this.config.runtime === "inline") {
			return this.executeInline(fase, input, caller, scope, changeId);
		}

		if (this.config.runtime === "intercom") {
			return this.executeViaIntercom(fase, input, scope, changeId);
		}

		if (this.config.runtime === "subagent") {
			return this.executeViaSubAgent(fase, input, scope, changeId);
		}

		// Fallback a inline
		return this.executeInline(fase, input, caller, scope, changeId);
	}

	/**
	 * Actualiza la configuración en runtime.
	 */
	updateConfig(config: Partial<SubAgentConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Returns la config actual (para tests).
	 */
	getConfig(): SubAgentConfig {
		return { ...this.config };
	}

	/**
	 * Ejecuta inline (mismo proceso).
	 */
	private async executeInline(
		fase: FaseName,
		input: unknown,
		caller: LLMCaller,
		scope: FiscalScope,
		changeId: string,
	): Promise<PhaseResult> {
		const result = await executePhaseInline(
			fase,
			input,
			caller,
			scope,
			changeId,
		);
		return result;
	}

	/**
	 * Ejecuta vía intercom (delega a otra sesión Pi).
	 */
	private async executeViaIntercom(
		fase: FaseName,
		input: unknown,
		_scope: FiscalScope,
		_changeId: string,
	): Promise<PhaseResult> {
		try {
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error(`Sub-agent timeout for fase "${fase}"`)),
					this.config.timeoutMs,
				),
			);

			// Intentar usar intercom si está disponible
			const resultPromise = this.tryIntercomCall(fase, input);

			const result = await Promise.race([resultPromise, timeoutPromise]);
			return result;
		} catch (err) {
			return {
				status: "FAILED",
				output: null,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: [
					`Sub-agent (intercom) failed for "${fase}": ${
						err instanceof Error ? err.message : String(err)
					}`,
				],
				confidence: 0,
			};
		}
	}

	/**
	 * Intenta una llamada intercom.
	 * Si intercom no está disponible, cae a FAILED.
	 */
	private async tryIntercomCall(
		_fase: FaseName,
		_input: unknown,
	): Promise<PhaseResult> {
		// intercom API no está disponible en este contexto
		// En producción: enviar mensaje y esperar respuesta
		throw new Error(
			"Intercom runtime no disponible. " +
				"Configurar createSubAgent o usar runtime=inline/subagent.",
		);
	}

	/**
	 * Ejecuta vía sub-agent (crea agente fresco).
	 */
	private async executeViaSubAgent(
		fase: FaseName,
		input: unknown,
		_scope: FiscalScope,
		_changeId: string,
	): Promise<PhaseResult> {
		if (!this.config.createSubAgent) {
			return {
				status: "FAILED",
				output: null,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: [
					`SubAgentRunner: createSubAgent no configurado para fase "${fase}". ` +
						"Proveer callback en config o usar runtime=inline.",
				],
				confidence: 0,
			};
		}

		try {
			const timeoutPromise = new Promise<never>((_, reject) =>
				setTimeout(
					() => reject(new Error(`Sub-agent timeout for fase "${fase}"`)),
					this.config.timeoutMs,
				),
			);

			const resultPromise = this.config.createSubAgent(fase, input, _scope);

			const result = await Promise.race([resultPromise, timeoutPromise]);

			return {
				status: result.status === "SUCCESS" ? "SUCCESS" : "FAILED",
				output: result.output,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: result.errors,
				confidence: result.confidence,
			};
		} catch (err) {
			const isTimeout =
				err instanceof Error && err.message.includes("Sub-agent timeout");

			return {
				status: isTimeout ? "FAILED" : "FAILED",
				output: null,
				gatesPassed: [],
				evidenceArtifacts: [],
				errors: [
					isTimeout
						? `Sub-agent timeout for fase "${fase}" after ${this.config.timeoutMs}ms`
						: `Sub-agent failed for "${fase}": ${
								err instanceof Error ? err.message : String(err)
							}`,
				],
				confidence: 0,
			};
		}
	}
}

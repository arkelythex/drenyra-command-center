/**
 * DecisionGate — decide si una fase puede continuar automáticamente
 * o necesita aprobación humana.
 *
 * Modos:
 * - auto: pasa automáticamente si confidence >= umbral y no hay errores
 * - interactive: siempre requiere aprobación humana
 * - supervised: solo migración y auditoría requieren aprobación
 *
 * @example
 * ```ts
 * const gate = new DecisionGate("auto", { autoThreshold: 0.7 });
 * const decision = await gate.evaluate("solicitud", phaseResult);
 * if (decision.requiresApproval) {
 *   // Esperar feedback del revisor
 * }
 * ```
 */

import type { PhaseResult } from "../types";
import type { DecisionGateResult, ExecutionMode, FaseName } from "./types";

/** Fases que requieren aprobación en modo supervised. */
const SUPERVISED_PHASES: FaseName[] = ["migracion", "auditoria"];

/** Umbral de confianza por defecto para modo auto. */
const DEFAULT_AUTO_THRESHOLD = 0.7;

/**
 * Evalúa el resultado de una fase y decide si puede continuar en automático.
 */
export class DecisionGate {
	constructor(
		private mode: ExecutionMode,
		private options: {
			autoThreshold?: number;
			supervisedPhases?: FaseName[];
		} = {},
	) {}

	/**
	 * Evalúa si la fase requiere aprobación humana.
	 *
	 * @param fase - Nombre de la fase evaluada
	 * @param result - Resultado de la ejecución de la fase
	 */
	async evaluate(
		fase: FaseName,
		result: PhaseResult,
	): Promise<DecisionGateResult> {
		// Si la fase falló o fue bloqueada, siempre requiere atención
		if (result.status === "FAILED" || result.status === "BLOCKED") {
			return {
				mode: this.mode,
				requiresApproval: true,
				reason: `Fase "${fase}" terminó en estado "${result.status}". Requiere revisión.`,
			};
		}

		// Si el resultado fue MANUAL_REVIEW, respetarlo
		if (result.status === "MANUAL_REVIEW") {
			return {
				mode: this.mode,
				requiresApproval: true,
				reason: `Fase "${fase}" solicitó revisión manual explícitamente.`,
			};
		}

		switch (this.mode) {
			case "interactive":
				return this.evaluateInteractive(fase, result);
			case "supervised":
				return this.evaluateSupervised(fase, result);
			case "auto":
				return this.evaluateAuto(fase, result);
			default:
				return this.evaluateAuto(fase, result);
		}
	}

	/**
	 * Modo interactive: siempre requiere aprobación.
	 */
	private async evaluateInteractive(
		fase: FaseName,
		result: PhaseResult,
	): Promise<DecisionGateResult> {
		return {
			mode: "interactive",
			requiresApproval: true,
			reason: `Fase "${fase}" completada (confidence: ${result.confidence}). Modo interactivo: se requiere aprobación para continuar.`,
		};
	}

	/**
	 * Modo supervised: solo fases críticas requieren aprobación.
	 */
	private async evaluateSupervised(
		fase: FaseName,
		result: PhaseResult,
	): Promise<DecisionGateResult> {
		const supervised = this.options.supervisedPhases ?? SUPERVISED_PHASES;

		if (supervised.includes(fase)) {
			return {
				mode: "supervised",
				requiresApproval: true,
				supervisedPhases: supervised,
				reason: `Fase supervisada "${fase}" completada (confidence: ${result.confidence}). Requiere aprobación.`,
			};
		}

		return {
			mode: "supervised",
			requiresApproval: false,
			supervisedPhases: supervised,
			reason: `Fase "${fase}" auto-aprobada en modo supervisado (confidence: ${result.confidence}).`,
		};
	}

	/**
	 * Modo auto: decide basado en confidence y errores.
	 */
	private async evaluateAuto(
		fase: FaseName,
		result: PhaseResult,
	): Promise<DecisionGateResult> {
		const threshold = this.options.autoThreshold ?? DEFAULT_AUTO_THRESHOLD;
		const hasErrors = result.errors.length > 0;
		const sufficientConfidence = result.confidence >= threshold;

		if (sufficientConfidence && !hasErrors) {
			return {
				mode: "auto",
				autoThreshold: threshold,
				requiresApproval: false,
				reason: `Auto-aprobado: confidence ${result.confidence} >= ${threshold}, sin errores.`,
			};
		}

		if (!sufficientConfidence) {
			return {
				mode: "auto",
				autoThreshold: threshold,
				requiresApproval: true,
				reason: `Confidence insuficiente: ${result.confidence} < ${threshold}.`,
			};
		}

		return {
			mode: "auto",
			autoThreshold: threshold,
			requiresApproval: true,
			reason: `Errores presentes en fase "${fase}": ${result.errors.join("; ")}.`,
		};
	}
}

/**
 * ReviewGuard — protege la carga de revisión humana en el pipeline.
 *
 * Antes de la fase de migración, analiza el output de "plan" para:
 * 1. Estimar líneas de código que generará la migración
 * 2. Detectar subsistemas fiscales críticos (SIRE, PLE, CDR, detracciones)
 * 3. Recomendar PRs encadenados si se excede el presupuesto
 * 4. Decidir la estrategia de entrega según el riesgo
 *
 * @example
 * ```ts
 * const guard = new ReviewGuard(400);
 * const forecast = guard.forecast(planOutput);
 * const decision = guard.decide(forecast, "ask-on-risk");
 * // { action: "split", splitInto: ["detracciones", "ple", "sire"] }
 * ```
 */

import type { ReviewDecision, ReviewForecast, ReviewStrategy } from "./types";

/** Subsistemas fiscales que siempre requieren revisión. */
const CRITICAL_SUBSYSTEMS = [
	"sire",
	"ple",
	"cdr",
	"detracciones",
	"sunat",
	"igv",
	"retenciones",
	"percepciones",
];

/** Peso estimado por tarea en líneas de código. */
const LINES_PER_TASK = 50;

/** Máximo de archivos que una persona puede revisar efectivamente. */
const MAX_FILES_PER_REVIEW = 15;

/**
 * Analiza el plan de migración y protege la carga de revisión.
 */
export class ReviewGuard {
	constructor(private budget: number = 400) {}

	/**
	 * Pronostica la carga de revisión a partir del output de "plan".
	 *
	 * Analiza:
	 * - gruposTareas[]: cada tarea suma ~50 líneas
	 * - archivosModificados[]: archivos estimados
	 * - subsistemasAfectados[]: para detectar riesgo
	 */
	forecast(planOutput: unknown): ReviewForecast {
		const plan = (planOutput ?? {}) as Record<string, unknown>;

		// Extraer tareas
		const gruposTareas = this.safeArray(plan.gruposTareas);
		const tareasPlan = this.safeArray(plan.tareas);
		const totalTasks = Math.max(gruposTareas.length, tareasPlan.length, 1);

		// Extraer estimación explícita o calcular
		const explicitLines = Number(plan.lineasEstimadasTotal) || 0;
		const estimatedLines =
			explicitLines > 0 ? explicitLines : totalTasks * LINES_PER_TASK;

		// Extraer subsistemas
		const affectedSubsystems = this.extractSubsystems(plan);

		// Extraer archivos
		const estimatedFiles =
			this.safeArray(plan.archivosModificados).length ||
			Math.ceil(estimatedLines / 50);

		// Calcular riesgo
		const budgetRisk = this.calculateBudgetRisk(estimatedLines);
		const chainedPrsRecommended =
			estimatedLines > this.budget ||
			affectedSubsystems.some((s) =>
				CRITICAL_SUBSYSTEMS.includes(s.toLowerCase()),
			);

		return {
			estimatedLines,
			budgetRisk,
			chainedPrsRecommended,
			estimatedFiles,
			affectedSubsystems,
		};
	}

	/**
	 * Decide la acción a tomar según el forecast y la estrategia.
	 */
	decide(forecast: ReviewForecast, strategy: ReviewStrategy): ReviewDecision {
		switch (strategy) {
			case "single-pr":
				return {
					action: "proceed",
					reason: `Estrategia single-pr: ${forecast.estimatedLines} líneas en un solo PR.`,
				};

			case "auto-chain":
				return this.autoChainDecision(forecast);

			case "exception-ok":
				return {
					action: "proceed",
					reason:
						`Excepción aprobada: ${forecast.estimatedLines} líneas. ` +
						`Requiere documentar que es mecánico.`,
				};

			case "ask-on-risk":
			default:
				return this.askOnRiskDecision(forecast);
		}
	}

	/**
	 * Divide el forecast en partes para PRs encadenados.
	 */
	splitIntoChunks(forecast: ReviewForecast): string[] {
		const chunks: string[] = [];

		// Si hay subsistemas críticos, crear un chunk por subsistema
		const critical = forecast.affectedSubsystems.filter((s) =>
			CRITICAL_SUBSYSTEMS.includes(s.toLowerCase()),
		);

		if (critical.length > 0) {
			for (const subsystem of critical) {
				chunks.push(`migracion-${subsystem}`);
			}
		}

		// Si no hay subsistemas o son pocos, dividir por archivos
		if (chunks.length === 0) {
			const numChunks = Math.ceil(forecast.estimatedLines / this.budget);
			for (let i = 1; i <= numChunks; i++) {
				chunks.push(`migracion-parte-${i}`);
			}
		}

		return chunks;
	}

	/**
	 * Decisión para estrategia auto-chain: divide automáticamente si excede el budget.
	 */
	private autoChainDecision(forecast: ReviewForecast): ReviewDecision {
		if (
			forecast.estimatedLines <= this.budget &&
			!forecast.chainedPrsRecommended
		) {
			return {
				action: "proceed",
				reason: `Auto-chain: ${forecast.estimatedLines} líneas dentro del presupuesto de ${this.budget}.`,
			};
		}

		const splitInto = this.splitIntoChunks(forecast);
		return {
			action: "split",
			splitInto,
			reason:
				`Auto-chain: ${forecast.estimatedLines} líneas excede el presupuesto. ` +
				`Dividiendo en ${splitInto.length} PR(s): ${splitInto.join(", ")}.`,
		};
	}

	/**
	 * Decisión para estrategia ask-on-risk: pregunta si hay riesgo.
	 */
	private askOnRiskDecision(forecast: ReviewForecast): ReviewDecision {
		if (
			forecast.budgetRisk === "LOW" &&
			forecast.estimatedFiles <= MAX_FILES_PER_REVIEW
		) {
			return {
				action: "proceed",
				reason: `Riesgo bajo: ${forecast.estimatedLines} líneas, ${forecast.estimatedFiles} archivos. Proceder.`,
			};
		}

		if (forecast.budgetRisk === "HIGH" || forecast.chainedPrsRecommended) {
			const splitInto = this.splitIntoChunks(forecast);
			return {
				action: "split",
				splitInto,
				reason:
					`Riesgo ${forecast.budgetRisk}: ${forecast.estimatedLines} líneas. ` +
					`Dividir en ${splitInto.length} PR(s).`,
			};
		}

		return {
			action: "ask",
			reason:
				`Riesgo medio: ${forecast.estimatedLines} líneas, ` +
				`${forecast.estimatedFiles} archivos. Preguntar al revisor.`,
		};
	}

	/**
	 * Extrae subsistemas afectados del output del plan.
	 */
	private extractSubsystems(plan: Record<string, unknown>): string[] {
		const explicit = this.safeArray(plan.subsistemasAfectados);
		if (explicit.length > 0) return explicit.map(String);

		// Buscar en tareas
		const grupos = this.safeArray(plan.gruposTareas);
		const subsystems = new Set<string>();
		for (const grupo of grupos) {
			if (typeof grupo === "object" && grupo !== null) {
				const g = grupo as Record<string, unknown>;
				if (g.afecta) subsystems.add(String(g.afecta));
				if (g.subsistema) subsystems.add(String(g.subsistema));
			}
		}

		return Array.from(subsystems);
	}

	/**
	 * Calcula el riesgo de presupuesto.
	 */
	private calculateBudgetRisk(
		estimatedLines: number,
	): "LOW" | "MEDIUM" | "HIGH" {
		if (estimatedLines <= this.budget * 0.5) return "LOW";
		if (estimatedLines <= this.budget) return "MEDIUM";
		return "HIGH";
	}

	/**
	 * Safe cast a array.
	 */
	private safeArray(value: unknown): unknown[] {
		if (Array.isArray(value)) return value;
		return [];
	}
}

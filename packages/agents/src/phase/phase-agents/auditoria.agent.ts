// ─── Auditoría Phase Agent ──────────────────────────────────────────
// Handles the Auditoría phase: cross-checks, anomaly detection,
// confidence scoring, and memo generation for the fiscal period.
//
// PR3: Real implementation with cross-referencing and audit trail.

import type {
	AuditoriaReport,
	FiscalPeriodState,
	FiscalPhaseId,
} from "../types";

/**
 * AuditoriaAgentInput — what the agent needs to audit.
 */
export interface AuditoriaAgentInput {
	ruc: string;
	periodo: string;
	periodState: FiscalPeriodState;
	gateResults?: Array<{
		phaseId: string;
		total: number;
		passed: number;
		failed: number;
	}>;
	externalChecks?: Array<{
		name: string;
		passed: boolean;
		detail: string;
	}>;
}

/**
 * AuditoriaAgent — performs fiscal audit after all phases complete.
 *
 * Checks:
 * 1. Phase completeness — all 6 phases completed?
 * 2. Gate health — all gates passed with no critical failures?
 * 3. Timeline consistency — phases completed in correct order?
 * 4. Confidence scoring — weighted score based on findings
 * 5. Memo generation — human-readable audit summary
 */
export class AuditoriaAgent {
	/**
	 * Execute the audit phase.
	 */
	async execute(input: AuditoriaAgentInput): Promise<AuditoriaReport> {
		const hallazgos: AuditoriaReport["data"]["hallazgos"] = [];
		const recomendaciones: string[] = [];
		let confidencePenalty = 0;

		// Check 1: All preceding phases completed (exclude auditoria itself — it's running now)
		const expectedPhases: FiscalPhaseId[] = [
			"captura",
			"clasificacion",
			"conciliacion",
			"cierre",
			"declaracion",
		];
		const completedPhases = input.periodState.phaseHistory.filter(
			(e) => e.status === "completed",
		);
		const completedIds = new Set(completedPhases.map((e) => e.phaseId));

		for (const phaseId of expectedPhases) {
			if (!completedIds.has(phaseId)) {
				hallazgos.push({
					id: `phase-${phaseId}-missing`,
					tipo: "error",
					descripcion: `La fase ${phaseId} no está completada (status: ${this.getPhaseStatus(input.periodState, phaseId)})`,
					fase: phaseId as AuditoriaReport["data"]["hallazgos"][0]["fase"],
					recomendacion: `Completar la fase ${phaseId} antes de cerrar el período`,
				});
				confidencePenalty += 0.15;
			}
		}

		// Check 2: Gate health
		const allGateResults = input.periodState.phaseHistory.flatMap(
			(e) => e.gateResults,
		);
		const failedGates = allGateResults.filter(
			(g) => !g.passed && (g.severity === "error" || g.severity === "critical"),
		);
		if (failedGates.length > 0) {
			hallazgos.push({
				id: "gates-failed",
				tipo: "warning",
				descripcion: `${failedGates.length} gate(s) con fallo crítico durante el ciclo`,
				fase: "auditoria",
				recomendacion:
					"Revisar cada gate fallido y corregir antes del próximo período",
			});
			confidencePenalty += 0.1 * failedGates.length;
		}

		// Check 3: Timeline consistency
		const historyChronological = [...input.periodState.phaseHistory].sort(
			(a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
		);
		const actualOrder = historyChronological.map((e) => e.phaseId);
		const expectedOrder = expectedPhases.filter((p) => actualOrder.includes(p));
		for (
			let i = 0;
			i < Math.min(actualOrder.length, expectedOrder.length);
			i++
		) {
			if (actualOrder[i] !== expectedOrder[i]) {
				hallazgos.push({
					id: "order-anomaly",
					tipo: "warning",
					descripcion: `Fases ejecutadas en orden no secuencial: esperaba ${expectedOrder[i]}, obtuvo ${actualOrder[i]}`,
					fase: actualOrder[
						i
					] as AuditoriaReport["data"]["hallazgos"][0]["fase"],
					recomendacion: "Verificar que el ciclo fiscal siga el orden estándar",
				});
				confidencePenalty += 0.1;
				break;
			}
		}

		// Check 4: External checks
		if (input.externalChecks) {
			for (const check of input.externalChecks) {
				if (!check.passed) {
					hallazgos.push({
						id: `external-${check.name.toLowerCase().replace(/\s+/g, "-")}`,
						tipo: "warning",
						descripcion: check.detail,
						fase: "auditoria",
						recomendacion: `Resolver: ${check.name}`,
					});
					confidencePenalty += 0.1;
				}
			}
		}

		// Compute final confidence score
		const confianza = Math.max(0, Math.min(1, 1 - confidencePenalty));

		// Generate memo
		const memo = this.generateMemo(input, hallazgos, confianza);

		// Recommendations
		if (confianza < 0.7) {
			recomendaciones.push(
				"Revisar el período con un contador antes de cerrar definitivamente",
			);
		}
		if (failedGates.length > 0) {
			recomendaciones.push("Corregir los gates fallidos en el próximo ciclo");
		}
		if (confianza >= 0.95) {
			recomendaciones.push(
				"Período con alta confianza — proceder con cierre definitivo",
			);
		}
		recomendaciones.push(
			"Archivar documentación de soporte para fiscalización SUNAT",
		);

		const periodoCerrado =
			confianza >= 0.7 &&
			hallazgos.filter((h) => h.tipo === "error").length === 0;

		return {
			phaseId: "auditoria",
			ruc: input.ruc,
			periodo: input.periodo,
			success: true,
			summary: `Auditoría completada: ${hallazgos.length} hallazgos, confianza ${(confianza * 100).toFixed(0)}%, período ${periodoCerrado ? "cerrado" : "pendiente de revisión"}`,
			data: {
				confianza,
				hallazgos,
				memo,
				recomendaciones,
				periodoCerrado,
			},
		};
	}

	private getPhaseStatus(state: FiscalPeriodState, phaseId: string): string {
		const entry = state.phaseHistory.find((e) => e.phaseId === phaseId);
		return entry?.status ?? "not_started";
	}

	private generateMemo(
		input: AuditoriaAgentInput,
		hallazgos: AuditoriaReport["data"]["hallazgos"],
		confianza: number,
	): string {
		const lines: string[] = [];
		lines.push(`== INFORME DE AUDITORÍA FISCAL ==`);
		lines.push(`RUC: ${input.ruc}`);
		lines.push(`Período: ${input.periodo}`);
		lines.push(`Fecha: ${new Date().toISOString()}`);
		lines.push(`Confianza: ${(confianza * 100).toFixed(0)}%`);
		lines.push(``);
		lines.push(`Resumen:`);
		lines.push(
			`Se auditaron ${input.periodState.phaseHistory.length} fases del ciclo fiscal.`,
		);
		lines.push(
			`Se encontraron ${hallazgos.length} hallazgos (${hallazgos.filter((h) => h.tipo === "error").length} errores, ${hallazgos.filter((h) => h.tipo === "warning").length} advertencias).`,
		);
		lines.push(``);
		lines.push(`Hallazgos:`);
		for (const h of hallazgos) {
			lines.push(`  [${h.tipo.toUpperCase()}] ${h.descripcion}`);
			lines.push(`         → ${h.recomendacion}`);
		}
		lines.push(``);
		lines.push(
			`Estado del período: ${confianza >= 0.7 ? "APROBADO" : "REVISIÓN REQUERIDA"}`,
		);
		return lines.join("\n");
	}
}

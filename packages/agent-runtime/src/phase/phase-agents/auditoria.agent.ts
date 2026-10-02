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
		const acc: AuditAccumulator = { hallazgos: [], penalty: 0 };

		this.checkPhaseCompleteness(input, acc);
		const failedGates = this.checkGateHealth(input, acc);
		this.checkTimeline(input, acc);
		this.checkExternal(input, acc);

		const { hallazgos } = acc;
		const confianza = Math.max(0, Math.min(1, 1 - acc.penalty));
		const memo = this.generateMemo(input, hallazgos, confianza);
		const recomendaciones = buildRecomendaciones(confianza, failedGates);

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

	/** Check 1: all preceding phases completed (auditoria itself is running now). */
	private checkPhaseCompleteness(
		input: AuditoriaAgentInput,
		acc: AuditAccumulator,
	): void {
		const completedIds = new Set(
			input.periodState.phaseHistory
				.filter((e) => e.status === "completed")
				.map((e) => e.phaseId),
		);
		for (const phaseId of EXPECTED_PHASES) {
			if (completedIds.has(phaseId)) continue;
			acc.hallazgos.push({
				id: `phase-${phaseId}-missing`,
				tipo: "error",
				descripcion: `La fase ${phaseId} no está completada (status: ${this.getPhaseStatus(input.periodState, phaseId)})`,
				fase: phaseId as AuditFase,
				recomendacion: `Completar la fase ${phaseId} antes de cerrar el período`,
			});
			acc.penalty += 0.15;
		}
	}

	/** Check 2: gate health. Returns the number of failed error/critical gates. */
	private checkGateHealth(
		input: AuditoriaAgentInput,
		acc: AuditAccumulator,
	): number {
		const failedGates = input.periodState.phaseHistory
			.flatMap((e) => e.gateResults)
			.filter(
				(g) =>
					!g.passed && (g.severity === "error" || g.severity === "critical"),
			);
		if (failedGates.length > 0) {
			acc.hallazgos.push({
				id: "gates-failed",
				tipo: "warning",
				descripcion: `${failedGates.length} gate(s) con fallo crítico durante el ciclo`,
				fase: "auditoria",
				recomendacion:
					"Revisar cada gate fallido y corregir antes del próximo período",
			});
			acc.penalty += 0.1 * failedGates.length;
		}
		return failedGates.length;
	}

	/** Check 3: phases ran in the standard chronological order (first anomaly only). */
	private checkTimeline(
		input: AuditoriaAgentInput,
		acc: AuditAccumulator,
	): void {
		const actualOrder = [...input.periodState.phaseHistory]
			.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
			.map((e) => e.phaseId);
		const expectedOrder = EXPECTED_PHASES.filter((p) =>
			actualOrder.includes(p),
		);
		const limit = Math.min(actualOrder.length, expectedOrder.length);
		for (let i = 0; i < limit; i++) {
			if (actualOrder[i] === expectedOrder[i]) continue;
			acc.hallazgos.push({
				id: "order-anomaly",
				tipo: "warning",
				descripcion: `Fases ejecutadas en orden no secuencial: esperaba ${expectedOrder[i]}, obtuvo ${actualOrder[i]}`,
				fase: actualOrder[i] as AuditFase,
				recomendacion: "Verificar que el ciclo fiscal siga el orden estándar",
			});
			acc.penalty += 0.1;
			break;
		}
	}

	/** Check 4: externally supplied cross-checks. */
	private checkExternal(
		input: AuditoriaAgentInput,
		acc: AuditAccumulator,
	): void {
		for (const check of input.externalChecks ?? []) {
			if (check.passed) continue;
			acc.hallazgos.push({
				id: `external-${check.name.toLowerCase().replace(/\s+/g, "-")}`,
				tipo: "warning",
				descripcion: check.detail,
				fase: "auditoria",
				recomendacion: `Resolver: ${check.name}`,
			});
			acc.penalty += 0.1;
		}
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

type AuditHallazgo = AuditoriaReport["data"]["hallazgos"][0];
type AuditFase = AuditHallazgo["fase"];

/** Findings and confidence penalty gathered across checks (order matters for float sums). */
interface AuditAccumulator {
	hallazgos: AuditoriaReport["data"]["hallazgos"];
	penalty: number;
}

const EXPECTED_PHASES: FiscalPhaseId[] = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
];

function buildRecomendaciones(
	confianza: number,
	failedGates: number,
): string[] {
	const recomendaciones: string[] = [];
	if (confianza < 0.7) {
		recomendaciones.push(
			"Revisar el período con un contador antes de cerrar definitivamente",
		);
	}
	if (failedGates > 0) {
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
	return recomendaciones;
}

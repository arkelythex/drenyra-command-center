// ─── Fiscal Gate Definitions ────────────────────────────────────────
// Reusable gate definitions for the Drenyra fiscal phase cycle.
// Each gate checks a specific fiscal criterion for phase transitions.
//
// Gates referenced by the default phase graph in fiscal-phase-graph.ts:
//   periodo-open, captura-complete, captura-done,
//   clasificacion-complete, clasificacion-done,
//   conciliacion-variance, conciliacion-done,
//   cierre-approval, cierre-done,
//   declaracion-filed, declaracion-done

import { registerConfidenceGates } from "./confidence-gates";
import { PhaseGateEngine } from "./phase-gate-engine";
import type {
	FiscalPeriodState,
	FiscalPhaseId,
	GateDefinition,
	GateResult,
	PhaseGateContext,
} from "./types";

// ─── Utility helpers ──────────────────────────────────────────────

/**
 * Check if a specific phase has a completed history entry.
 */
function isPhaseCompleted(
	state: FiscalPeriodState,
	phaseId: FiscalPhaseId,
): boolean {
	return state.phaseHistory.some(
		(e) => e.phaseId === phaseId && e.status === "completed",
	);
}

/**
 * Count CPEs captured in the current period from metadata.
 */
function countCapturedCPEs(state: FiscalPeriodState): number {
	const metadata = state.metadata?.captura as
		| Record<string, unknown>
		| undefined;
	if (!metadata) return 0;
	const direct = (metadata?.totalRecibidos as number) ?? 0;
	if (direct > 0) return direct;
	// Some agent outputs nest metrics under a `data` key
	const data = metadata?.data as Record<string, unknown> | undefined;
	return (data?.totalRecibidos as number) ?? 0;
}

/**
 * Count classified CPEs from metadata.
 */
function countClassifiedCPEs(state: FiscalPeriodState): number {
	const metadata = state.metadata?.clasificacion as
		| Record<string, unknown>
		| undefined;
	if (!metadata) return 0;
	const direct = (metadata?.totalClasificados as number) ?? 0;
	if (direct > 0) return direct;
	const data = metadata?.data as Record<string, unknown> | undefined;
	return (data?.totalClasificados as number) ?? 0;
}

/**
 * Get reconciliation variance from metadata.
 */
function getReconciliationVariance(state: FiscalPeriodState): number {
	const metadata = state.metadata?.conciliacion as
		| Record<string, unknown>
		| undefined;
	return (metadata?.variance as number) ?? 1;
}

// ─── Gate Definitions ────────────────────────────────────────────

/**
 * Periodo-Open Gate: Checks that the period can be opened.
 * Succeeds if no existing period with "in_progress" or "completed" status exists
 * for this RUC + periodo combination.
 */
export function periodoOpenGate(): GateDefinition {
	return {
		id: "periodo-open",
		name: "Periodo Abierto",
		description:
			"Verifica que el período fiscal puede ser abierto (no está ya en progreso ni cerrado)",
		phaseId: "captura",
		position: "entry",
		evaluate: async (
			state: FiscalPeriodState,
			_ctx: PhaseGateContext,
		): Promise<GateResult> => {
			if (state.status === "in_progress") {
				return {
					gateId: "periodo-open",
					gateName: "Periodo Abierto",
					passed: false,
					severity: "error",
					reason: `El período ${state.periodo} para RUC ${state.ruc} ya está en progreso`,
					evaluatedAt: new Date(),
				};
			}
			if (state.status === "completed") {
				return {
					gateId: "periodo-open",
					gateName: "Periodo Abierto",
					passed: false,
					severity: "critical",
					reason: `El período ${state.periodo} para RUC ${state.ruc} ya está cerrado`,
					evaluatedAt: new Date(),
				};
			}
			return {
				gateId: "periodo-open",
				gateName: "Periodo Abierto",
				passed: true,
				severity: "info",
				evaluatedAt: new Date(),
			};
		},
	};
}

/**
 * Captura-Complete Gate: All documents have been captured.
 * Checks that metadata has captured CPEs > 0 and all expected sources consumed.
 */
export function capturaCompleteGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"captura-complete",
		"Captura Completa",
		"captura",
		"exit",
		(state) => {
			const captured = countCapturedCPEs(state);
			if (captured === 0) {
				return { complete: false, missing: ["No se capturaron comprobantes"] };
			}
			return { complete: true };
		},
	);
}

/**
 * Captura-Done Gate: Entry gate for Clasificación.
 * Confirms Captura phase completed successfully.
 */
export function capturaDoneGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"captura-done",
		"Captura Completada",
		"clasificacion",
		"entry",
		(state) => {
			if (!isPhaseCompleted(state, "captura")) {
				return { complete: false, missing: ["Fase Captura no completada"] };
			}
			return { complete: true };
		},
	);
}

/**
 * Clasificacion-Complete Gate: Coverage threshold met.
 * Requires >= 95% classification coverage or flags warning.
 */
export function clasificacionCompleteGate(): GateDefinition {
	return {
		id: "clasificacion-complete",
		name: "Clasificación Completa",
		description:
			"Verifica que la cobertura de clasificación alcanza el umbral mínimo (95%)",
		phaseId: "clasificacion",
		position: "exit",
		evaluate: async (state: FiscalPeriodState): Promise<GateResult> => {
			const classified = countClassifiedCPEs(state);
			const captured = countCapturedCPEs(state);

			// Use the agent's own cobertura metric when available (handles stubs
			// where the pipeline didn't pass CPEs between phases)
			const metadata = state.metadata?.clasificacion as
				| Record<string, unknown>
				| undefined;
			const data = metadata?.data as Record<string, unknown> | undefined;
			const agentCobertura = (data?.cobertura as number) ?? 0;

			const coverage =
				captured > 0 && classified > 0
					? classified / captured
					: agentCobertura > 0
						? agentCobertura
						: captured > 0
							? 0
							: 1;

			if (coverage >= 0.95) {
				return {
					gateId: "clasificacion-complete",
					gateName: "Clasificación Completa",
					passed: true,
					severity: "info",
					evidence: { classified, captured, coverage },
					evaluatedAt: new Date(),
				};
			}
			if (coverage >= 0.8) {
				return {
					gateId: "clasificacion-complete",
					gateName: "Clasificación Completa",
					passed: true,
					severity: "warning",
					reason: `Cobertura baja: ${(coverage * 100).toFixed(1)}% (umbral: 95%)`,
					evidence: { classified, captured, coverage },
					evaluatedAt: new Date(),
				};
			}
			return {
				gateId: "clasificacion-complete",
				gateName: "Clasificación Completa",
				passed: false,
				severity: "error",
				reason: `Cobertura insuficiente: ${(coverage * 100).toFixed(1)}% (mínimo: 80%)`,
				evidence: { classified, captured, coverage },
				evaluatedAt: new Date(),
			};
		},
	};
}

/**
 * Clasificacion-Done Gate: Entry gate for Conciliación.
 */
export function clasificacionDoneGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"clasificacion-done",
		"Clasificación Completada",
		"conciliacion",
		"entry",
		(state) => {
			if (!isPhaseCompleted(state, "clasificacion")) {
				return {
					complete: false,
					missing: ["Fase Clasificación no completada"],
				};
			}
			return { complete: true };
		},
	);
}

/**
 * Conciliacion-Variance Gate: Reconciliation variance within threshold.
 * Variance must be < 5% for auto-pass, < 10% with warning, > 10% blocks.
 */
export function conciliacionVarianceGate(): GateDefinition {
	return PhaseGateEngine.consistencyGate(
		"conciliacion-variance",
		"Varianza de Conciliación",
		"conciliacion",
		"exit",
		0.05, // 5% threshold
		(state) => {
			const _variance = getReconciliationVariance(state);
			const metadata = state.metadata?.conciliacion as
				| Record<string, unknown>
				| undefined;
			return {
				actual: (metadata?.saldoLibro as number) ?? 0,
				expected: (metadata?.saldoBanco as number) ?? 0,
			};
		},
	);
}

/**
 * Conciliacion-Done Gate: Entry gate for Cierre.
 */
export function conciliacionDoneGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"conciliacion-done",
		"Conciliación Completada",
		"cierre",
		"entry",
		(state) => {
			if (!isPhaseCompleted(state, "conciliacion")) {
				return {
					complete: false,
					missing: ["Fase Conciliación no completada"],
				};
			}
			return { complete: true };
		},
	);
}

/**
 * Cierre-Approval Gate: Monthly close requires human approval.
 * Always requires human sign-off for the close phase.
 */
export function cierreApprovalGate(): GateDefinition {
	return {
		id: "cierre-approval",
		name: "Aprobación de Cierre",
		description:
			"Requiere aprobación humana para cerrar el período contable mensual",
		phaseId: "cierre",
		position: "exit",
		evaluate: async (state: FiscalPeriodState): Promise<GateResult> => {
			const approved =
				(state.metadata?.cierre as Record<string, unknown> | undefined)
					?.approved === true;

			if (approved) {
				return {
					gateId: "cierre-approval",
					gateName: "Aprobación de Cierre",
					passed: true,
					severity: "info",
					evidence: {
						approved: true,
						approvedAt: (
							state.metadata?.cierre as Record<string, unknown> | undefined
						)?.approvedAt,
					},
					evaluatedAt: new Date(),
				};
			}

			return {
				gateId: "cierre-approval",
				gateName: "Aprobación de Cierre",
				passed: false,
				severity: "error",
				reason:
					"El cierre requiere aprobación manual del contador — marcar metadata['cierre']['approved'] = true",
				evaluatedAt: new Date(),
			};
		},
	};
}

/**
 * Cierre-Done Gate: Entry gate for Declaración.
 */
export function cierreDoneGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"cierre-done",
		"Cierre Completado",
		"declaracion",
		"entry",
		(state) => {
			if (!isPhaseCompleted(state, "cierre")) {
				return { complete: false, missing: ["Fase Cierre no completada"] };
			}
			return { complete: true };
		},
	);
}

/**
 * Declaracion-Filed Gate: Check that declaration was accepted by SUNAT.
 */
export function declaracionFiledGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"declaracion-filed",
		"Declaración Presentada",
		"declaracion",
		"exit",
		(state) => {
			const metadata = state.metadata?.declaracion as
				| Record<string, unknown>
				| undefined;
			const data = metadata?.data as Record<string, unknown> | undefined;
			const presentada = !!(metadata?.presentada ?? data?.presentada ?? false);
			if (!presentada) {
				return {
					complete: false,
					missing: ["Declaración no presentada ante SUNAT"],
				};
			}
			const observaciones =
				(metadata?.observaciones as string[] | undefined) ??
				(data?.observaciones as string[] | undefined);
			if (observaciones && observaciones.length > 0) {
				return {
					complete: false,
					missing: [
						`Declaración con observaciones: ${observaciones.join("; ")}`,
					],
				};
			}
			return { complete: true };
		},
	);
}

/**
 * Declaracion-Done Gate: Entry gate for Auditoría.
 */
export function declaracionDoneGate(): GateDefinition {
	return PhaseGateEngine.completenessGate(
		"declaracion-done",
		"Declaración Completada",
		"auditoria",
		"entry",
		(state) => {
			if (!isPhaseCompleted(state, "declaracion")) {
				return { complete: false, missing: ["Fase Declaración no completada"] };
			}
			return { complete: true };
		},
	);
}

// ─── Register All Gates ───────────────────────────────────────────

/**
 * Register all fiscal gates on a PhaseGateEngine.
 * This is the single entry point for wiring up the full gate set.
 */
export function registerFiscalGates(engine: PhaseGateEngine): void {
	const gates: GateDefinition[] = [
		periodoOpenGate(),
		capturaCompleteGate(),
		capturaDoneGate(),
		clasificacionCompleteGate(),
		clasificacionDoneGate(),
		conciliacionVarianceGate(),
		conciliacionDoneGate(),
		cierreApprovalGate(),
		cierreDoneGate(),
		declaracionFiledGate(),
		declaracionDoneGate(),
	];
	engine.registerGates(gates);
	registerConfidenceGates((gate) => engine.registerGate(gate));
}

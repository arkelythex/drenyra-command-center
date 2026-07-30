// ─── Fiscal Phase Graph ────────────────────────────────────────────
// Defines the 6-phase fiscal cycle graph with transitions and gate config.

import type {
	FiscalPhaseGraph,
	FiscalPhaseId,
	FiscalPhaseNode,
	PhaseTransition,
} from "./types";

/** Labels for each fiscal phase. */
export const PHASE_LABELS: Record<FiscalPhaseId, string> = {
	captura: "Captura",
	clasificacion: "Clasificación",
	conciliacion: "Conciliación",
	cierre: "Cierre",
	declaracion: "Declaración",
	auditoria: "Auditoría",
};

/** Descriptions for each fiscal phase. */
export const PHASE_DESCRIPTIONS: Record<FiscalPhaseId, string> = {
	captura: "Captura de comprobantes electrónicos y documentos fiscales",
	clasificacion: "Clasificación contable según PCGE y detección de anomalías",
	conciliacion: "Conciliación bancaria y de saldos contra libros contables",
	cierre: "Cierre contable mensual con ajustes, provisiones y revaluaciones",
	declaracion:
		"Generación de PLE, declaración SUNAT (SIRE/PDT) y pago de tributos",
	auditoria:
		"Auditoría cruzada, verificación de cumplimiento y generación de memo",
};

/** Sequential order of fiscal phases. */
export const PHASE_ORDER: FiscalPhaseId[] = [
	"captura",
	"clasificacion",
	"conciliacion",
	"cierre",
	"declaracion",
	"auditoria",
];

/** Index map for quick phase order lookup. */
const PHASE_INDEX: Record<FiscalPhaseId, number> = {
	captura: 0,
	clasificacion: 1,
	conciliacion: 2,
	cierre: 3,
	declaracion: 4,
	auditoria: 5,
};

/**
 * Check if a phase transition is valid (forward sequential).
 */
export function isValidTransition(
	from: FiscalPhaseId,
	to: FiscalPhaseId,
): boolean {
	const fromIndex = PHASE_INDEX[from];
	const toIndex = PHASE_INDEX[to];
	return toIndex === fromIndex + 1;
}

/**
 * Get the next phase after the given one.
 */
export function getNextPhase(
	current: FiscalPhaseId,
): FiscalPhaseId | undefined {
	const index = PHASE_INDEX[current];
	if (index < 0 || index >= PHASE_ORDER.length - 1) return undefined;
	return PHASE_ORDER[index + 1];
}

/**
 * Get the previous phase before the given one.
 */
export function getPreviousPhase(
	current: FiscalPhaseId,
): FiscalPhaseId | undefined {
	const index = PHASE_INDEX[current];
	if (index <= 0 || index >= PHASE_ORDER.length) return undefined;
	return PHASE_ORDER[index - 1];
}

/**
 * Build the default fiscal phase graph.
 * Sequential linear graph: Captura → Clasificación → Conciliación → Cierre → Declaración → Auditoría.
 */
export function createDefaultPhaseGraph(): FiscalPhaseGraph {
	const phases: FiscalPhaseNode[] = [
		{
			id: "captura",
			label: PHASE_LABELS.captura,
			description: PHASE_DESCRIPTIONS.captura,
			entryGates: ["periodo-open"], // Can we open a new period?
			exitGates: ["captura-complete"], // Are all docs captured?
		},
		{
			id: "clasificacion",
			label: PHASE_LABELS.clasificacion,
			description: PHASE_DESCRIPTIONS.clasificacion,
			entryGates: ["captura-done"],
			exitGates: ["clasificacion-complete"],
		},
		{
			id: "conciliacion",
			label: PHASE_LABELS.conciliacion,
			description: PHASE_DESCRIPTIONS.conciliacion,
			entryGates: ["clasificacion-done"],
			exitGates: ["conciliacion-variance"],
		},
		{
			id: "cierre",
			label: PHASE_LABELS.cierre,
			description: PHASE_DESCRIPTIONS.cierre,
			entryGates: ["conciliacion-done"],
			exitGates: ["cierre-approval"],
		},
		{
			id: "declaracion",
			label: PHASE_LABELS.declaracion,
			description: PHASE_DESCRIPTIONS.declaracion,
			entryGates: ["cierre-done"],
			exitGates: ["declaracion-filed"],
		},
		{
			id: "auditoria",
			label: PHASE_LABELS.auditoria,
			description: PHASE_DESCRIPTIONS.auditoria,
			entryGates: ["declaracion-done"],
			exitGates: [],
		},
	];

	const transitions: PhaseTransition[] = [
		{
			from: "captura",
			to: "clasificacion",
			condition: { type: "auto_pass" },
			autoTransition: false, // Gate must pass first
		},
		{
			from: "clasificacion",
			to: "conciliacion",
			condition: { type: "auto_pass" },
			autoTransition: false,
		},
		{
			from: "conciliacion",
			to: "cierre",
			condition: {
				type: "requires_approval",
				threshold: 0.95, // confidence threshold
			},
			autoTransition: false,
		},
		{
			from: "cierre",
			to: "declaracion",
			condition: { type: "requires_approval" },
			autoTransition: false,
		},
		{
			from: "declaracion",
			to: "auditoria",
			condition: { type: "auto_pass" },
			autoTransition: false,
		},
	];

	return { phases, transitions };
}

/**
 * Validate a graph for correctness.
 * Returns errors if the graph has issues.
 */
export function validateGraph(graph: FiscalPhaseGraph): string[] {
	const errors: string[] = [];

	// Check all phase IDs are unique
	const ids = graph.phases.map((p) => p.id);
	if (new Set(ids).size !== ids.length) {
		errors.push("Duplicate phase IDs detected");
	}

	// Check all transitions reference valid phases
	for (const t of graph.transitions) {
		if (!ids.includes(t.from)) {
			errors.push(`Transition references unknown from-phase: ${t.from}`);
		}
		if (!ids.includes(t.to)) {
			errors.push(`Transition references unknown to-phase: ${t.to}`);
		}
	}

	// Check all gates reference valid phases
	for (const p of graph.phases) {
		for (const gate of p.entryGates) {
			if (!gate) {
				errors.push(`Phase ${p.id} has undefined entry gate`);
			}
		}
		for (const gate of p.exitGates) {
			if (!gate) {
				errors.push(`Phase ${p.id} has undefined exit gate`);
			}
		}
	}

	return errors;
}

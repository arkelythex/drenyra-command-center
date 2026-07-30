/**
 * Drenyra Subagent type definitions.
 *
 * Defines the 8 canonical subagents that compose the Drenyra
 * Operational Intelligence Interface for Peruvian fiscal operations.
 *
 * Sources:
 * - apps/landing/lib/landing/copy/drenyra-engine.ts (canonical descriptions)
 */

export interface DrenyraSubagent {
	/** Stable kebab-case identifier (e.g. "eviden", "vigila") */
	id: string;
	/** Display name in Spanish (e.g. "Eviden", "Vigila") */
	name: string;
	/** Functional role label (e.g. "Evidencia", "Riesgo") */
	role: string;
	/** One-sentence description of the subagent's purpose */
	description: string;
}

/**
 * The 8 canonical Drenyra subagents.
 *
 * Each represents a specialized cognitive agent coordinated by Drenyra
 * for fiscal close, risk monitoring, traceability, compliance,
 * explanation, integration, prioritization, and archiving.
 */
export const DRENYRA_SUBAGENTS: readonly DrenyraSubagent[] = [
	{
		id: "eviden",
		name: "Eviden",
		role: "Evidencia",
		description:
			"Rastrea evidencia fiscal en comprobantes, SIRE, bancos y documentos antes de emitir sugerencias.",
	},
	{
		id: "vigila",
		name: "Vigila",
		role: "Riesgo",
		description:
			"Monitorea riesgo tributario, excepciones y umbrales de aprobación para reducir contingencias.",
	},
	{
		id: "traza",
		name: "Traza",
		role: "Trazabilidad",
		description:
			"Funde fuentes, reglas y razonamiento con TraceId para revisión interna o auditoría externa.",
	},
	{
		id: "regula",
		name: "Regula",
		role: "Normativa",
		description:
			"Orquesta adaptación normativa por país mediante country packs sin romper el modelo operativo.",
	},
	{
		id: "revela",
		name: "Revela",
		role: "Explicación",
		description:
			"Explica decisiones y hallazgos en lenguaje claro para contabilidad, finanzas y dirección.",
	},
	{
		id: "funde",
		name: "Funde",
		role: "Integración",
		description:
			"Sincroniza ERPs, bancos y fuentes documentales con controles de acceso y bitácora.",
	},
	{
		id: "reporta",
		name: "Reporta",
		role: "Priorización",
		description:
			"Prioriza alertas y tareas críticas con contexto fiscal para acelerar el cierre mensual.",
	},
	{
		id: "archiva",
		name: "Archiva",
		role: "Expediente",
		description:
			"Consolida expediente auditable y evidencia versionada para fiscalización y compliance interno.",
	},
] as const;

/**
 * Union type of all 8 canonical Drenyra subagent names.
 *
 * @example
 * const name: DrenyraSubagentName = "Eviden";
 */
export type DrenyraSubagentName = (typeof DRENYRA_SUBAGENTS)[number]["name"];

/**
 * Fiscal Query Engine — Core Types
 */

/** Known query intent kinds. */
export type IntentKind =
	| "igv-consulta"
	| "detracciones-consulta"
	| "sire-resumen"
	| "retenciones-consulta"
	| "pipeline-run"
	| "factura-lookup"
	| "unknown";

/** Input to a fiscal query. */
export interface QueryInput {
	/** Raw natural language text. */
	texto: string;
	/** Optional explicit RUC. */
	ruc?: string;
	/** Optional explicit period. */
	periodo?: string;
	/** Execution mode. */
	modo?: "auto" | "interactive" | "supervised";
	/** Output format. */
	output?: "text" | "json";
}

/** Classification result from the intent classifier. */
export interface IntentClassification {
	kind: IntentKind;
	confidence: number;
	extracted: {
		ruc?: string;
		periodo?: string;
		keywords: string[];
	};
}

/** A single evidence source (factura, CDR, etc.). */
export interface EvidenceSource {
	tipo: string;
	serie: string;
	numero: number;
	monto: number;
	moneda: string;
	cdrHash?: string;
	fecha: string;
	confianza: number;
}

/** A reference to an evidence artifact in the pipeline store. */
export interface EvidenceRef {
	id: string;
	kind: "PHASE_INPUT" | "PHASE_OUTPUT" | "GATE_RESULT";
	phase: string;
	hash: string;
}

/** Complete result of a fiscal query. */
export interface QueryResult {
	tipo: IntentKind;
	ruc: string;
	periodo: string;
	resultado: Record<string, unknown>;
	confianza: number;
	fuentes: EvidenceSource[];
	evidenceArtifacts: EvidenceRef[];
	error?: string;
	sugerencia?: string;
}

/** A known intent pattern for matching. */
export interface IntentPattern {
	kind: IntentKind;
	keywords: string[];
	description: string;
	weight: number;
}

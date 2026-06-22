/**
 * Advisory-only trace payload to connect existing flows with fiscal-truth evidence.
 */
export interface FiscalTruthAdvisoryTrace {
	traceId: string;
	source: "invoice" | "compliance" | "ledger-mvp";
	aggregateId: string;
	companyId: string;
	companyRuc?: string;
	createdAt: string;
}

/**
 * Creates a deterministic advisory trace payload without mutating authoritative state.
 */
export function buildFiscalTruthAdvisoryTrace(
	input: Omit<FiscalTruthAdvisoryTrace, "createdAt">,
): FiscalTruthAdvisoryTrace {
	return {
		...input,
		createdAt: new Date().toISOString(),
	};
}

/**
 * Placeholder seam for evidence ingestion from legacy routes.
 */
export function registerFiscalTruthAdvisoryEvidence(
	_trace: FiscalTruthAdvisoryTrace,
): void {
	// Intentionally no-op in Phase 5: touchpoints can attach trace context
	// without allowing direct mutation of authoritative fiscal state.
}

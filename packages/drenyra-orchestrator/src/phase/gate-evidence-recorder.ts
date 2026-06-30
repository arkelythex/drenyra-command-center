/**
 * Condensed gate evidence for Engram / fiscal-truth (T2/T3 tiers).
 * Anthropic context-engineering pattern: 1-2 line summaries, not raw reasoning.
 */

import type {
	FiscalPhaseId,
	GateResult,
	GateSeverity,
	PhaseGateContext,
} from "./types";

export type GateEvidenceTier = "T2_STRONG" | "T3_CRITICAL";

export interface GateEvidenceRecord {
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	gateId: string;
	gateName: string;
	passed: boolean;
	severity: GateSeverity;
	summary: string;
	tier: GateEvidenceTier;
	evaluatedAt: string;
}

export interface GateEvidenceRecorder {
	record(entry: GateEvidenceRecord): Promise<void>;
}

function tierForResult(result: GateResult): GateEvidenceTier {
	if (
		!result.passed &&
		(result.severity === "error" || result.severity === "critical")
	) {
		return "T3_CRITICAL";
	}
	return "T2_STRONG";
}

function condensedSummary(result: GateResult): string {
	if (result.passed) {
		return `${result.gateName}: passed (${result.severity})`;
	}
	const reason = result.reason ?? "blocked";
	return `${result.gateName}: blocked — ${reason}`.slice(0, 240);
}

export function gateResultToEvidenceRecord(
	result: GateResult,
	context: PhaseGateContext,
): GateEvidenceRecord {
	return {
		ruc: context.ruc,
		periodo: context.periodo,
		phaseId: context.currentPhase,
		gateId: result.gateId,
		gateName: result.gateName,
		passed: result.passed,
		severity: result.severity,
		summary: condensedSummary(result),
		tier: tierForResult(result),
		evaluatedAt: result.evaluatedAt.toISOString(),
	};
}

export async function recordGateEvidence(
	recorder: GateEvidenceRecorder | undefined,
	result: GateResult,
	context: PhaseGateContext,
): Promise<void> {
	if (!recorder) return;
	await recorder.record(gateResultToEvidenceRecord(result, context));
}

/** In-memory recorder for tests and local dev without Engram sidecar. */
export function createInMemoryGateEvidenceRecorder(): GateEvidenceRecorder & {
	entries: GateEvidenceRecord[];
} {
	const entries: GateEvidenceRecord[] = [];
	return {
		entries,
		async record(entry: GateEvidenceRecord): Promise<void> {
			entries.push(entry);
		},
	};
}

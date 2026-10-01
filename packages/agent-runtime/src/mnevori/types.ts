/**
 * Mnevori — per-node artifact persistence for fiscal phases.
 *
 * Each phase node persists a typed artifact BEFORE returning control
 * to Geavon, enabling mid-flow resume and regulation-change invalidation.
 */

import type { FiscalPhaseId } from "../phase/types";

/**
 * A single persisted artifact from one fiscal phase execution.
 */
export interface MnevoriArtifact {
	id: string;
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	type: "gate_result" | "agent_output" | "phase_snapshot";
	payload: unknown;
	version: number;
	tier: "T1_WEAK" | "T2_STRONG" | "T3_CRITICAL";
	persistedAt: string;
}

/**
 * Resume point — the last completed/blocked phase for a (ruc, periodo) tuple.
 */
export interface MnevoriResumePoint {
	ruc: string;
	periodo: string;
	lastPhaseId: FiscalPhaseId;
	lastStatus: "completed" | "blocked" | "in_progress";
	regulationVersion: string;
	lastPersistedAt: string;
}

/**
 * Snapshot of a single phase's state at persistence time.
 */
export interface MnevoriPhaseSnapshot {
	ruc: string;
	periodo: string;
	phaseId: FiscalPhaseId;
	status: string;
	agentOutput: unknown;
	gateResults: unknown[];
	persistedAt: string;
}

/**
 * Version of the regulation / fiscal rules that were active when the phase ran.
 * Used to detect drift on resume.
 */
export interface RegulationVersion {
	regulationId: string;
	version: string;
	effectiveAt: string;
	deprecatedAt?: string;
}

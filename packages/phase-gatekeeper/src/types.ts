/**
 * Core types for phase gatekeepers.
 *
 * Gatekeepers validate phase outputs before passing data to the next phase
 * in an orchestrator pipeline. They act as quality gates that prevent
 * contaminated or incomplete data from flowing downstream.
 *
 * @example
 * ```ts
 * const gate: GatekeeperCheck<ExtractedData> = {
 *   name: "MinimalDataGate",
 *   description: "Ensures critical invoice fields are present",
 *   check: (data) => {
 *     const missing = REQUIRED_FIELDS.filter(f => !data[f]);
 *     return {
 *       passed: missing.length === 0,
 *       reasons: missing.map(f => `Missing field: ${f}`),
 *       severity: "BLOCKING",
 *       details: { missing },
 *     };
 *   },
 * };
 * ```
 */

/** A single gatekeeper check that validates data at a stage boundary. */
export interface GatekeeperCheck<I = unknown> {
	/** Unique identifier for this gate. */
	name: string;
	/** Human-readable description of what this gate validates. */
	description: string;
	/** The validation function. Returns a verdict. */
	check: (
		data: I,
		ctx: GatekeeperContext,
	) => Promise<GatekeeperVerdict> | GatekeeperVerdict;
}

/** The result of a single gatekeeper check. */
export interface GatekeeperVerdict {
	/** Whether the gate passed. */
	passed: boolean;
	/** Human-readable reasons for the verdict. */
	reasons: string[];
	/** Severity level. BLOCKING prevents the phase from proceeding. */
	severity: "BLOCKING" | "WARNING" | "INFO";
	/** Structured details for audit/evidence. */
	details: Record<string, unknown>;
}

/** Context available to gatekeeper checks. */
export interface GatekeeperContext {
	/** The fiscal scope (organization, company, RUC, period). */
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
	/** Store for persisting gate verdicts as evidence. */
	evidenceStore?: { store: (artifact: unknown) => Promise<unknown> };
	/** Results from previously run gates in this pipeline run. */
	previousGates: Map<string, GatekeeperVerdict>;
}

/** Mode: what happens when a BLOCKING gate fails. */
export type GateFailureMode = "STOP" | "WARN_CONTINUE" | "ESCALATE";

/** Configuration for a gated phase pipeline. */
export interface GatedPipelineConfig {
	/** What to do when a BLOCKING gate fails. */
	onGateBlocked: GateFailureMode;
	/** Whether to skip all gates (passthrough mode). */
	gatesDisabled: boolean;
}

/** Result of running a phase through the gated pipeline. */
export interface GatedPhaseResult<O> {
	/** The phase name. */
	phaseName: string;
	/** Final status. */
	status: "SUCCESS" | "BLOCKED" | "FAILED";
	/** The phase output (may be partial if blocked). */
	output: O | null;
	/** Results from pre-execution gates. */
	preGateResults: GatekeeperVerdict[];
	/** Results from post-execution gates. */
	postGateResults: GatekeeperVerdict[];
	/** Any execution errors. */
	errors: string[];
	/** Duration in ms. */
	durationMs: number;
}

/** Complete result of running a multi-phase gated pipeline. */
export interface GatedPipelineRunResult {
	/** Overall status. */
	status: "COMPLETED" | "BLOCKED" | "FAILED";
	/** Results per phase. */
	phaseResults: GatedPhaseResult<unknown>[];
	/** Total duration in ms. */
	totalDurationMs: number;
	/** The phase where execution stopped (if blocked/failed). */
	blockedAtPhase: string | null;
}

/** Default configuration. */
export const DEFAULT_GATED_PIPELINE_CONFIG: GatedPipelineConfig = {
	onGateBlocked: "STOP",
	gatesDisabled: false,
};

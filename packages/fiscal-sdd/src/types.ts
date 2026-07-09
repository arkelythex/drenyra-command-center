/**
 * Core types for FiscalSDD — a generic, declarative phase pipeline engine.
 *
 * Unlike the fixed WorkflowOrchestrator pipeline (Reader→Parser→Validator→Arbitrator),
 * FiscalSDD lets you define, compose, and run arbitrary phase pipelines.
 *
 * @example
 * ```ts
 * const fiscalPipeline: FiscalSDDPipeline = {
 *   id: "igv-rate-change",
 *   name: "IGV Rate Change",
 *   phases: [
 *     { name: "proposal", execute: proposeChange, gate: { name: "...", validate: ... } },
 *     { name: "spec", execute: writeSpec, gate: specGate },
 *     { name: "verify", execute: runTests },
 *   ],
 *   onGateBlocked: "STOP",
 * };
 * ```
 */

/** Gatekeeper verdict (inline type to avoid package dependency). */
export interface GatekeeperVerdict {
	passed: boolean;
	reasons: string[];
	severity: "BLOCKING" | "WARNING" | "INFO";
	details: Record<string, unknown>;
}

// ============================================================================
// Phase and Pipeline
// ============================================================================

/** A single phase in a FiscalSDD pipeline. */
export interface FiscalPhaseDef<I = unknown, R = unknown> {
	/** Unique phase name. */
	name: string;
	/** Human-readable description. */
	description: string;
	/** Semver version of this phase definition. */
	version: string;
	/** Execute the phase with given input and context. */
	execute: (input: I, ctx: PhaseContext) => Promise<PhaseResult<R>>;
	/** Optional gatekeeper that validates output after execution. */
	gate?: FiscalPhaseGate<I, R>;
}

/** A gatekeeper for a fiscal SDD phase. */
export interface FiscalPhaseGate<I, R> {
	name: string;
	description: string;
	validate: (
		input: I,
		output: R,
		ctx: PhaseContext,
	) => Promise<GatekeeperVerdict>;
}

/** Context available to every phase during execution. */
export interface PhaseContext {
	/** Unique run ID across all phases. */
	runId: string;
	/** The fiscal scope (tenant isolation). */
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
	/** Store for persisting evidence artifacts. */
	evidenceStore?: {
		store(artifact: {
			artifactId: string;
			phase: string;
			pipelineRunId: string;
			evidenceKind: "PHASE_INPUT" | "PHASE_OUTPUT" | "GATE_RESULT";
			content: unknown;
			hash: string;
			parentHash: string | null;
			createdAt: string;
		}): Promise<unknown>;
	};
	/** Previous phase results, keyed by phase name. */
	previousPhaseResults: Map<string, unknown>;
	/** Arbitrary metadata. */
	metadata: Record<string, unknown>;
}

/** Result of executing a single phase. */
export interface PhaseResult<R = unknown> {
	/** Execution status. */
	status: "SUCCESS" | "BLOCKED" | "MANUAL_REVIEW" | "FAILED";
	/** The phase output. */
	output: R;
	/** Gate results from the post-execution gate. */
	gatesPassed: GatekeeperVerdict[];
	/** Evidence artifacts produced by this phase. */
	evidenceArtifacts: NewEvidenceArtifact[];
	/** Error messages. */
	errors: string[];
	/** Confidence score 0-1. */
	confidence: number;
}

/** An evidence artifact produced during a pipeline run. */
export interface NewEvidenceArtifact {
	artifactId: string;
	phase: string;
	pipelineRunId: string;
	evidenceKind: "PHASE_INPUT" | "PHASE_OUTPUT" | "GATE_RESULT";
	content: unknown;
	hash: string;
	parentHash: string | null;
	createdAt: string;
}

/** A complete SDD pipeline definition. */
export interface FiscalSDDPipeline {
	/** Unique pipeline ID. */
	id: string;
	/** Human-readable name. */
	name: string;
	/** The phases to execute sequentially. */
	phases: FiscalPhaseDef[];
	/** What to do when a gate blocks execution. */
	onGateBlocked: "STOP" | "WARN_CONTINUE" | "ESCALATE";
	/** Description of what this pipeline does. */
	description?: string;
}

/** Complete result of running an SDD pipeline. */
export interface PipelineResult {
	/** Pipeline ID. */
	pipelineId: string;
	/** Overall status. */
	status: "COMPLETED" | "BLOCKED" | "FAILED";
	/** Results per phase. */
	phaseResults: PhaseResult[];
	/** Total duration in ms. */
	totalDurationMs: number;
	/** The phase where execution stopped (if blocked/failed). */
	blockedAtPhase: string | null;
	/** All evidence artifacts produced. */
	allEvidenceArtifacts: NewEvidenceArtifact[];
}

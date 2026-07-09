/**
 * Types for the Evidence → Artifact Store bridge.
 *
 * Connects the orchestrator phase pipeline with the existing evidence system
 * (EvidenceNode, EvidenceEdge, FiscalTruthEvent in domain; EvidenceRecord in engram).
 *
 * Every phase execution produces a NewEvidenceArtifact that is:
 * 1. Stored as an EvidenceNode in the domain evidence graph
 * 2. Hash-chained to the previous artifact in the same pipeline run
 * 3. Persisted as an EvidenceRecord in the engram sidecar
 */

/** Kinds of evidence artifacts produced during phase execution. */
export type EvidenceArtifactKind =
	| "PHASE_INPUT"
	| "PHASE_OUTPUT"
	| "GATE_RESULT"
	| "REVIEW_FINDING"
	| "PIPELINE_RESULT";

/** A new evidence artifact produced during a pipeline run. */
export interface NewEvidenceArtifact {
	/** Unique identifier for this artifact. */
	artifactId: string;
	/** The phase that produced this artifact. */
	phase: string;
	/** The pipeline run this artifact belongs to. */
	pipelineRunId: string;
	/** What kind of evidence this is. */
	evidenceKind: EvidenceArtifactKind;
	/** The actual content. */
	content: unknown;
	/** SHA-256 hash of this artifact's content + parentHash. */
	hash: string;
	/** SHA-256 hash of the previous artifact in this run's chain (null = genesis). */
	parentHash: string | null;
	/** ISO timestamp when the artifact was created. */
	createdAt: string;
	/** The fiscal scope (tenant isolation). */
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
}

/** A stored, hash-chained evidence artifact. */
export interface EvidenceArtifact extends NewEvidenceArtifact {
	/** When the artifact was stored. */
	storedAt: string;
	/** Whether this artifact's hash chain link was verified at store time. */
	hashChainVerified: boolean;
}

/** Store interface for evidence artifacts. */
export interface EvidenceArtifactStore {
	/** Store a new evidence artifact. */
	store(artifact: NewEvidenceArtifact): Promise<EvidenceArtifact>;
	/** Retrieve the full artifact chain for a pipeline run. */
	getChain(pipelineRunId: string): Promise<EvidenceArtifact[]>;
	/** Verify the integrity of a pipeline run's artifact chain. */
	verifyChain(pipelineRunId: string): Promise<boolean>;
}

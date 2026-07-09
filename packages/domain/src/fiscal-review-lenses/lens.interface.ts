/**
 * Fiscal Review Lens — core interface.
 *
 * A lens reviews fiscal evidence and returns a verdict.
 * Lenses are composable: multiple lenses can run on the same evidence
 * and their results are aggregated into a ReviewReport.
 *
 * @example
 * ```ts
 * class TaxComplianceLens implements FiscalReviewLens {
 *   name = "Tax Compliance";
 *   id = "tax-compliance";
 *   version = "1.0.0";
 *
 *   async review(evidence: EvidenceInput, ctx: LensContext): Promise<LensResult> {
 *     // Check operation against SUNAT regulations
 *     return { passed: true, score: 0.95, findings: [], confidence: 0.9 };
 *   }
 * }
 * ```
 */

/** Input evidence for a lens review. */
export interface EvidenceInput {
	/** The operation ID being reviewed. */
	operationId: string;
	/** The fiscal phase that produced this evidence. */
	phase: string;
	/** The input data to the operation. */
	input: unknown;
	/** The output data from the operation. */
	output: unknown;
	/** Reasoning or justification from the agent. */
	reasoning: string;
	/** Who performed the operation. */
	actor: "ai" | "human" | "system";
	/** Additional metadata. */
	metadata: Record<string, unknown>;
}

/** Context available to a lens during review. */
export interface LensContext {
	/** Fiscal scope (tenant isolation). */
	scope?: {
		organizationId: string;
		companyId: string;
		companyRuc: string;
		period: string;
	};
	/** Current fiscal calendar. */
	fiscalCalendar?: { year: number; period: string };
	/** Applicable regulations at review time. */
	applicableRegulations?: RegulationSnapshot[];
}

/** A single finding from a lens review. */
export interface LensFinding {
	/** Severity of the finding. */
	severity: "CRITICAL" | "WARNING" | "INFO";
	/** Short code identifying the finding type. */
	code: string;
	/** Human-readable message. */
	message: string;
	/** Supporting evidence or reference. */
	evidence: string;
}

/** Result from a single lens review. */
export interface LensResult {
	/** Whether the lens passed (no CRITICAL findings). */
	passed: boolean;
	/** Score 0.0 - 1.0 indicating confidence in passing. */
	score: number;
	/** All findings from this lens. */
	findings: LensFinding[];
	/** Confidence in the lens's own review (0.0 - 1.0). */
	confidence: number;
}

/** A snapshot of applicable regulations at a point in time. */
export interface RegulationSnapshot {
	/** Unique ID for this snapshot. */
	snapshotId: string;
	/** When this snapshot was captured. */
	capturedAt: string;
	/** The applicable rules at capture time. */
	applicableRules: Array<{
		ruleId: string;
		name: string;
		version: string;
		content: string;
	}>;
	/** SHA-256 hash of the snapshot content (for change detection). */
	hash: string;
}

/** A fiscal review lens. */
export interface FiscalReviewLens {
	/** Human-readable name. */
	name: string;
	/** Unique identifier. */
	id: string;
	/** Semver version. */
	version: string;
	/** Review evidence and return a result. */
	review(evidence: EvidenceInput, ctx: LensContext): Promise<LensResult>;
}

import type { DrenyraFiscalScope, FiscalRiskLevel } from "./types";

export const DRENYRA_COMMAND_ID = {
	REVIEW_SUNAT: "review-sunat",
	ANALYZE_INVOICE: "analyze-invoice",
	EXPLAIN_RISK: "explain-risk",
	PREPARE_EVIDENCE: "prepare-evidence",
	PROPOSE_LEDGER_ENTRY: "propose-ledger-entry",
} as const;
export type DrenyraCommandId =
	(typeof DRENYRA_COMMAND_ID)[keyof typeof DRENYRA_COMMAND_ID];

export const DRENYRA_COMMAND_STATUS = {
	READY: "ready",
	NEEDS_APPROVAL: "needs_approval",
	BLOCKED: "blocked",
	FAILED: "failed",
} as const;
export type DrenyraCommandStatus =
	(typeof DRENYRA_COMMAND_STATUS)[keyof typeof DRENYRA_COMMAND_STATUS];

export const DRENYRA_DETERMINISTIC_CHECK_STATUS = {
	PASSED: "passed",
	WARNING: "warning",
	FAILED: "failed",
	NOT_RUN: "not_run",
} as const;
export type DrenyraDeterministicCheckStatus =
	(typeof DRENYRA_DETERMINISTIC_CHECK_STATUS)[keyof typeof DRENYRA_DETERMINISTIC_CHECK_STATUS];

export interface DrenyraCommandEvidenceRef {
	id: string;
	type:
		| "DOCUMENT"
		| "SUNAT_RECORD"
		| "LEDGER_ENTRY"
		| "BANK_STATEMENT"
		| "AGENT_OUTPUT";
	title: string;
	sourceRef?: string;
	contentHash?: string;
}

export interface DrenyraDeterministicCheck {
	id: string;
	label: string;
	status: DrenyraDeterministicCheckStatus;
	summary: string;
	evidenceIds: readonly string[];
}

export interface DrenyraApprovalState {
	required: boolean;
	approvalId?: string;
	status: "not_required" | "pending" | "approved" | "rejected";
	summary: string;
}

export interface DrenyraCommandDiff {
	kind: "none" | "ledger_entry" | "evidence_bundle" | "risk_profile";
	summary: string;
	before?: Record<string, unknown>;
	after?: Record<string, unknown>;
}

export interface DrenyraCommandTrace {
	traceId: string;
	agentRunId?: string;
	caseId?: string;
	createdAt: string;
}

export interface DrenyraCommandEnvelope {
	commandId: DrenyraCommandId;
	status: DrenyraCommandStatus;
	scope: DrenyraFiscalScope;
	title: string;
	summary: string;
	riskLevel: FiscalRiskLevel;
	evidence: readonly DrenyraCommandEvidenceRef[];
	deterministicChecks: readonly DrenyraDeterministicCheck[];
	approval: DrenyraApprovalState;
	diff: DrenyraCommandDiff;
	trace: DrenyraCommandTrace;
}

export interface CreateDrenyraCommandEnvelopeInput {
	commandId: DrenyraCommandId;
	status: DrenyraCommandStatus;
	scope: DrenyraFiscalScope;
	title: string;
	summary: string;
	riskLevel: FiscalRiskLevel;
	evidence?: readonly DrenyraCommandEvidenceRef[];
	deterministicChecks?: readonly DrenyraDeterministicCheck[];
	approval?: DrenyraApprovalState;
	diff?: DrenyraCommandDiff;
	trace: DrenyraCommandTrace;
}

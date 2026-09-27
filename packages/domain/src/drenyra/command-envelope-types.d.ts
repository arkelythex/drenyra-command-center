import type { DrenyraFiscalScope, FiscalRiskLevel } from "./types";
export declare const DRENYRA_COMMAND_ID: {
    readonly REVIEW_SUNAT: "review-sunat";
    readonly ANALYZE_INVOICE: "analyze-invoice";
    readonly EXPLAIN_RISK: "explain-risk";
    readonly PREPARE_EVIDENCE: "prepare-evidence";
    readonly PROPOSE_LEDGER_ENTRY: "propose-ledger-entry";
};
export type DrenyraCommandId = (typeof DRENYRA_COMMAND_ID)[keyof typeof DRENYRA_COMMAND_ID];
export declare const DRENYRA_COMMAND_STATUS: {
    readonly READY: "ready";
    readonly NEEDS_APPROVAL: "needs_approval";
    readonly BLOCKED: "blocked";
    readonly FAILED: "failed";
};
export type DrenyraCommandStatus = (typeof DRENYRA_COMMAND_STATUS)[keyof typeof DRENYRA_COMMAND_STATUS];
export declare const DRENYRA_DETERMINISTIC_CHECK_STATUS: {
    readonly PASSED: "passed";
    readonly WARNING: "warning";
    readonly FAILED: "failed";
    readonly NOT_RUN: "not_run";
};
export type DrenyraDeterministicCheckStatus = (typeof DRENYRA_DETERMINISTIC_CHECK_STATUS)[keyof typeof DRENYRA_DETERMINISTIC_CHECK_STATUS];
export interface DrenyraCommandEvidenceRef {
    id: string;
    type: "DOCUMENT" | "SUNAT_RECORD" | "LEDGER_ENTRY" | "BANK_STATEMENT" | "AGENT_OUTPUT";
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
//# sourceMappingURL=command-envelope-types.d.ts.map
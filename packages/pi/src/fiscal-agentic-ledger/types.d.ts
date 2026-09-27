import type { FiscalObjectIdentity, FiscalOntologyScope } from "../_domain-types/fiscal-ontology";
import type { DeterministicValidatorResultRecord, PolicyDecisionRecord } from "../_domain-types/fiscal-truth";
import type { Money } from "../_domain-types/money";
export declare const FAL_EVENT_KIND: {
    readonly CLASSIFICATION_PROPOSAL: "classification_proposal";
    readonly RECONCILIATION_PROPOSAL: "reconciliation_proposal";
    readonly LEDGER_ENTRY_PROPOSAL: "ledger_entry_proposal";
    readonly SIRE_ACTION_PROPOSAL: "sire_action_proposal";
    readonly CPE_CDR_STATUS_REVIEW: "cpe_cdr_status_review";
    readonly RISK_FINDING: "risk_finding";
};
export type FalEventKind = (typeof FAL_EVENT_KIND)[keyof typeof FAL_EVENT_KIND];
export declare const FAL_EVENT_STATE: {
    readonly DRAFT_BY_AGENT: "draft_by_agent";
    readonly VALIDATED_BY_RULES: "validated_by_rules";
    readonly NEEDS_HUMAN_REVIEW: "needs_human_review";
    readonly APPROVED_BY_HUMAN: "approved_by_human";
    readonly AUTO_ALLOWED_BY_POLICY: "auto_allowed_by_policy";
    readonly POSTED_TO_FISCAL_LEDGER: "posted_to_fiscal_ledger";
    readonly REJECTED: "rejected";
    readonly SUPERSEDED_BY_CORRECTION: "superseded_by_correction";
};
export type FalEventState = (typeof FAL_EVENT_STATE)[keyof typeof FAL_EVENT_STATE];
export declare const FAL_ACTOR_KIND: {
    readonly HUMAN: "human";
    readonly AGENT: "agent";
    readonly SYSTEM: "system";
};
export type FalActorKind = (typeof FAL_ACTOR_KIND)[keyof typeof FAL_ACTOR_KIND];
export declare const FAL_RISK_LEVEL: {
    readonly LOW: "low";
    readonly MEDIUM: "medium";
    readonly HIGH: "high";
    readonly CRITICAL: "critical";
};
export type FalRiskLevel = (typeof FAL_RISK_LEVEL)[keyof typeof FAL_RISK_LEVEL];
export interface FalActorRef {
    kind: FalActorKind;
    id: string;
}
export interface FalApprovalSnapshot {
    approvalId: string;
    approvedBy: string;
    approvedAt: string;
    evidenceSnapshotHash: string;
    decision: "approved";
}
export interface FalReplayMetadata {
    validatorSetVersion: string;
    policyVersion: string;
    modelProvider: string | null;
    modelName: string | null;
    toolCallIds: string[];
}
export interface FalLedgerImpact {
    ledgerEntry: FiscalObjectIdentity;
    amount: Money | null;
    description: string;
}
export interface FiscalAgenticLedgerEvent {
    eventId: string;
    kind: FalEventKind;
    state: FalEventState;
    scope: FiscalOntologyScope;
    proposedBy: FalActorRef;
    riskLevel: FalRiskLevel;
    requiresHumanApproval: boolean;
    sourceEvidenceRefs: FiscalObjectIdentity[];
    deterministicChecks: DeterministicValidatorResultRecord[];
    policyDecision: PolicyDecisionRecord | null;
    approvalSnapshot: FalApprovalSnapshot | null;
    ledgerImpact: FalLedgerImpact | null;
    replayMetadata: FalReplayMetadata | null;
    auditTraceId: string;
    createdAt: string;
    payload: Record<string, unknown>;
}
export type FiscalAgenticLedgerEventInput = FiscalAgenticLedgerEvent;
export declare function canTransitionFalState(from: FalEventState, to: FalEventState): boolean;
export declare function createFiscalAgenticLedgerEvent(input: FiscalAgenticLedgerEventInput): FiscalAgenticLedgerEvent;
//# sourceMappingURL=types.d.ts.map
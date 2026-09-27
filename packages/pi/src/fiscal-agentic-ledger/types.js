export const FAL_EVENT_KIND = {
    CLASSIFICATION_PROPOSAL: "classification_proposal",
    RECONCILIATION_PROPOSAL: "reconciliation_proposal",
    LEDGER_ENTRY_PROPOSAL: "ledger_entry_proposal",
    SIRE_ACTION_PROPOSAL: "sire_action_proposal",
    CPE_CDR_STATUS_REVIEW: "cpe_cdr_status_review",
    RISK_FINDING: "risk_finding",
};
export const FAL_EVENT_STATE = {
    DRAFT_BY_AGENT: "draft_by_agent",
    VALIDATED_BY_RULES: "validated_by_rules",
    NEEDS_HUMAN_REVIEW: "needs_human_review",
    APPROVED_BY_HUMAN: "approved_by_human",
    AUTO_ALLOWED_BY_POLICY: "auto_allowed_by_policy",
    POSTED_TO_FISCAL_LEDGER: "posted_to_fiscal_ledger",
    REJECTED: "rejected",
    SUPERSEDED_BY_CORRECTION: "superseded_by_correction",
};
export const FAL_ACTOR_KIND = {
    HUMAN: "human",
    AGENT: "agent",
    SYSTEM: "system",
};
export const FAL_RISK_LEVEL = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
};
const FAL_STATE_TRANSITIONS = {
    [FAL_EVENT_STATE.DRAFT_BY_AGENT]: [FAL_EVENT_STATE.VALIDATED_BY_RULES],
    [FAL_EVENT_STATE.VALIDATED_BY_RULES]: [
        FAL_EVENT_STATE.NEEDS_HUMAN_REVIEW,
        FAL_EVENT_STATE.AUTO_ALLOWED_BY_POLICY,
        FAL_EVENT_STATE.REJECTED,
    ],
    [FAL_EVENT_STATE.NEEDS_HUMAN_REVIEW]: [
        FAL_EVENT_STATE.APPROVED_BY_HUMAN,
        FAL_EVENT_STATE.REJECTED,
    ],
    [FAL_EVENT_STATE.APPROVED_BY_HUMAN]: [
        FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
    ],
    [FAL_EVENT_STATE.AUTO_ALLOWED_BY_POLICY]: [
        FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER,
    ],
    [FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER]: [
        FAL_EVENT_STATE.SUPERSEDED_BY_CORRECTION,
    ],
    [FAL_EVENT_STATE.REJECTED]: [],
    [FAL_EVENT_STATE.SUPERSEDED_BY_CORRECTION]: [],
};
export function canTransitionFalState(from, to) {
    return FAL_STATE_TRANSITIONS[from].includes(to);
}
export function createFiscalAgenticLedgerEvent(input) {
    assertNonEmpty(input.eventId, "eventId");
    assertNonEmpty(input.proposedBy.id, "proposedBy.id");
    assertNonEmpty(input.auditTraceId, "auditTraceId");
    if (input.sourceEvidenceRefs.length === 0) {
        throw new Error("FAL event requires source evidence");
    }
    if (input.state === FAL_EVENT_STATE.POSTED_TO_FISCAL_LEDGER) {
        assertPostedEvent(input);
    }
    return input;
}
function assertPostedEvent(event) {
    if (event.deterministicChecks.length === 0) {
        throw new Error("Posted FAL event requires deterministic checks");
    }
    if (!event.policyDecision) {
        throw new Error("Posted FAL event requires policy decision");
    }
    if (!event.replayMetadata) {
        throw new Error("Posted FAL event requires replay metadata");
    }
    if (!event.ledgerImpact) {
        throw new Error("Posted FAL event requires ledger impact");
    }
    if (event.requiresHumanApproval && !event.approvalSnapshot) {
        throw new Error("Posted FAL event requires human approval snapshot");
    }
}
function assertNonEmpty(value, field) {
    if (value.trim().length === 0) {
        throw new Error(`FAL event requires ${field}`);
    }
}
//# sourceMappingURL=types.js.map
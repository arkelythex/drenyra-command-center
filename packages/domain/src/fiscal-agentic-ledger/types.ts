import type {
	FiscalObjectIdentity,
	FiscalOntologyScope,
} from "../fiscal-ontology/types";
import type {
	DeterministicValidatorResultRecord,
	PolicyDecisionRecord,
} from "../fiscal-truth/types";
import type { Money } from "../value-objects/Money";

export const FAL_EVENT_KIND = {
	CLASSIFICATION_PROPOSAL: "classification_proposal",
	RECONCILIATION_PROPOSAL: "reconciliation_proposal",
	LEDGER_ENTRY_PROPOSAL: "ledger_entry_proposal",
	SIRE_ACTION_PROPOSAL: "sire_action_proposal",
	CPE_CDR_STATUS_REVIEW: "cpe_cdr_status_review",
	RISK_FINDING: "risk_finding",
} as const;

export type FalEventKind = (typeof FAL_EVENT_KIND)[keyof typeof FAL_EVENT_KIND];

export const FAL_EVENT_STATE = {
	DRAFT_BY_AGENT: "draft_by_agent",
	VALIDATED_BY_RULES: "validated_by_rules",
	NEEDS_HUMAN_REVIEW: "needs_human_review",
	APPROVED_BY_HUMAN: "approved_by_human",
	AUTO_ALLOWED_BY_POLICY: "auto_allowed_by_policy",
	POSTED_TO_FISCAL_LEDGER: "posted_to_fiscal_ledger",
	REJECTED: "rejected",
	SUPERSEDED_BY_CORRECTION: "superseded_by_correction",
} as const;

export type FalEventState =
	(typeof FAL_EVENT_STATE)[keyof typeof FAL_EVENT_STATE];

export const FAL_ACTOR_KIND = {
	HUMAN: "human",
	AGENT: "agent",
	SYSTEM: "system",
} as const;

export type FalActorKind = (typeof FAL_ACTOR_KIND)[keyof typeof FAL_ACTOR_KIND];

export const FAL_RISK_LEVEL = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high",
	CRITICAL: "critical",
} as const;

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

const FAL_STATE_TRANSITIONS: Record<FalEventState, readonly FalEventState[]> = {
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

export function canTransitionFalState(
	from: FalEventState,
	to: FalEventState,
): boolean {
	return FAL_STATE_TRANSITIONS[from].includes(to);
}

export function createFiscalAgenticLedgerEvent(
	input: FiscalAgenticLedgerEventInput,
): FiscalAgenticLedgerEvent {
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

function assertPostedEvent(event: FiscalAgenticLedgerEvent): void {
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

function assertNonEmpty(value: string, field: string): void {
	if (value.trim().length === 0) {
		throw new Error(`FAL event requires ${field}`);
	}
}

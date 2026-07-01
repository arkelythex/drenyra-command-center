import {
	AGENT_RUN_STATUSES,
	AGENT_TYPES,
	APPROVAL_STATUSES,
	AUDIT_EVENT_TYPES,
	AUTONOMY_LEVELS,
	EVIDENCE_TYPES,
	FISCAL_CASE_STATUSES,
	FISCAL_CASE_TYPES,
	FISCAL_RISK_LEVELS,
} from "../../drenyra/types";
import type {
	AgentRunProps,
	ApprovalRequestProps,
	AuditEventProps,
	EvidenceItemProps,
	FiscalCaseProps,
} from "./types";

export function validateFiscalCaseProps(props: FiscalCaseProps): void {
	if (!props.id) throw new Error("Fiscal case ID is required");
	if (!FISCAL_CASE_TYPES.includes(props.type as never)) {
		throw new Error(`Invalid fiscal case type: ${props.type}`);
	}
	if (!FISCAL_CASE_STATUSES.includes(props.status as never)) {
		throw new Error(`Invalid fiscal case status: ${props.status}`);
	}
	if (!FISCAL_RISK_LEVELS.includes(props.riskLevel as never)) {
		throw new Error(`Invalid fiscal risk level: ${props.riskLevel}`);
	}
	if (!AUTONOMY_LEVELS.includes(props.autonomyLevel as never)) {
		throw new Error(`Invalid autonomy level: ${props.autonomyLevel}`);
	}
	if (!props.title) throw new Error("Fiscal case title is required");
	if (!props.description)
		throw new Error("Fiscal case description is required");
	if (props.riskScore < 0 || props.riskScore > 100) {
		throw new Error("Risk score must be between 0 and 100");
	}
}

export function validateEvidenceItemProps(props: EvidenceItemProps): void {
	if (!props.id) throw new Error("Evidence item ID is required");
	if (!props.caseId) throw new Error("Evidence item must belong to a case");
	if (!EVIDENCE_TYPES.includes(props.type as never)) {
		throw new Error(`Invalid evidence type: ${props.type}`);
	}
	if (!props.title) throw new Error("Evidence title is required");
	if (!props.summary) throw new Error("Evidence summary is required");
	if (!props.source) throw new Error("Evidence source is required");
	if (!props.contentHash) throw new Error("Evidence content hash is required");
}

export function validateAgentRunProps(props: AgentRunProps): void {
	if (!props.id) throw new Error("Agent run ID is required");
	if (!props.caseId) throw new Error("Agent run must belong to a case");
	if (!AGENT_TYPES.includes(props.agentType as never)) {
		throw new Error(`Invalid agent type: ${props.agentType}`);
	}
	if (!AGENT_RUN_STATUSES.includes(props.status as never)) {
		throw new Error(`Invalid agent run status: ${props.status}`);
	}
}

export function validateApprovalRequestProps(
	props: ApprovalRequestProps,
): void {
	if (!props.id) throw new Error("Approval request ID is required");
	if (!props.caseId) throw new Error("Approval request must belong to a case");
	if (!APPROVAL_STATUSES.includes(props.status as never)) {
		throw new Error(`Invalid approval status: ${props.status}`);
	}
	if (!AUTONOMY_LEVELS.includes(props.autonomyLevel as never)) {
		throw new Error(`Invalid autonomy level: ${props.autonomyLevel}`);
	}
	if (!props.title) throw new Error("Approval title is required");
	if (!props.description) throw new Error("Approval description is required");
}

export function validateAuditEventProps(props: AuditEventProps): void {
	if (!props.id) throw new Error("Audit event ID is required");
	if (!AUDIT_EVENT_TYPES.includes(props.eventType as never)) {
		throw new Error(`Invalid audit event type: ${props.eventType}`);
	}
	if (!props.actorId) throw new Error("Audit event actor is required");
	if (!props.message) throw new Error("Audit event message is required");
}

export function validateFiscalCaseTransition(
	currentStatus: string,
	newStatus: string,
): void {
	const transitions: Record<string, string[]> = {
		OPEN: ["IN_REVIEW"],
		IN_REVIEW: ["APPROVAL_PENDING", "RESOLVED", "ARCHIVED"],
		APPROVAL_PENDING: ["IN_REVIEW", "RESOLVED", "ARCHIVED"],
		RESOLVED: ["ARCHIVED"],
		ARCHIVED: [],
	};
	const allowed = transitions[currentStatus];
	if (!allowed) {
		throw new Error(`Invalid current status: ${currentStatus}`);
	}
	if (!allowed.includes(newStatus)) {
		throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
	}
}

export function validateApprovalDecision(
	currentStatus: string,
	newStatus: string,
): void {
	if (currentStatus !== "PENDING") {
		throw new Error("Can only decide on PENDING approval requests");
	}
	if (newStatus !== "APPROVED" && newStatus !== "REJECTED") {
		throw new Error("Decision must be APPROVED or REJECTED");
	}
}

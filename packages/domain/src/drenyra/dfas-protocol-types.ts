/**
 * Drenyra Fiscal App Server (DFAS) — protocol types.
 * Framework-free contracts for JSON-RPC messages across Web, CLI and API.
 */

import type { DrenyraCapabilityEvaluation } from "./capability-types";
import type { DrenyraCommandEnvelope } from "./command-envelope-types";
import type { DrenyraBrainSourceSurface, DrenyraFiscalScope } from "./types";

/** Current DFAS wire protocol version. Bump on breaking changes. */
export const DFAS_PROTOCOL_VERSION = "1.0.0" as const;
export type DfasProtocolVersion = typeof DFAS_PROTOCOL_VERSION;

export const DFAS_ORCHESTRATION_MODE = {
	TRANSACTION: "transaction",
	PERIOD: "period",
	AUTO: "auto",
} as const;
export type DfasOrchestrationMode =
	(typeof DFAS_ORCHESTRATION_MODE)[keyof typeof DFAS_ORCHESTRATION_MODE];

export const DFAS_APPROVAL_DECISION = {
	ALLOW: "allow",
	DENY: "deny",
	CANCEL: "cancel",
} as const;
export type DfasApprovalDecision =
	(typeof DFAS_APPROVAL_DECISION)[keyof typeof DFAS_APPROVAL_DECISION];

export const DFAS_TURN_STATUS = {
	QUEUED: "queued",
	RUNNING: "running",
	WAITING_FOR_APPROVAL: "waiting_for_approval",
	COMPLETED: "completed",
	FAILED: "failed",
	CANCELLED: "cancelled",
} as const;
export type DfasTurnStatus =
	(typeof DFAS_TURN_STATUS)[keyof typeof DFAS_TURN_STATUS];

export const DFAS_THREAD_STATUS = {
	ACTIVE: "active",
	WAITING_FOR_APPROVAL: "waiting_for_approval",
	COMPLETED: "completed",
	FAILED: "failed",
	CANCELLED: "cancelled",
	ARCHIVED: "archived",
} as const;
export type DfasThreadStatus =
	(typeof DFAS_THREAD_STATUS)[keyof typeof DFAS_THREAD_STATUS];

export const DFAS_ITEM_TYPE = {
	USER_MESSAGE: "user_message",
	ASSISTANT_MESSAGE: "assistant_message",
	EVIDENCE: "evidence",
	GATE: "gate",
	ENVELOPE: "envelope",
	CAPABILITY_DECISION: "capability_decision",
	APPROVAL_REQUIRED: "approval_required",
	APPROVAL_RESOLVED: "approval_resolved",
	TRUTH_PROMOTED: "truth_promoted",
	AGENT_DELEGATION: "agent_delegation",
	ERROR: "error",
} as const;
export type DfasItemType = (typeof DFAS_ITEM_TYPE)[keyof typeof DFAS_ITEM_TYPE];

export const DFAS_ERROR_CODE = {
	SCOPE_INVALID: "DRENYRA_SCOPE_INVALID",
	SCOPE_MISMATCH: "DRENYRA_SCOPE_MISMATCH",
	THREAD_NOT_FOUND: "DRENYRA_THREAD_NOT_FOUND",
	TURN_IN_PROGRESS: "DRENYRA_TURN_IN_PROGRESS",
	CAPABILITY_DENIED: "DRENYRA_CAPABILITY_DENIED",
	APPROVAL_EXPIRED: "DRENYRA_APPROVAL_EXPIRED",
	PROTOCOL_VERSION: "DRENYRA_PROTOCOL_VERSION",
} as const;
export type DfasErrorCode =
	(typeof DFAS_ERROR_CODE)[keyof typeof DFAS_ERROR_CODE];

/** JSON-RPC 2.0 request envelope for DFAS client → server messages. */
export interface DfasClientRequest<TParams = unknown> {
	jsonrpc: "2.0";
	id: string | number;
	method: DfasClientMethod;
	params: TParams;
}

/** JSON-RPC 2.0 notification for DFAS server → client (no id). */
export interface DfasServerNotification<TParams = unknown> {
	jsonrpc: "2.0";
	method: DfasServerNotificationMethod;
	params: TParams;
}

/** Server-initiated request requiring client response (approval flow). */
export interface DfasServerRequest<TParams = unknown> {
	jsonrpc: "2.0";
	id: string | number;
	method: DfasServerRequestMethod;
	params: TParams;
}

export type DfasClientMethod =
	| "thread/create"
	| "thread/resume"
	| "thread/subscribe"
	| "thread/unsubscribe"
	| "turn/start"
	| "turn/cancel"
	| "approval/respond";

export type DfasServerNotificationMethod =
	| "item/appended"
	| "turn/status"
	| "thread/status";

export type DfasServerRequestMethod = "approval/required";

export interface DfasThreadCreateParams {
	title: string;
	fiscalScope: DrenyraFiscalScope;
	sourceSurface: DrenyraBrainSourceSurface;
	linkedCaseId?: string;
	linkedMissionId?: string;
}

export interface DfasThreadResumeParams {
	threadId: string;
	fiscalScope: DrenyraFiscalScope;
}

export interface DfasThreadSubscribeParams {
	threadId: string;
	fiscalScope: DrenyraFiscalScope;
}

export interface DfasThreadUnsubscribeParams {
	threadId: string;
	subscriptionId: string;
}

export interface DfasTurnStartParams {
	threadId: string;
	prompt: string;
	fiscalScope: DrenyraFiscalScope;
	skillId?: string;
	orchestrationMode?: DfasOrchestrationMode;
	traceId?: string;
}

export interface DfasTurnCancelParams {
	threadId: string;
	turnId: string;
	fiscalScope: DrenyraFiscalScope;
	reason?: string;
}

export interface DfasApprovalRespondParams {
	approvalId: string;
	decision: DfasApprovalDecision;
	fiscalScope: DrenyraFiscalScope;
	reason?: string;
}

export interface DfasApprovalRequiredParams {
	approvalId: string;
	turnId: string;
	threadId: string;
	fiscalScope: DrenyraFiscalScope;
	riskLevel: string;
	summary: string;
	evidenceRefs: readonly string[];
}

export interface DfasGateItemPayload {
	phaseId: string;
	passed: boolean;
	reason: string;
	evidence?: unknown;
}

export interface DfasTruthPromotedPayload {
	eventId: string;
	evidenceRootHash: string;
	validatorVersion: string;
	policyVersion: string;
}

export interface DfasAgentDelegationPayload {
	agentId: string;
	tier: string;
	status: string;
	summary: string;
}

export interface DfasErrorItemPayload {
	code: DfasErrorCode | string;
	message: string;
	recoverable: boolean;
}

export type DfasItemPayload =
	| { text: string }
	| {
			evidence: readonly import("./command-envelope-types").DrenyraCommandEvidenceRef[];
	  }
	| DfasGateItemPayload
	| { envelope: DrenyraCommandEnvelope }
	| { evaluation: DrenyraCapabilityEvaluation }
	| { approvalId: string; riskLevel: string; summary: string }
	| { approvalId: string; status: string; decidedBy?: string }
	| DfasTruthPromotedPayload
	| DfasAgentDelegationPayload
	| DfasErrorItemPayload;

export interface DfasItemStreamEntry {
	id: string;
	threadId: string;
	turnId?: string;
	sequence: number;
	itemType: DfasItemType;
	fiscalScope: DrenyraFiscalScope;
	payload: DfasItemPayload;
	traceId?: string;
	protocolVersion: DfasProtocolVersion;
	createdAt: string;
}

export interface DfasItemAppendedNotification {
	entry: DfasItemStreamEntry;
}

export interface DfasTurnStatusNotification {
	turnId: string;
	threadId: string;
	status: DfasTurnStatus;
	fiscalScope: DrenyraFiscalScope;
}

export interface DfasThreadStatusNotification {
	threadId: string;
	status: DfasThreadStatus;
	fiscalScope: DrenyraFiscalScope;
}

export interface DfasThreadCreateResult {
	threadId: string;
	status: DfasThreadStatus;
	createdAt: string;
}

export interface DfasTurnStartResult {
	turnId: string;
	threadId: string;
	status: DfasTurnStatus;
	traceId: string;
}

/** Validates RUC mod-11 pattern and period format. Fail-closed. */
export function isValidDfasFiscalScope(
	scope: Partial<DrenyraFiscalScope>,
): scope is DrenyraFiscalScope {
	if (!scope.companyId?.trim()) return false;
	if (!scope.companyRuc?.match(/^\d{11}$/)) return false;
	if (!scope.period?.match(/^\d{4}-(0[1-9]|1[0-2])$/)) return false;
	if (scope.countryCode !== "PE") return false;
	return true;
}

/** Returns true when two scopes refer to the same fiscal workspace. */
export function dfasScopesMatch(
	a: DrenyraFiscalScope,
	b: DrenyraFiscalScope,
): boolean {
	return (
		a.companyId === b.companyId &&
		a.companyRuc === b.companyRuc &&
		a.period === b.period &&
		a.countryCode === b.countryCode &&
		(a.organizationId ?? "") === (b.organizationId ?? "")
	);
}

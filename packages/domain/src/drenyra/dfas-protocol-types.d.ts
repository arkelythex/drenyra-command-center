import type { DrenyraCapabilityEvaluation } from "./capability-types";
import type { DrenyraCommandEnvelope } from "./command-envelope-types";
import type { DrenyraBrainSourceSurface, DrenyraFiscalScope } from "./types";
export declare const DFAS_PROTOCOL_VERSION: "1.0.0";
export type DfasProtocolVersion = typeof DFAS_PROTOCOL_VERSION;
export declare const DFAS_ORCHESTRATION_MODE: {
    readonly TRANSACTION: "transaction";
    readonly PERIOD: "period";
    readonly AUTO: "auto";
};
export type DfasOrchestrationMode = (typeof DFAS_ORCHESTRATION_MODE)[keyof typeof DFAS_ORCHESTRATION_MODE];
export declare const DFAS_APPROVAL_DECISION: {
    readonly ALLOW: "allow";
    readonly DENY: "deny";
    readonly CANCEL: "cancel";
};
export type DfasApprovalDecision = (typeof DFAS_APPROVAL_DECISION)[keyof typeof DFAS_APPROVAL_DECISION];
export declare const DFAS_TURN_STATUS: {
    readonly QUEUED: "queued";
    readonly RUNNING: "running";
    readonly WAITING_FOR_APPROVAL: "waiting_for_approval";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
};
export type DfasTurnStatus = (typeof DFAS_TURN_STATUS)[keyof typeof DFAS_TURN_STATUS];
export declare const DFAS_THREAD_STATUS: {
    readonly ACTIVE: "active";
    readonly WAITING_FOR_APPROVAL: "waiting_for_approval";
    readonly COMPLETED: "completed";
    readonly FAILED: "failed";
    readonly CANCELLED: "cancelled";
    readonly ARCHIVED: "archived";
};
export type DfasThreadStatus = (typeof DFAS_THREAD_STATUS)[keyof typeof DFAS_THREAD_STATUS];
export declare const DFAS_ITEM_TYPE: {
    readonly USER_MESSAGE: "user_message";
    readonly ASSISTANT_MESSAGE: "assistant_message";
    readonly EVIDENCE: "evidence";
    readonly GATE: "gate";
    readonly ENVELOPE: "envelope";
    readonly CAPABILITY_DECISION: "capability_decision";
    readonly APPROVAL_REQUIRED: "approval_required";
    readonly APPROVAL_RESOLVED: "approval_resolved";
    readonly TRUTH_PROMOTED: "truth_promoted";
    readonly AGENT_DELEGATION: "agent_delegation";
    readonly ERROR: "error";
};
export type DfasItemType = (typeof DFAS_ITEM_TYPE)[keyof typeof DFAS_ITEM_TYPE];
export declare const DFAS_ERROR_CODE: {
    readonly SCOPE_INVALID: "DRENYRA_SCOPE_INVALID";
    readonly SCOPE_MISMATCH: "DRENYRA_SCOPE_MISMATCH";
    readonly THREAD_NOT_FOUND: "DRENYRA_THREAD_NOT_FOUND";
    readonly TURN_IN_PROGRESS: "DRENYRA_TURN_IN_PROGRESS";
    readonly CAPABILITY_DENIED: "DRENYRA_CAPABILITY_DENIED";
    readonly APPROVAL_EXPIRED: "DRENYRA_APPROVAL_EXPIRED";
    readonly PROTOCOL_VERSION: "DRENYRA_PROTOCOL_VERSION";
};
export type DfasErrorCode = (typeof DFAS_ERROR_CODE)[keyof typeof DFAS_ERROR_CODE];
export interface DfasClientRequest<TParams = unknown> {
    jsonrpc: "2.0";
    id: string | number;
    method: DfasClientMethod;
    params: TParams;
}
export interface DfasServerNotification<TParams = unknown> {
    jsonrpc: "2.0";
    method: DfasServerNotificationMethod;
    params: TParams;
}
export interface DfasServerRequest<TParams = unknown> {
    jsonrpc: "2.0";
    id: string | number;
    method: DfasServerRequestMethod;
    params: TParams;
}
export type DfasClientMethod = "thread/create" | "thread/resume" | "thread/subscribe" | "thread/unsubscribe" | "turn/start" | "turn/cancel" | "approval/respond";
export type DfasServerNotificationMethod = "item/appended" | "turn/status" | "thread/status";
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
export type DfasItemPayload = {
    text: string;
} | {
    evidence: readonly import("./command-envelope-types").DrenyraCommandEvidenceRef[];
} | DfasGateItemPayload | {
    envelope: DrenyraCommandEnvelope;
} | {
    evaluation: DrenyraCapabilityEvaluation;
} | {
    approvalId: string;
    riskLevel: string;
    summary: string;
} | {
    approvalId: string;
    status: string;
    decidedBy?: string;
} | DfasTruthPromotedPayload | DfasAgentDelegationPayload | DfasErrorItemPayload;
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
export declare function isValidDfasFiscalScope(scope: Partial<DrenyraFiscalScope>): scope is DrenyraFiscalScope;
export declare function dfasScopesMatch(a: DrenyraFiscalScope, b: DrenyraFiscalScope): boolean;
//# sourceMappingURL=dfas-protocol-types.d.ts.map
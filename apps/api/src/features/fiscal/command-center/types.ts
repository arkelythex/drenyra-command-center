/**
 * FiscalCommandCenterContext interface.
 *
 * @example
 * ```ts
 * const value: FiscalCommandCenterContext = {} as FiscalCommandCenterContext;
 * console.log(value);
 * ```
 */
export interface FiscalCommandCenterContext {
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	userId: string;
}

/**
 * FiscalCaseType type.
 *
 * @example
 * ```ts
 * const value: FiscalCaseType = {} as FiscalCaseType;
 * console.log(value);
 * ```
 */
export type FiscalCaseType =
	| "sire"
	| "cpe"
	| "sunat"
	| "audit"
	| "reconciliation";
/**
 * FiscalCaseStatus type.
 *
 * @example
 * ```ts
 * const value: FiscalCaseStatus = {} as FiscalCaseStatus;
 * console.log(value);
 * ```
 */
export type FiscalCaseStatus =
	| "open"
	| "in_review"
	| "blocked"
	| "resolved"
	| "closed";
/**
 * FiscalPriority type.
 *
 * @example
 * ```ts
 * const value: FiscalPriority = {} as FiscalPriority;
 * console.log(value);
 * ```
 */
export type FiscalPriority = "low" | "medium" | "high" | "critical";
/**
 * AgentRunStatus type.
 *
 * @example
 * ```ts
 * const value: AgentRunStatus = {} as AgentRunStatus;
 * console.log(value);
 * ```
 */
export type AgentRunStatus = "pending" | "running" | "completed" | "failed";
/**
 * ApprovalRequestType type.
 *
 * @example
 * ```ts
 * const value: ApprovalRequestType = {} as ApprovalRequestType;
 * console.log(value);
 * ```
 */
export type ApprovalRequestType =
	| "fiscal_change"
	| "credential_change"
	| "rollback"
	| "release";
/**
 * AuditChainStatus type.
 *
 * @example
 * ```ts
 * const value: AuditChainStatus = {} as AuditChainStatus;
 * console.log(value);
 * ```
 */
export type AuditChainStatus = "valid" | "broken";

/**
 * FiscalCaseRecord interface.
 *
 * @example
 * ```ts
 * const value: FiscalCaseRecord = {} as FiscalCaseRecord;
 * console.log(value);
 * ```
 */
export interface FiscalCaseRecord {
	id: string;
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	countryCode: "PE";
	type: FiscalCaseType;
	status: FiscalCaseStatus;
	priority: FiscalPriority;
	title: string;
	description: string | null;
	assignedAgentId: string | null;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * FiscalCaseSummary interface.
 *
 * @example
 * ```ts
 * const value: FiscalCaseSummary = {} as FiscalCaseSummary;
 * console.log(value);
 * ```
 */
export interface FiscalCaseSummary {
	id: string;
	type: FiscalCaseType;
	title: string;
	status: FiscalCaseStatus;
	priority: FiscalPriority;
	createdAt: Date;
	updatedAt: Date;
	documentCount: number;
	agentRunCount: number;
}

/**
 * CaseDocumentRecord interface.
 *
 * @example
 * ```ts
 * const value: CaseDocumentRecord = {} as CaseDocumentRecord;
 * console.log(value);
 * ```
 */
export interface CaseDocumentRecord {
	id: string;
	caseId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	title: string;
	createdAt: Date;
}

/**
 * CaseEvidenceRecord interface.
 *
 * @example
 * ```ts
 * const value: CaseEvidenceRecord = {} as CaseEvidenceRecord;
 * console.log(value);
 * ```
 */
export interface CaseEvidenceRecord {
	id: string;
	caseId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	evidenceType: string;
	createdAt: Date;
}

/**
 * AgentRunRecord interface.
 *
 * @example
 * ```ts
 * const value: AgentRunRecord = {} as AgentRunRecord;
 * console.log(value);
 * ```
 */
export interface AgentRunRecord {
	id: string;
	caseId: string | null;
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	agentType: string;
	status: AgentRunStatus;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * AgentLogRecord interface.
 *
 * @example
 * ```ts
 * const value: AgentLogRecord = {} as AgentLogRecord;
 * console.log(value);
 * ```
 */
export interface AgentLogRecord {
	id: string;
	runId: string;
	companyId: string;
	level: "debug" | "info" | "warn" | "error";
	message: string;
	timestamp: Date;
}

/**
 * AgentOutputRecord interface.
 *
 * @example
 * ```ts
 * const value: AgentOutputRecord = {} as AgentOutputRecord;
 * console.log(value);
 * ```
 */
export interface AgentOutputRecord {
	id: string;
	runId: string;
	companyId: string;
	outputType: string;
	payload: Record<string, unknown>;
	createdAt: Date;
}

/**
 * ApprovalRequestRecord interface.
 *
 * @example
 * ```ts
 * const value: ApprovalRequestRecord = {} as ApprovalRequestRecord;
 * console.log(value);
 * ```
 */
export interface ApprovalRequestRecord {
	id: string;
	caseId: string | null;
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	requestType: ApprovalRequestType;
	status: "pending" | "approved" | "rejected";
	priority: FiscalPriority;
	title: string;
	description: string | null;
	requestedBy: string;
	metadata: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
}

/**
 * ApprovalDiffRecord interface.
 *
 * @example
 * ```ts
 * const value: ApprovalDiffRecord = {} as ApprovalDiffRecord;
 * console.log(value);
 * ```
 */
export interface ApprovalDiffRecord {
	id: string;
	requestId: string;
	companyId: string;
	diffType: string;
	before: Record<string, unknown> | null;
	after: Record<string, unknown> | null;
	createdAt: Date;
}

/**
 * ApprovalVoteRecord interface.
 *
 * @example
 * ```ts
 * const value: ApprovalVoteRecord = {} as ApprovalVoteRecord;
 * console.log(value);
 * ```
 */
export interface ApprovalVoteRecord {
	id: string;
	requestId: string;
	companyId: string;
	userId: string;
	vote: boolean;
	comment: string | null;
	createdAt: Date;
}

/**
 * AuditEventRecord interface.
 *
 * @example
 * ```ts
 * const value: AuditEventRecord = {} as AuditEventRecord;
 * console.log(value);
 * ```
 */
export interface AuditEventRecord {
	id: string;
	organizationId: string;
	companyId: string;
	companyRuc: string;
	period: string;
	eventType: string;
	entityType: string;
	entityId: string;
	action: string;
	changes: Record<string, unknown>;
	previousHash: string | null;
	hash: string;
	actorId: string;
	occurredAt: Date;
	createdAt: Date;
}

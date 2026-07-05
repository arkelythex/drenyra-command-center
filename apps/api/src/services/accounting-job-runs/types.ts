import {
	CONTEXT_APPROVAL_STATES,
	type ContextApprovalState,
	type ContextEvaluationSummaryDTO,
	type ContextPolicySelectionResponseDTO,
	type ContextRunStateDTO,
	type ContextTraceRecordDTO,
} from "@drenyra/application";
import type { KnowledgeSourceReference } from "@drenyra/infrastructure/services/sunat-knowledge";

export type AccountingJobRunStatus =
	| "QUEUED"
	| "RUNNING"
	| "AWAITING_APPROVAL"
	| "COMPLETED"
	| "FAILED"
	| "CANCELLED";

export interface AccountingJobRunRecord {
	id: string;
	companyId: string;
	countryCode: string;
	jobId: string;
	jobTitle: string;
	jobCategory: string;
	status: AccountingJobRunStatus;
	approvalRequired: boolean;
	requestedBy: string | null;
	approvedBy: string | null;
	prompt: string;
	summary: string | null;
	inputPayload: Record<string, unknown>;
	resultPayload: Record<string, unknown> | null;
	evidencePayload: Record<string, unknown> | null;
	startedAt: Date;
	completedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface AccountingJobRunControlPlaneSnapshot {
	traceId: string;
	surfaceId: string;
	contextPolicyId: string;
	requestedTools: string[];
	requestedCorpora: string[];
	policy: ContextPolicySelectionResponseDTO;
	traceRecords: ContextTraceRecordDTO[];
	evaluationSummary: ContextEvaluationSummaryDTO | null;
	documentarySources: KnowledgeSourceReference[];
	representativePath: boolean;
	auditLinked: boolean;
	executionMode: "queued" | "deterministic-fallback";
}

export const CONTROL_PLANE_PAYLOAD_KEY = "contextControlPlane";
export const TOP_LEVEL_TRACE_ID_KEY = "traceId";

export const SUPPORTED_EXECUTABLE_JOBS = ["prepare-sire"] as const;
export type SupportedExecutableJob =
	(typeof SUPPORTED_EXECUTABLE_JOBS)[number];

export const ACCOUNTING_JOB_ERRORS = {
	NOT_SUPPORTED: "ACCOUNTING_JOB_NOT_SUPPORTED",
	RUN_NOT_FOUND: "ACCOUNTING_JOB_RUN_NOT_FOUND",
	INVALID_TRANSITION: "ACCOUNTING_JOB_RUN_INVALID_TRANSITION",
	EXECUTION_NOT_SUPPORTED: "ACCOUNTING_JOB_RUN_EXECUTION_NOT_SUPPORTED",
	REQUIRES_APPROVAL: "ACCOUNTING_JOB_RUN_REQUIRES_APPROVAL",
	TRACE_ID_REQUIRED: "CONTEXT_TRACE_ID_REQUIRED",
	POLICY_VIOLATION: "CONTEXT_POLICY_VIOLATION",
	PERIOD_REQUIRED: "SIRE_PERIOD_REQUIRED",
} as const;

export const TERMINAL_ACCOUNTING_JOB_RUN_STATUSES: AccountingJobRunStatus[] = [
	"COMPLETED",
	"FAILED",
	"CANCELLED",
];

export const ACCOUNTING_JOB_RUN_TRANSITIONS: Record<
	AccountingJobRunStatus,
	AccountingJobRunStatus[]
> = {
	QUEUED: ["RUNNING", "AWAITING_APPROVAL", "FAILED", "CANCELLED"],
	RUNNING: ["AWAITING_APPROVAL", "COMPLETED", "FAILED", "CANCELLED"],
	AWAITING_APPROVAL: ["RUNNING", "COMPLETED", "FAILED", "CANCELLED"],
	COMPLETED: [],
	FAILED: [],
	CANCELLED: [],
};

export function isObjectRecord(
	value: unknown,
): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readObjectRecord(value: unknown): Record<string, unknown> {
	return isObjectRecord(value) ? value : {};
}

export function readStringArray(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(
		(entry): entry is string =>
			typeof entry === "string" && entry.trim().length > 0,
	);
}

export function isKnowledgeSourceReference(
	value: unknown,
): value is KnowledgeSourceReference {
	if (!isObjectRecord(value)) {
		return false;
	}

	return (
		typeof value.chunkId === "string" &&
		typeof value.corpusId === "string" &&
		value.corpusKind === "documentary" &&
		typeof value.source === "string" &&
		typeof value.title === "string" &&
		(typeof value.section === "string" || value.section === null) &&
		(typeof value.effectiveDate === "string" || value.effectiveDate === null)
	);
}

export function readControlPlaneSnapshot(
	payload: Record<string, unknown>,
): AccountingJobRunControlPlaneSnapshot | null {
	const candidate = readObjectRecord(payload[CONTROL_PLANE_PAYLOAD_KEY]);
	const traceId =
		typeof candidate.traceId === "string" ? candidate.traceId : null;
	const surfaceId =
		typeof candidate.surfaceId === "string" ? candidate.surfaceId : null;
	const contextPolicyId =
		typeof candidate.contextPolicyId === "string"
			? candidate.contextPolicyId
			: null;
	const policy = isObjectRecord(candidate.policy)
		? (candidate.policy as unknown as ContextPolicySelectionResponseDTO)
		: null;

	if (!traceId || !surfaceId || !contextPolicyId || !policy) {
		return null;
	}

	return {
		traceId,
		surfaceId,
		contextPolicyId,
		requestedTools: readStringArray(candidate.requestedTools),
		requestedCorpora: readStringArray(candidate.requestedCorpora),
		policy,
		traceRecords: Array.isArray(candidate.traceRecords)
			? (candidate.traceRecords as ContextTraceRecordDTO[])
			: [],
		evaluationSummary: isObjectRecord(candidate.evaluationSummary)
			? (candidate.evaluationSummary as unknown as ContextEvaluationSummaryDTO)
			: null,
		documentarySources: Array.isArray(candidate.documentarySources)
			? candidate.documentarySources.filter(isKnowledgeSourceReference)
			: [],
		representativePath: candidate.representativePath === true,
		auditLinked: candidate.auditLinked !== false,
		executionMode:
			candidate.executionMode === "deterministic-fallback"
				? "deterministic-fallback"
				: "queued",
	};
}

export function writeControlPlaneSnapshot(
	payload: Record<string, unknown>,
	snapshot: AccountingJobRunControlPlaneSnapshot,
): Record<string, unknown> {
	return {
		...payload,
		[TOP_LEVEL_TRACE_ID_KEY]: snapshot.traceId,
		[CONTROL_PLANE_PAYLOAD_KEY]: snapshot,
	};
}

export function toApprovalState(
	run: AccountingJobRunRecord,
): ContextApprovalState {
	if (!run.approvalRequired) {
		return CONTEXT_APPROVAL_STATES.NOT_REQUIRED;
	}

	if (run.status === "AWAITING_APPROVAL") {
		return CONTEXT_APPROVAL_STATES.PENDING;
	}

	if (run.approvedBy) {
		return CONTEXT_APPROVAL_STATES.APPROVED;
	}

	if (run.status === "CANCELLED" || run.status === "FAILED") {
		return CONTEXT_APPROVAL_STATES.REJECTED;
	}

	return CONTEXT_APPROVAL_STATES.PENDING;
}

export function isTerminalAccountingJobRunStatus(
	status: AccountingJobRunStatus,
): boolean {
	return TERMINAL_ACCOUNTING_JOB_RUN_STATUSES.includes(status);
}

import {
	CONTEXT_APPROVAL_STATES,
	CONTEXT_EVALUATION_STATES,
	type ContextApprovalState,
	type ContextEvaluationMetricDTO,
	type ContextEvaluationSummaryDTO,
	type ContextRegistrySurfaceDTO,
	type ContextRetrievalMode,
	type ContextTraceRecordDTO,
} from "@arkelythex/application";
import type { ControlPlaneRunSnapshot } from "../hooks/cognitive-stream";

type AccountingJobCategory =
	| "reconciliation"
	| "compliance"
	| "closing"
	| "collections"
	| "payables";

export interface RawAccountingJobRunRecord {
	id: string;
	companyId: string;
	countryCode: string;
	jobId: string;
	jobTitle: string;
	jobCategory: AccountingJobCategory;
	status:
		| "QUEUED"
		| "RUNNING"
		| "AWAITING_APPROVAL"
		| "COMPLETED"
		| "FAILED"
		| "CANCELLED";
	approvalRequired: boolean;
	requestedBy: string | null;
	approvedBy: string | null;
	prompt: string;
	summary: string | null;
	inputPayload: Record<string, unknown>;
	resultPayload: Record<string, unknown> | null;
	evidencePayload: Record<string, unknown> | null;
	startedAt: string | Date;
	completedAt: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
}

export interface ControlPlanePayloadRecord {
	traceId: string | null;
	surfaceId: string | null;
	retrievalMode: ContextRetrievalMode | null;
	evaluationSummary: ContextEvaluationSummaryDTO | null;
	documentarySources: Record<string, unknown>[];
	representativePath: boolean;
	trace: ContextTraceRecordDTO[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function readString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readDocumentarySources(value: unknown): Record<string, unknown>[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.filter(isRecord);
}

function readEvaluationSummary(
	value: unknown,
): ContextEvaluationSummaryDTO | null {
	if (!isRecord(value)) {
		return null;
	}

	const metrics: ContextEvaluationMetricDTO[] = Array.isArray(value.metrics)
		? value.metrics.flatMap((metric) => {
				if (!isRecord(metric)) {
					return [];
				}

				return [
					{
						metric: readString(metric.metric) ?? "unknown-metric",
						value: typeof metric.value === "number" ? metric.value : 0,
						window: readString(metric.window) ?? "unknown-window",
						target: typeof metric.target === "number" ? metric.target : 0,
						blocker: typeof metric.blocker === "number" ? metric.blocker : 0,
						unit: metric.unit === "count" ? "count" : "ratio",
					},
				];
			})
		: [];

	return {
		state:
			value.state === CONTEXT_EVALUATION_STATES.GREEN ||
			value.state === CONTEXT_EVALUATION_STATES.YELLOW ||
			value.state === CONTEXT_EVALUATION_STATES.RED
				? value.state
				: CONTEXT_EVALUATION_STATES.YELLOW,
		metrics,
		generatedAt: readString(value.generatedAt) ?? new Date(0).toISOString(),
		notes: Array.isArray(value.notes)
			? value.notes.filter((note): note is string => typeof note === "string")
			: undefined,
	};
}

function readRetrievalMode(value: unknown): ContextRetrievalMode | null {
	if (
		value === "memory-only" ||
		value === "memory-and-tools" ||
		value === "hybrid-documentary"
	) {
		return value;
	}

	return null;
}

function inferApprovalState(
	run: RawAccountingJobRunRecord,
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

	if (run.status === "FAILED" || run.status === "CANCELLED") {
		return CONTEXT_APPROVAL_STATES.REJECTED;
	}

	return CONTEXT_APPROVAL_STATES.PENDING;
}

function readLocalControlPlanePayload(
	run: RawAccountingJobRunRecord,
): ControlPlanePayloadRecord {
	const inputControlPlane = readRecord(
		readRecord(run.inputPayload).contextControlPlane,
	);
	const resultControlPlane = readRecord(
		readRecord(run.resultPayload).contextControlPlane,
	);
	const evidenceControlPlane = readRecord(
		readRecord(run.evidencePayload).contextControlPlane,
	);

	return {
		traceId:
			readString(inputControlPlane.traceId) ??
			readString(resultControlPlane.traceId) ??
			readString(evidenceControlPlane.traceId),
		surfaceId:
			readString(inputControlPlane.surfaceId) ??
			readString(resultControlPlane.surfaceId) ??
			readString(evidenceControlPlane.surfaceId),
		retrievalMode:
			readRetrievalMode(readRecord(inputControlPlane.policy).retrievalMode) ??
			readRetrievalMode(evidenceControlPlane.retrievalMode),
		evaluationSummary:
			readEvaluationSummary(inputControlPlane.evaluationSummary) ??
			readEvaluationSummary(resultControlPlane.evaluationSummary),
		documentarySources: (() => {
			const persistedSources = readDocumentarySources(
				inputControlPlane.documentarySources,
			);

			return persistedSources.length > 0
				? persistedSources
				: readDocumentarySources(
						readRecord(run.evidencePayload).documentarySources,
					);
		})(),
		representativePath: inputControlPlane.representativePath === true,
		trace: Array.isArray(inputControlPlane.traceRecords)
			? (inputControlPlane.traceRecords.filter(
					isRecord,
				) as unknown as ContextTraceRecordDTO[])
			: [],
	};
}

type ControlPlaneApi = typeof import("../api/context-control-plane.api");

async function resolveControlPlaneSnapshot(
	run: RawAccountingJobRunRecord,
	surfaceById: Map<string, ContextRegistrySurfaceDTO>,
	controlPlaneApi: ControlPlaneApi,
): Promise<ControlPlaneRunSnapshot | null> {
	const localPayload = readLocalControlPlanePayload(run);
	if (!localPayload.traceId || !localPayload.surfaceId) {
		return null;
	}

	const surface = surfaceById.get(localPayload.surfaceId) ?? null;

	try {
		const [state, trace, evaluation] = await Promise.all([
			controlPlaneApi.getControlPlaneRunState(run.companyId, run.id),
			controlPlaneApi.getControlPlaneRunTrace(run.companyId, run.id),
			controlPlaneApi.getControlPlaneRunEvaluation(run.companyId, run.id),
		]);

		return {
			traceId: state.traceId,
			surfaceId: state.surfaceId,
			surface,
			approvalState: state.approvalState,
			retrievalMode: state.retrievalMode,
			evaluationSummary:
				evaluation.evaluationSummary ??
				state.evaluationSummary ??
				localPayload.evaluationSummary,
			trace: trace.events,
			documentarySources: localPayload.documentarySources,
			representativePath: localPayload.representativePath,
		};
	} catch (error: unknown) {
		if (!controlPlaneApi.isControlPlaneMissingTraceError(error)) {
			// fall through to local snapshot to keep the client supervised path visible.
		}

		return {
			traceId: localPayload.traceId,
			surfaceId: localPayload.surfaceId,
			surface,
			approvalState: inferApprovalState(run),
			retrievalMode: localPayload.retrievalMode,
			evaluationSummary: localPayload.evaluationSummary,
			trace: localPayload.trace,
			documentarySources: localPayload.documentarySources,
			representativePath: localPayload.representativePath,
		};
	}
}

export interface AccountingJobRunView {
	id: string;
	companyId: string;
	countryCode: string;
	jobId: string;
	jobTitle: string;
	jobCategory: AccountingJobCategory;
	status:
		| "QUEUED"
		| "RUNNING"
		| "AWAITING_APPROVAL"
		| "COMPLETED"
		| "FAILED"
		| "CANCELLED";
	approvalRequired: boolean;
	requestedBy: string | null;
	approvedBy: string | null;
	prompt: string;
	summary: string | null;
	inputPayload: Record<string, unknown>;
	resultPayload: Record<string, unknown> | null;
	evidencePayload: Record<string, unknown> | null;
	startedAt: string | Date;
	completedAt: string | Date | null;
	createdAt: string | Date;
	updatedAt: string | Date;
	controlPlane: ControlPlaneRunSnapshot | null;
}

function mapRawRunToView(
	run: RawAccountingJobRunRecord,
	controlPlane: ControlPlaneRunSnapshot | null = null,
): AccountingJobRunView {
	return {
		...run,
		controlPlane,
	};
}

function mapRunViewWithControlPlane(
	run: AccountingJobRunView,
	controlPlane: ControlPlaneRunSnapshot | null,
): AccountingJobRunView {
	return {
		...run,
		controlPlane,
	};
}

export {
	isRecord,
	readRecord,
	readString,
	readDocumentarySources,
	readEvaluationSummary,
	readRetrievalMode,
	inferApprovalState,
	readLocalControlPlanePayload,
	resolveControlPlaneSnapshot,
	mapRawRunToView,
	mapRunViewWithControlPlane,
};

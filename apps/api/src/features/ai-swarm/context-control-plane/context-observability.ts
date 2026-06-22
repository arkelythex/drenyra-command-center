import {
	CONTEXT_TRACE_EVENT_TYPES,
	type ContextEvaluationSummaryDTO,
	type ContextPolicySelectionRequestDTO,
	type ContextPolicySelectionResponseDTO,
	type ContextTraceRecordDTO,
} from "@arkelythex/application";
import { summarizeAiObservationPayload } from "../api/ai-observability-sanitizer";

interface PolicyTraceInput {
	request: ContextPolicySelectionRequestDTO;
	response: ContextPolicySelectionResponseDTO;
	runId?: string;
	organizationId?: number | null;
}

interface EvaluationTraceInput {
	traceId: string;
	runId: string;
	surfaceId: string;
	tenantId: string;
	evaluationSummary: ContextEvaluationSummaryDTO;
	organizationId?: number | null;
}

export interface ContextAuditEnvelope {
	inputs: Record<string, unknown>;
	outputs: Record<string, unknown>;
	piiRedacted: boolean;
}

function dedupe(values: readonly string[] | undefined): string[] {
	return Array.from(
		new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
	);
}

export function buildContextPolicyTraceRecord(
	input: PolicyTraceInput,
): ContextTraceRecordDTO {
	return {
		eventType: CONTEXT_TRACE_EVENT_TYPES.POLICY_RESOLVED,
		traceId: input.response.traceId,
		occurredAt: new Date().toISOString(),
		summary: input.response.allowed
			? `Context policy resolved for '${input.response.surfaceId}'.`
			: `Context policy blocked for '${input.response.surfaceId}'.`,
		piiRedacted: true,
		attributes: {
			traceId: input.response.traceId,
			runId: input.runId ?? input.response.traceId,
			surfaceId: input.response.surfaceId,
			tenantId: input.request.tenantId,
			organizationId: input.organizationId ?? null,
			retrievalMode: input.response.retrievalMode,
			approvalState: input.response.approvalState,
			requestedTools: dedupe(input.request.requestedTools),
			requestedCorpora: dedupe(input.request.requestedCorpora),
		},
	};
}

export function buildContextEvaluationTraceRecord(
	input: EvaluationTraceInput,
): ContextTraceRecordDTO {
	return {
		eventType: CONTEXT_TRACE_EVENT_TYPES.EVALUATION_RECORDED,
		traceId: input.traceId,
		occurredAt: input.evaluationSummary.generatedAt,
		summary: `Context evaluation recorded for '${input.surfaceId}' with state '${input.evaluationSummary.state}'.`,
		piiRedacted: true,
		attributes: {
			traceId: input.traceId,
			runId: input.runId,
			surfaceId: input.surfaceId,
			tenantId: input.tenantId,
			organizationId: input.organizationId ?? null,
			evaluationState: input.evaluationSummary.state,
		},
	};
}

export function buildContextAuditEnvelope(
	record: ContextTraceRecordDTO,
	payload: unknown,
): ContextAuditEnvelope {
	const summary = summarizeAiObservationPayload(payload);

	return {
		inputs: {
			traceId: record.traceId,
			runId: record.attributes.runId,
			surfaceId: record.attributes.surfaceId,
			tenantId: record.attributes.tenantId,
			eventType: record.eventType,
		},
		outputs: {
			summary: record.summary,
			piiRedacted: true,
			payloadPreview: summary.preview,
			payloadHash: summary.hash,
		},
		piiRedacted: true,
	};
}

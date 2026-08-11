import type {
	ContextEvaluationSummaryDTO,
	ContextPolicySelectionRequestDTO,
	ContextPolicySelectionResponseDTO,
	ContextTraceRecordDTO,
} from "@drenyra/application";
import { enqueueSwarmAuditLog } from "../api/audit-log-bridge";
import {
	buildContextAuditEnvelope,
	buildContextEvaluationTraceRecord,
	buildContextPolicyTraceRecord,
} from "./context-observability";

interface PolicyAuditInput {
	request: ContextPolicySelectionRequestDTO;
	response: ContextPolicySelectionResponseDTO;
	runId: string;
	organizationId?: number | null;
}

interface EvaluationAuditInput {
	traceId: string;
	runId: string;
	surfaceId: string;
	tenantId: string;
	evaluationSummary: ContextEvaluationSummaryDTO;
	organizationId?: number | null;
}

interface TraceAuditInput {
	record: ContextTraceRecordDTO;
	decisionType: string;
	payload: unknown;
	organizationId?: number | null | undefined;
}

export class ContextAuditService {
	recordPolicyResolution(input: PolicyAuditInput): ContextTraceRecordDTO {
		const record = buildContextPolicyTraceRecord(input);
		this.recordTrace({
			record,
			decisionType: input.response.allowed
				? "context_policy_resolved"
				: "context_policy_blocked",
			payload: {
				request: input.request,
				response: input.response,
			},
			organizationId: input.organizationId,
		});
		return record;
	}

	recordEvaluation(input: EvaluationAuditInput): ContextTraceRecordDTO {
		const record = buildContextEvaluationTraceRecord(input);
		this.recordTrace({
			record,
			decisionType: "context_evaluation_recorded",
			payload: input.evaluationSummary,
			organizationId: input.organizationId,
		});
		return record;
	}

	recordTrace(input: TraceAuditInput): void {
		const envelope = buildContextAuditEnvelope(input.record, input.payload);
		enqueueSwarmAuditLog({
			organizationId: input.organizationId ?? null,
			agentName: "context_control_plane",
			agentVersion: "2026.04",
			decisionType: input.decisionType,
			reasoning: input.record.summary,
			inputs: envelope.inputs,
			outputs: envelope.outputs,
		});
	}
}

export const contextAuditService = new ContextAuditService();

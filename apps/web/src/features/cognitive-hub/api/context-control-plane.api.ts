import type {
	ContextEvaluationSummaryDTO,
	ContextRegistrySurfaceDTO,
	ContextRunStateDTO,
	ContextTraceRecordDTO,
} from "@drenyra/application";
import { api, getGovernanceAuditHeaders } from "@/lib/api";

interface ApiEnvelope<TData> {
	success: boolean;
	data: TData;
	error?: string;
	code?: string;
}

interface ControlPlaneRegistryPayload {
	companyId: string;
	count: number;
	surfaces: ContextRegistrySurfaceDTO[];
}

interface ControlPlaneTracePayload {
	runId: string;
	count: number;
	events: ContextTraceRecordDTO[];
}

interface ControlPlaneEvaluationPayload {
	runId: string;
	evaluationSummary: ContextEvaluationSummaryDTO | null;
}

export interface ControlPlaneApiError extends Error {
	code?: string;
	status?: number;
}

function toApiError(
	status: number,
	payload: { error?: string; code?: string } | null,
): ControlPlaneApiError {
	const error = new Error(
		payload?.error ?? `Control-plane request failed with status ${status}`,
	) as ControlPlaneApiError;
	error.code = payload?.code;
	error.status = status;
	return error;
}

function assertEnvelope<TData>(response: {
	data: unknown;
	error: unknown;
}): TData {
	if (response.error && typeof response.error === "object") {
		const err = response.error as {
			status: number;
			value: { error?: string; code?: string };
		};
		throw toApiError(err.status, err.value);
	}

	const payload = response.data as
		| ApiEnvelope<TData>
		| { success: true; data: TData }
		| { success: false; error?: string; code?: string }
		| null;

	if (!payload || typeof payload !== "object") {
		throw toApiError(500, null);
	}

	if ("success" in payload && payload.success === true && "data" in payload) {
		return payload.data as TData;
	}

	if ("success" in payload && payload.success === false) {
		throw toApiError(500, {
			error: payload.error,
			code: payload.code,
		});
	}

	const legacy = payload as ApiEnvelope<TData>;
	if (!legacy.success) {
		throw toApiError(500, {
			error: legacy.error,
			code: legacy.code,
		});
	}

	return legacy.data;
}

export async function getControlPlaneRegistry(
	companyId: string,
): Promise<ControlPlaneRegistryPayload> {
	const response = await api.api["ai-swarm"][
		"context-control-plane"
	].registry.get({
		query: { companyId },
		headers: getGovernanceAuditHeaders(),
	});

	return assertEnvelope(response);
}

export async function getControlPlaneRunState(
	companyId: string,
	runId: string,
): Promise<ContextRunStateDTO> {
	const response = await api.api["ai-swarm"]["context-control-plane"]
		.runs({ runId })
		.state.get({
			query: { companyId },
			headers: getGovernanceAuditHeaders(),
		});

	return assertEnvelope(response);
}

export async function getControlPlaneRunTrace(
	companyId: string,
	runId: string,
): Promise<ControlPlaneTracePayload> {
	const response = await api.api["ai-swarm"]["context-control-plane"]
		.runs({ runId })
		.trace.get({
			query: { companyId },
			headers: getGovernanceAuditHeaders(),
		});

	return assertEnvelope(response);
}

export async function getControlPlaneRunEvaluation(
	companyId: string,
	runId: string,
): Promise<ControlPlaneEvaluationPayload> {
	const response = await api.api["ai-swarm"]["context-control-plane"]
		.runs({ runId })
		.evaluation.get({
			query: { companyId },
			headers: getGovernanceAuditHeaders(),
		});

	return assertEnvelope(response);
}

export function isControlPlaneMissingTraceError(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof error.code === "string" &&
		error.code === "CONTEXT_TRACE_ID_REQUIRED"
	);
}

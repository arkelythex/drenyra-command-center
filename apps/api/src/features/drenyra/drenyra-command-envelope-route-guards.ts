import { randomUUID } from "node:crypto";
import type { DrenyraActorContext } from "@drenyra/application/drenyra";
import { evaluateDrenyraCapability } from "../../../../../packages/domain/src/drenyra/capabilities";
import type {
	DrenyraCapabilityEvaluation,
	DrenyraCapabilityGrant,
	DrenyraToolId,
} from "../../../../../packages/domain/src/drenyra/capability-types";
import type { DrenyraAgentType } from "../../../../../packages/domain/src/drenyra/types";
import { type ApiFailure, fail, ok } from "../shared/api-response";

type Headers = Record<string, string | undefined>;
type ContextResolution =
	| { ok: true; context: DrenyraActorContext }
	| { ok: false; missingHeaders: string[] };

export interface CapabilityAuditInput {
	caseId?: string | undefined;
	commandId: string;
	evaluation: DrenyraCapabilityEvaluation;
	traceId: string;
}

interface GuardedEnvelopeOptions<T> {
	approvalId?: string;
	auditCaseId?: string;
	commandId: string;
	createEnvelope: (
		context: DrenyraActorContext,
		traceId: string,
	) => T | Promise<T | ApiFailure>;
	onCapabilityEvaluated?: (
		context: DrenyraActorContext,
		input: CapabilityAuditInput,
	) => Promise<void>;
}

function readHeader(headers: Headers, key: string): string {
	return headers[key]?.trim() ?? "";
}

function resolveContext(headers: Headers): ContextResolution {
	const companyId = readHeader(headers, "x-company-id");
	const userId = readHeader(headers, "x-user-id");
	const companyRuc = readHeader(headers, "x-company-ruc");
	const period = readHeader(headers, "x-fiscal-period");
	const missingHeaders = [
		...(companyId ? [] : ["x-company-id"]),
		...(userId ? [] : ["x-user-id"]),
		...(companyRuc ? [] : ["x-company-ruc"]),
		...(period ? [] : ["x-fiscal-period"]),
	];
	if (!companyId || !userId || !companyRuc || !period)
		return { ok: false, missingHeaders };
	return {
		ok: true,
		context: {
			companyId,
			companyRuc,
			organizationId: readHeader(headers, "x-organization-id") || companyId,
			period,
			userId,
		},
	};
}

function contextFailure(missingHeaders: string[]) {
	return fail(
		"Drenyra command center requests require company, RUC, fiscal period and user headers",
		"TENANT_CONTEXT_REQUIRED",
		{
			details: { missingHeaders },
		},
	);
}

function commandTraceId(headers: Headers): string {
	const incomingTraceId = readHeader(headers, "x-trace-id");
	if (/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(incomingTraceId))
		return incomingTraceId;
	return `cmd-${randomUUID()}`;
}

function scopedGrants(
	headers: Headers,
	context: DrenyraActorContext,
	agentType: DrenyraAgentType,
	toolId: DrenyraToolId,
): DrenyraCapabilityGrant[] {
	if (readHeader(headers, "x-drenyra-capability-grant") !== "scoped") return [];
	return [
		{
			agentType,
			toolId,
			scope: { ...context, countryCode: "PE" },
			grantedBy: context.userId,
			grantedAt: new Date(0).toISOString(),
		},
	];
}

function denied(evaluation: DrenyraCapabilityEvaluation) {
	return fail("Drenyra capability denied", "DRENYRA_CAPABILITY_DENIED", {
		details: {
			reason: evaluation.reason,
			auditEventType: evaluation.auditEventType,
			policy: evaluation.policy,
		},
	});
}

function evaluate(input: {
	headers: Headers;
	context: DrenyraActorContext;
	agentType: DrenyraAgentType;
	toolId: DrenyraToolId;
	approvalId?: string | undefined;
}): DrenyraCapabilityEvaluation {
	return evaluateDrenyraCapability({
		request: {
			agentType: input.agentType,
			toolId: input.toolId,
			scope: { ...input.context, countryCode: "PE" },
			redactionOk:
				readHeader(input.headers, "x-drenyra-redaction-ok") === "true",
			...(input.approvalId !== undefined
				? { approvalId: input.approvalId }
				: {}),
		},
		grants: scopedGrants(
			input.headers,
			input.context,
			input.agentType,
			input.toolId,
		),
	});
}

function isFailure(value: unknown): value is ApiFailure {
	return (
		typeof value === "object" &&
		value !== null &&
		"success" in value &&
		value.success === false
	);
}

export async function guardedEnvelope<T>(
	set: { status?: number | string },
	headers: Headers,
	agentType: DrenyraAgentType,
	toolId: DrenyraToolId,
	options: GuardedEnvelopeOptions<T>,
) {
	const context = resolveContext(headers);
	if (!context.ok) {
		set.status = 400;
		return contextFailure(context.missingHeaders);
	}
	const traceId = commandTraceId(headers);
	const evaluation = evaluate({
		headers,
		context: context.context,
		agentType,
		toolId,
		approvalId: options.approvalId,
	});
	await options.onCapabilityEvaluated?.(context.context, {
		caseId: options.auditCaseId,
		commandId: options.commandId,
		evaluation,
		traceId,
	});
	if (evaluation.decision !== "allowed") {
		set.status = 403;
		return denied(evaluation);
	}
	const result = await options.createEnvelope(context.context, traceId);
	return isFailure(result) ? result : ok(result);
}

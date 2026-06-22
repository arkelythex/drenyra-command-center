import { randomUUID } from "node:crypto";
import type { DrenyraActorContext, DrenyraAuditEventFilter, DrenyraFiscalCommandCenterService, DrenyraRepository } from "@arkelythex/application/drenyra";
import type { AuditEvent } from "../../../../../packages/domain/src/drenyra/types";
import type { CapabilityAuditInput } from "./drenyra-command-envelope-route-guards";

interface CapabilityDecisionRecorder {
	recordCapabilityDecision?: (
		context: DrenyraActorContext,
		input: {
			caseId?: string;
			commandId: string;
			toolId: string;
			agentType: string;
			decision: "allowed" | "denied";
			reason: string;
			traceId: string;
		},
	) => Promise<unknown>;
}


interface CommandAuditReader {
	listCommandAuditEvents?: (context: DrenyraActorContext, filter?: DrenyraAuditEventFilter) => Promise<AuditEvent[]>;
}

interface RepositoryOwner {
	repository?: Pick<DrenyraRepository, "createAuditEvent"> & Partial<Pick<DrenyraRepository, "listCommandAuditEvents">> & { auditEvents?: Map<string, AuditEvent> };
}

function auditEvent(context: DrenyraActorContext, input: CapabilityAuditInput): AuditEvent {
	return {
		id: `audit_${randomUUID()}`,
		caseId: input.caseId,
		scope: {
			companyId: context.companyId,
			companyRuc: context.companyRuc,
			countryCode: "PE",
			organizationId: context.organizationId,
			period: context.period,
		},
		eventType: input.evaluation.decision === "allowed" ? "CAPABILITY_ALLOWED" : "CAPABILITY_DENIED",
		actorId: context.userId,
		message: `Drenyra command capability ${input.evaluation.decision}: ${input.commandId}`,
		occurredAt: new Date().toISOString(),
		metadata: {
			agentType: input.evaluation.policy.agentType,
			commandId: input.commandId,
			reason: input.evaluation.reason,
			toolId: input.evaluation.policy.toolId,
			traceId: input.traceId,
		},
	};
}

export async function recordCommandEnvelopeCapability(
	commandCenter: DrenyraFiscalCommandCenterService,
	context: DrenyraActorContext,
	input: CapabilityAuditInput,
): Promise<void> {
	const recorder = commandCenter as unknown as CapabilityDecisionRecorder;
	if (typeof recorder.recordCapabilityDecision === "function") {
		await recorder.recordCapabilityDecision(context, {
			agentType: input.evaluation.policy.agentType,
			caseId: input.caseId,
			commandId: input.commandId,
			decision: input.evaluation.decision,
			reason: input.evaluation.reason,
			toolId: input.evaluation.policy.toolId,
			traceId: input.traceId,
		});
		return;
	}
	const repository = (commandCenter as unknown as RepositoryOwner).repository;
	if (!repository) throw new Error("DRENYRA_COMMAND_AUDIT_REPOSITORY_UNAVAILABLE");
	await repository.createAuditEvent(auditEvent(context, input));
}

export async function listCommandEnvelopeAuditEvents(
	commandCenter: DrenyraFiscalCommandCenterService,
	context: DrenyraActorContext,
	filter: DrenyraAuditEventFilter = {},
): Promise<AuditEvent[]> {
	const reader = commandCenter as unknown as CommandAuditReader;
	if (typeof reader.listCommandAuditEvents === "function") {
		return reader.listCommandAuditEvents(context, filter);
	}
	const repository = (commandCenter as unknown as RepositoryOwner).repository;
	if (!repository) throw new Error("DRENYRA_COMMAND_AUDIT_REPOSITORY_UNAVAILABLE");
	const scope = {
		companyId: context.companyId,
		companyRuc: context.companyRuc,
		organizationId: context.organizationId,
		period: context.period,
	};
	if (typeof repository.listCommandAuditEvents === "function") {
		return repository.listCommandAuditEvents(scope, filter);
	}
	return [...(repository.auditEvents?.values() ?? [])]
		.filter(
			(event) =>
				event.scope.companyId === scope.companyId &&
				event.scope.companyRuc === scope.companyRuc &&
				event.scope.organizationId === scope.organizationId &&
				event.scope.period === scope.period &&
				(event.eventType === "CAPABILITY_ALLOWED" || event.eventType === "CAPABILITY_DENIED") &&
				(!filter.caseId || event.caseId === filter.caseId) &&
				(!filter.commandId || event.metadata.commandId === filter.commandId) &&
				(!filter.eventType || event.eventType === filter.eventType),
		)
		.sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
}

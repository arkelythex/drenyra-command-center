import type { DrenyraFiscalCommandCenterService } from "@drenyra/application/drenyra";
import type { AuditEvent } from "@drenyra/domain/drenyra";
import { Elysia, t } from "elysia";
import { fail, ok } from "../shared/api-response";
import {
	drenyraActorContextFailure,
	type ResolveDrenyraActorContext,
} from "./command-center.shared";

type CommandAuditEventType = "CAPABILITY_ALLOWED" | "CAPABILITY_DENIED";
type CommandAuditDecision = "allowed" | "denied" | "all";
type CommandAuditQuery = {
	caseId?: string;
	commandId?: string;
	eventType?: CommandAuditEventType;
	decision?: CommandAuditDecision;
	limit?: string;
};

interface CommandAuditEventView {
	id: string;
	caseId?: string;
	eventType: CommandAuditEventType;
	actorId: string;
	message: string;
	occurredAt: string;
	metadata: Record<string, unknown>;
}

const optionalRef = t.Optional(t.String({ minLength: 1 }));
const eventTypeSchema = t.Optional(t.Union([t.Literal("CAPABILITY_ALLOWED"), t.Literal("CAPABILITY_DENIED")]));
const decisionSchema = t.Optional(t.Union([t.Literal("allowed"), t.Literal("denied"), t.Literal("all")]));

export function createDrenyraCommandAuditRoutes(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
) {
	return new Elysia({ name: "drenyra-command-audit-routes" })
		.get(
			"/commands/audit-events",
			async ({ query, headers, set }) => {
				const result = await listCommandAudit(commandCenter, resolveDrenyraActorContext, headers, query, set);
				if (!result.success) return result;
				return ok(result.events);
			},
			{ query: commandAuditQuerySchema() },
		)
		.get(
			"/command-envelope/audit",
			async ({ query, headers, set }) => {
				const result = await listCommandAudit(commandCenter, resolveDrenyraActorContext, headers, query, set);
				if (!result.success) return result;
				const decision = query.decision ?? "all";
				return ok({ decision, events: result.events, count: result.events.length });
			},
			{ query: commandEnvelopeAuditQuerySchema() },
		);
}

function commandAuditQuerySchema() {
	return t.Object({
		caseId: optionalRef,
		commandId: optionalRef,
		eventType: eventTypeSchema,
		limit: t.Optional(t.String({ minLength: 1 })),
	});
}

function commandEnvelopeAuditQuerySchema() {
	return t.Object({
		caseId: optionalRef,
		commandId: optionalRef,
		decision: decisionSchema,
		limit: t.Optional(t.String({ minLength: 1 })),
	});
}

async function listCommandAudit(
	commandCenter: DrenyraFiscalCommandCenterService,
	resolveDrenyraActorContext: ResolveDrenyraActorContext,
	headers: Record<string, string | undefined>,
	query: CommandAuditQuery,
	set: { status?: number | string },
): Promise<{ success: true; events: CommandAuditEventView[] } | ReturnType<typeof fail>> {
	const contextResolution = resolveDrenyraActorContext(headers);
	if (!contextResolution.ok) {
		set.status = 400;
		return drenyraActorContextFailure(contextResolution.missingHeaders);
	}
	if (!hasAuditProof(headers)) {
		set.status = 403;
		return fail("Drenyra command audit requires scoped capability and redaction proof", "DRENYRA_CAPABILITY_DENIED");
	}
	const events = await commandCenter.listCommandAuditEvents(contextResolution.context, {
		caseId: query.caseId,
		commandId: query.commandId,
		eventType: query.eventType ?? eventTypeForDecision(query.decision),
	});
	return { success: true, events: events.slice(0, limitFromQuery(query.limit)).map(auditEventView) };
}

function hasAuditProof(headers: Record<string, string | undefined>): boolean {
	const capabilityGrant = headers["x-drenyra-capability-grant"]?.trim() ?? "";
	return capabilityGrant.split(",").map((item) => item.trim()).includes("scoped") && headers["x-drenyra-redaction-ok"]?.trim() === "true";
}

function eventTypeForDecision(decision?: CommandAuditDecision): CommandAuditEventType | undefined {
	if (decision === "allowed") return "CAPABILITY_ALLOWED";
	if (decision === "denied") return "CAPABILITY_DENIED";
	return undefined;
}

function limitFromQuery(rawLimit?: string): number {
	const parsed = Number.parseInt(rawLimit ?? "50", 10);
	if (Number.isNaN(parsed) || parsed < 1) return 50;
	return Math.min(parsed, 100);
}

function auditEventView(event: AuditEvent): CommandAuditEventView {
	return {
		id: event.id,
		caseId: event.caseId,
		eventType: event.eventType as CommandAuditEventType,
		actorId: event.actorId,
		message: event.message,
		occurredAt: event.occurredAt,
		metadata: event.metadata,
	};
}

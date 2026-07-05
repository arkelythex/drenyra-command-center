import { Elysia } from "elysia";
import { beforeEach, describe, expect, it } from "vitest";
import {
	DrenyraFiscalCommandCenterService,
	InMemoryDrenyraRepository,
	type DrenyraActorContext,
} from "@drenyra/application/drenyra";
import type { AuditEvent, AuditEventType, FiscalScope } from "@drenyra/domain/drenyra";
import { createDrenyraCommandAuditRoutes } from "../command-audit.routes";

const context: DrenyraActorContext = {
	companyId: "company-audit",
	companyRuc: "20601234567",
	organizationId: "org-audit",
	period: "2026-05",
	userId: "user-audit",
};

const headers = {
	"x-company-id": context.companyId,
	"x-company-ruc": context.companyRuc,
	"x-organization-id": context.organizationId,
	"x-fiscal-period": context.period,
	"x-user-id": context.userId,
	"x-drenyra-capability-grant": "scoped",
	"x-drenyra-redaction-ok": "true",
};

let repository: InMemoryDrenyraRepository;
let service: DrenyraFiscalCommandCenterService;

function scope(overrides: Partial<FiscalScope> = {}): FiscalScope {
	return {
		companyId: context.companyId,
		companyRuc: context.companyRuc,
		countryCode: "PE",
		organizationId: context.organizationId,
		period: context.period,
		...overrides,
	};
}

function auditEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
	return {
		id: "audit-1",
		scope: scope(),
		eventType: "CAPABILITY_ALLOWED",
		actorId: context.userId,
		message: "Capability allowed",
		occurredAt: "2026-05-27T00:01:00.000Z",
		metadata: { commandId: "review-sunat" },
		...overrides,
	};
}

function app() {
	return new Elysia().use(createDrenyraCommandAuditRoutes(service, () => ({ ok: true, context })));
}

async function getJson(path: string, requestHeaders: Record<string, string> = headers): Promise<Response> {
	return app().handle(new Request(`http://localhost${path}`, { headers: requestHeaders }));
}

describe("Drenyra command audit routes", () => {
	beforeEach(() => {
		repository = new InMemoryDrenyraRepository();
		service = new DrenyraFiscalCommandCenterService(repository);
	});

	it("lists scoped command audit events including case-less events", async () => {
		await repository.createAuditEvent(auditEvent({ id: "audit-allowed" }));
		await repository.createAuditEvent(
			auditEvent({
				id: "audit-denied",
				caseId: "case-1",
				eventType: "CAPABILITY_DENIED",
				message: "Capability denied",
				occurredAt: "2026-05-27T00:02:00.000Z",
				metadata: { commandId: "prepare-evidence" },
			}),
		);
		await repository.createAuditEvent(
			auditEvent({
				id: "audit-other-scope",
				scope: scope({ period: "2026-06" }),
			}),
		);

		const response = await getJson("/commands/audit-events");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data.map((event: { id: string }) => event.id)).toEqual(["audit-denied", "audit-allowed"]);
		expect(payload.data[1].caseId).toBeUndefined();
		expect(payload.data[0].scope).toBeUndefined();
	});

	it("filters command audit events by command and event type", async () => {
		await repository.createAuditEvent(auditEvent({ id: "audit-review" }));
		await repository.createAuditEvent(
			auditEvent({
				id: "audit-denied",
				eventType: "CAPABILITY_DENIED",
				metadata: { commandId: "review-sunat" },
			}),
		);

		const response = await getJson("/commands/audit-events?commandId=review-sunat&eventType=CAPABILITY_ALLOWED");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.map((event: { id: string }) => event.id)).toEqual(["audit-review"]);
	});

	it("returns command-envelope audit shape for web consumers", async () => {
		await repository.createAuditEvent(auditEvent({ id: "audit-allowed" }));
		await repository.createAuditEvent(
			auditEvent({
				id: "audit-denied",
				eventType: "CAPABILITY_DENIED",
			}),
		);

		const response = await getJson("/command-envelope/audit?decision=denied&limit=1");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data).toMatchObject({
			decision: "denied",
			count: 1,
			events: [{ id: "audit-denied", eventType: "CAPABILITY_DENIED" as AuditEventType }],
		});
	});

	it("fails closed without scoped capability and redaction proof", async () => {
		const response = await getJson("/commands/audit-events", {
			...headers,
			"x-drenyra-capability-grant": "other",
		});
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.success).toBe(false);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
	});
});

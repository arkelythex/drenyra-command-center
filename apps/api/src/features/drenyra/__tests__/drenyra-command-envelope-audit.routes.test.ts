import { DrenyraFiscalCommandCenterService, InMemoryDrenyraRepository } from "@drenyra/application/drenyra";
import type { AuditEvent, FiscalScope } from "@drenyra/domain/drenyra";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { createCommandEnvelopeAuditRoutes } from "../command-envelope-audit.routes";
import { commandHeaders } from "./drenyra-route-test-helpers";

const scope: FiscalScope = {
	companyId: commandHeaders["x-company-id"],
	companyRuc: commandHeaders["x-company-ruc"],
	organizationId: commandHeaders["x-organization-id"],
	period: commandHeaders["x-fiscal-period"],
	countryCode: "PE",
};

function auditEvent(input: Partial<AuditEvent> & Pick<AuditEvent, "id" | "eventType">): AuditEvent {
	return {
		caseId: input.caseId,
		scope: input.scope ?? scope,
		actorId: input.actorId ?? commandHeaders["x-user-id"],
		message: input.message ?? "Command envelope capability decision",
		occurredAt: input.occurredAt ?? "2026-05-27T03:40:00.000Z",
		metadata: input.metadata ?? { commandId: "cmd-001", toolId: "sunat.sire.submit" },
		...input,
	};
}

async function buildApp() {
	const repository = new InMemoryDrenyraRepository();
	await repository.createAuditEvent(auditEvent({ id: "audit-allowed", eventType: "CAPABILITY_ALLOWED" }));
	await repository.createAuditEvent(auditEvent({ id: "audit-denied", eventType: "CAPABILITY_DENIED" }));
	await repository.createAuditEvent(
		auditEvent({
			id: "audit-case",
			caseId: "case-001",
			eventType: "CAPABILITY_DENIED",
			occurredAt: "2026-05-27T03:41:00.000Z",
		}),
	);
	await repository.createAuditEvent(
		auditEvent({
			id: "audit-other-scope",
			eventType: "CAPABILITY_DENIED",
			scope: { ...scope, companyRuc: "20100070970" },
		}),
	);
	const commandCenter = new DrenyraFiscalCommandCenterService(repository);
	return new Elysia({ prefix: "/api/drenyra" }).use(createCommandEnvelopeAuditRoutes({ commandCenter }));
}

describe("Drenyra command envelope audit routes", () => {
	it("lists scoped case-less capability audit events", async () => {
		const app = await buildApp();
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/command-envelope/audit", { headers: commandHeaders }),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.count).toBe(3);
		expect(payload.data.events.map((event: AuditEvent) => event.id)).toEqual([
			"audit-case",
			"audit-allowed",
			"audit-denied",
		]);
		expect(payload.data.events.map((event: AuditEvent) => event.id)).not.toContain("audit-other-scope");
	});

	it("filters command envelope audit by decision and case id", async () => {
		const app = await buildApp();
		const response = await app.handle(
			new Request(
				"http://localhost/api/drenyra/command-envelope/audit?decision=denied&caseId=case-001",
				{ headers: commandHeaders },
			),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.decision).toBe("denied");
		expect(payload.data.events.map((event: AuditEvent) => event.id)).toEqual(["audit-case"]);
	});
});

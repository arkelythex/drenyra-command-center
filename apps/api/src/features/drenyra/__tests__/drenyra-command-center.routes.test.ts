import { DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY } from "@drenyra/domain/drenyra";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const commandHeaders = {
	"content-type": "application/json",
	"x-company-id": "company-route-001",
	"x-company-ruc": "20123456786",
	"x-drenyra-capability-grant": "scoped",
	"x-drenyra-redaction-ok": "true",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-route-001",
};

async function requestJson(
	path: string,
	method: "GET" | "POST" | "PATCH",
	body?: unknown,
	headers: Record<string, string> = commandHeaders,
): Promise<Response> {
	const app = new Elysia().use(drenyraModule);
	return app.handle(
		new Request(`http://localhost${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		}),
	);
}

async function createCase(idempotencyKey?: string): Promise<string> {
	const response = await requestJson(
		"/api/drenyra/cases",
		"POST",
		{
			type: "MONTHLY_CLOSE",
			title: "Cierre route test",
			description: "Caso fiscal para route test",
			riskLevel: "HIGH",
			riskScore: 71,
		},
		idempotencyKey
			? { ...commandHeaders, "x-idempotency-key": idempotencyKey }
			: commandHeaders,
	);
	const payload = await response.json();
	expect(response.status).toBe(201);
	expect(payload.success).toBe(true);
	return payload.data.id as string;
}

describe("Drenyra command center routes", () => {
	it("exposes the Drenyra dual-surface contract", async () => {
		const response = await requestJson("/api/drenyra/contract", "GET");
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.version).toContain("dual-surface");
		expect(payload.data.requiredScopeHeaders).toContain("x-company-ruc");
		expect(payload.data.idempotencyHeader).toBe("x-idempotency-key");
		expect(payload.data.platformCategory).toBe(
			"ai_augmented_fiscal_sovereignty_platform",
		);
		expect(payload.data.fiscalOntologyVersion).toBe(
			"2026-05.fiscal-ontology.v1",
		);
		expect(payload.data.agentGovernance.denyByDefault).toBe(true);
		expect(payload.data.agentGovernance.capabilityManifestFields).toContain(
			"redactionRequired",
		);
		expect(
			payload.data.agentGovernance.materialFiscalActionsRequireHumanApproval,
		).toBe(true);
	});

	it("replays create fiscal case idempotently when x-idempotency-key matches", async () => {
		const first = await createCase("idem-route-create-001");
		const second = await createCase("idem-route-create-001");

		expect(second).toBe(first);
	});

	it("returns the shared fiscal work inspect envelope for scoped callers", async () => {
		const id = await createCase();
		await requestJson(`/api/drenyra/cases/${id}/evidence`, "POST", {
			type: "SUNAT_RECORD",
			title: "Registro SIRE",
			summary: "Evidencia SIRE mock",
			source: "SUNAT Portal",
		});
		const response = await requestJson(
			`/api/drenyra/fiscal-work/${id}/inspect`,
			"GET",
			undefined,
			{
				...commandHeaders,
				"x-drenyra-capability-grant": DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				"x-drenyra-source-surface": "web",
				"x-trace-id": "trace-route-inspect",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.status).toBe("success");
		expect(payload.reasonCode).toBe("OK");
		expect(payload.traceId).toBe("trace-route-inspect");
		expect(payload.capabilityId).toBe(DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY);
		expect(payload.sourceSurface).toBe("web");
		expect(payload.data.case.id).toBe(id);
		expect(payload.evidenceRefs).toHaveLength(1);
		expect(payload.summary).toContain("Cierre route test");
	});

	it("returns inspect validation envelopes for missing RUC and fiscal period", async () => {
		const id = await createCase();
		const response = await requestJson(
			`/api/drenyra/fiscal-work/${id}/inspect`,
			"GET",
			undefined,
			{
				"content-type": "application/json",
				"x-company-id": "company-route-001",
				"x-user-id": "user-route-001",
				"x-drenyra-capability-grant": DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				"x-trace-id": "trace-route-missing",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.status).toBe("validation_failed");
		expect(payload.reasonCode).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.traceId).toBe("trace-route-missing");
		expect(payload.data).toBeUndefined();
		expect(payload.redactedDetail).toContain("x-company-ruc");
		expect(payload.redactedDetail).toContain("x-fiscal-period");
	});

	it("returns safe not-found inspect envelopes for out-of-scope callers", async () => {
		const id = await createCase();
		const response = await requestJson(
			`/api/drenyra/fiscal-work/${id}/inspect`,
			"GET",
			undefined,
			{
				...commandHeaders,
				"x-company-ruc": "20999999999",
				"x-drenyra-capability-grant": DRENYRA_FISCAL_WORK_INSPECT_CAPABILITY,
				"x-trace-id": "trace-route-ruc-mismatch",
			},
		);
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.status).toBe("not_found");
		expect(payload.reasonCode).toBe("NOT_FOUND");
		expect(payload.traceId).toBe("trace-route-ruc-mismatch");
		expect(payload.data).toBeUndefined();
		expect(payload.evidenceRefs).toBeUndefined();
	});

	it("denies fiscal work inspect without an explicit capability grant", async () => {
		const id = await createCase();
		const response = await requestJson(
			`/api/drenyra/fiscal-work/${id}/inspect`,
			"GET",
			undefined,
			{ ...commandHeaders, "x-trace-id": "trace-route-denied" },
		);
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.status).toBe("denied");
		expect(payload.reasonCode).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.traceId).toBe("trace-route-denied");
		expect(payload.data).toBeUndefined();
		expect(payload.evidenceRefs).toBeUndefined();
	});

	it("creates, lists and gets fiscal case details", async () => {
		const id = await createCase();
		const listResponse = await requestJson("/api/drenyra/cases", "GET");
		const listPayload = await listResponse.json();
		const detailsResponse = await requestJson(
			`/api/drenyra/cases/${id}`,
			"GET",
		);
		const detailsPayload = await detailsResponse.json();

		expect(listResponse.status).toBe(200);
		expect(
			listPayload.data.some((item: { id: string }) => item.id === id),
		).toBe(true);
		expect(detailsPayload.data.case.id).toBe(id);
		expect(detailsPayload.data.auditEvents).toHaveLength(1);
	});

	it("updates fiscal case status and returns an audit event in details", async () => {
		const id = await createCase();
		const statusResponse = await requestJson(
			`/api/drenyra/cases/${id}/status`,
			"PATCH",
			{
				status: "IN_REVIEW",
				reason: "Revisión fiscal iniciada",
			},
		);
		const statusPayload = await statusResponse.json();
		const detailsResponse = await requestJson(
			`/api/drenyra/cases/${id}`,
			"GET",
		);
		const detailsPayload = await detailsResponse.json();

		expect(statusResponse.status).toBe(200);
		expect(statusPayload.data.status).toBe("IN_REVIEW");
		expect(
			detailsPayload.data.auditEvents.map(
				(event: { eventType: string }) => event.eventType,
			),
		).toContain("FISCAL_CASE_STATUS_CHANGED");
	});

	it("rejects unchanged fiscal case status through the route", async () => {
		const id = await createCase();
		const response = await requestJson(
			`/api/drenyra/cases/${id}/status`,
			"PATCH",
			{ status: "OPEN" },
		);
		const payload = await response.json();

		expect(response.status).toBe(409);
		expect(payload.code).toBe("CONFLICT");
	});

	it("rejects manual approval-pending status through route validation", async () => {
		const id = await createCase();
		const response = await requestJson(
			`/api/drenyra/cases/${id}/status`,
			"PATCH",
			{ status: "APPROVAL_PENDING" },
		);

		expect(response.status).toBe(422);
	});

	it("requires company RUC and fiscal period for status updates", async () => {
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/cases/case-1/status", {
				method: "PATCH",
				headers: {
					"content-type": "application/json",
					"x-organization-id": "org",
					"x-company-id": "company",
					"x-user-id": "user",
				},
				body: JSON.stringify({ status: "IN_REVIEW" }),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toContain("x-company-ruc");
		expect(payload.details.missingHeaders).toContain("x-fiscal-period");
	});

	it("adds evidence and starts a mock agent run", async () => {
		const id = await createCase();
		const evidenceResponse = await requestJson(
			`/api/drenyra/cases/${id}/evidence`,
			"POST",
			{
				type: "SUNAT_RECORD",
				title: "Registro SIRE",
				summary: "Evidencia SIRE mock",
				source: "SUNAT Portal",
			},
		);
		const runResponse = await requestJson(
			`/api/drenyra/cases/${id}/agent-runs`,
			"POST",
			{
				agentType: "SIRE_AGENT",
			},
		);
		const runsResponse = await requestJson(
			`/api/drenyra/cases/${id}/agent-runs`,
			"GET",
		);
		const runPayload = await runResponse.json();
		const runsPayload = await runsResponse.json();

		expect(evidenceResponse.status).toBe(201);
		expect(runResponse.status).toBe(201);
		expect(runPayload.data.status).toBe("COMPLETED");
		expect(runPayload.data.output.summary).toContain("SIRE");
		expect(runsPayload.data).toHaveLength(1);
	});

	it("requests, approves and rejects approval requests", async () => {
		const approveCaseId = await createCase();
		const rejectCaseId = await createCase();
		const approvalResponse = await requestJson(
			`/api/drenyra/cases/${approveCaseId}/approvals`,
			"POST",
			{
				title: "Aprobar preparación SIRE",
				description: "No ejecuta SUNAT; prepara evidencia",
				diff: { before: {}, after: { prepared: true }, summary: "Preparación" },
			},
		);
		const rejectionResponse = await requestJson(
			`/api/drenyra/cases/${rejectCaseId}/approvals`,
			"POST",
			{
				title: "Aprobar evidencia incompleta",
				description: "Debe rechazarse por falta de sustento",
				diff: { before: {}, after: { ready: false }, summary: "Evidencia" },
			},
		);
		const approvalPayload = await approvalResponse.json();
		const rejectionPayload = await rejectionResponse.json();

		const approvedResponse = await requestJson(
			`/api/drenyra/approvals/${approvalPayload.data.id}/approve`,
			"POST",
			{
				decisionReason: "Evidencia suficiente",
			},
		);
		const rejectedResponse = await requestJson(
			`/api/drenyra/approvals/${rejectionPayload.data.id}/reject`,
			"POST",
			{
				decisionReason: "Falta CDR",
			},
		);
		const approvedPayload = await approvedResponse.json();
		const rejectedPayload = await rejectedResponse.json();

		expect(approvalResponse.status).toBe(201);
		expect(rejectionResponse.status).toBe(201);
		expect(approvedPayload.data.status).toBe("APPROVED");
		expect(rejectedPayload.data.status).toBe("REJECTED");
	});

	it("requires company RUC and fiscal period for command center tenant scope", async () => {
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/cases", {
				method: "GET",
				headers: {
					"x-organization-id": "org",
					"x-company-id": "company",
					"x-user-id": "user",
				},
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toContain("x-company-ruc");
		expect(payload.details.missingHeaders).toContain("x-fiscal-period");
	});

	it("denies command center reads without a scoped Drenyra capability grant", async () => {
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/cases", {
				method: "GET",
				headers: {
					"x-company-id": "company-route-001",
					"x-company-ruc": "20123456786",
					"x-drenyra-redaction-ok": "true",
					"x-fiscal-period": "2026-05",
					"x-user-id": "user-route-001",
				},
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Capability grant is missing");
		expect(payload.details.auditEventType).toBe("CAPABILITY_DENIED");
	});

	it("denies command center reads when redaction evidence is missing", async () => {
		const app = new Elysia().use(drenyraModule);
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/cases", {
				method: "GET",
				headers: {
					"x-company-id": "company-route-001",
					"x-company-ruc": "20123456786",
					"x-drenyra-capability-grant": "scoped",
					"x-fiscal-period": "2026-05",
					"x-user-id": "user-route-001",
				},
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Required redaction failed");
	});
});

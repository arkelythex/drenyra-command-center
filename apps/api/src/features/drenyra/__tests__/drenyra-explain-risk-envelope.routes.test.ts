import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const headers = {
	"content-type": "application/json",
	"x-company-id": "company-command-001",
	"x-company-ruc": "20123456786",
	"x-drenyra-capability-grant": "scoped",
	"x-drenyra-redaction-ok": "true",
	"x-fiscal-period": "2026-05",
	"x-trace-id": "trace-command-test-001",
	"x-user-id": "user-command-001",
};

function app() {
	return new Elysia().use(drenyraModule);
}

async function createScopedRiskCase(client: Elysia): Promise<string> {
	const response = await client.handle(
		new Request("http://localhost/api/drenyra/cases", {
			method: "POST",
			headers,
			body: JSON.stringify({
				type: "MONTHLY_CLOSE",
				title: "IGV mismatch review",
				description: "Scoped fiscal risk for explain-risk route",
				metadata: { riskRef: "igv-mismatch" },
			}),
		}),
	);
	const payload = await response.json();
	const caseId = payload.data.id as string;
	await client.handle(
		new Request(`http://localhost/api/drenyra/cases/${caseId}/evidence`, {
			method: "POST",
			headers,
			body: JSON.stringify({
				type: "AGENT_OUTPUT",
				title: "Risk evidence",
				summary: "Agent-produced risk explanation seed",
				source: "DRENYRA_AGENT",
				sourceRef: "risk:igv-mismatch",
			}),
		}),
	);
	return caseId;
}

async function getCaseDetails(
	client: Elysia,
	caseId: string,
): Promise<{
	auditEvents: Array<{ eventType: string; metadata: Record<string, unknown> }>;
}> {
	const response = await client.handle(
		new Request(`http://localhost/api/drenyra/cases/${caseId}`, {
			method: "GET",
			headers,
		}),
	);
	const payload = await response.json();
	return payload.data as {
		auditEvents: Array<{
			eventType: string;
			metadata: Record<string, unknown>;
		}>;
	};
}

async function postExplainRisk(
	client: Elysia,
	caseId: string,
	requestHeaders = headers,
): Promise<Response> {
	return client.handle(
		new Request("http://localhost/api/drenyra/commands/explain-risk", {
			method: "POST",
			headers: requestHeaders,
			body: JSON.stringify({
				caseId,
				riskRef: "igv-mismatch",
				sourceRef: "risk:igv-mismatch",
			}),
		}),
	);
}

describe("Drenyra explain-risk command envelope route", () => {
	it("returns a source-verified scoped explain-risk command envelope", async () => {
		const client = app();
		const caseId = await createScopedRiskCase(client);
		const response = await postExplainRisk(client, caseId);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toMatchObject({
			commandId: "explain-risk",
			status: "ready",
			riskLevel: "HIGH",
			approval: { required: false, status: "not_required" },
			diff: {
				kind: "risk_profile",
				after: { explainedRiskId: "risk-igv-mismatch" },
			},
		});
		expect(
			payload.data.deterministicChecks.map(
				(check: { id: string; status: string }) => ({
					id: check.id,
					status: check.status,
				}),
			),
		).toEqual([
			{ id: "risk-scope", status: "passed" },
			{ id: "advisory-only", status: "passed" },
		]);
		expect(payload.data.trace.traceId).toBe("trace-command-test-001");

		const details = await getCaseDetails(client, caseId);
		expect(details.auditEvents).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					eventType: "CAPABILITY_ALLOWED",
					metadata: expect.objectContaining({
						commandId: "explain-risk",
						toolId: "explain_risk",
						traceId: "trace-command-test-001",
					}),
				}),
			]),
		);
	});

	it("fails closed when risk evidence is outside the scoped fiscal period", async () => {
		const client = app();
		const caseId = await createScopedRiskCase(client);
		const response = await postExplainRisk(client, caseId, {
			...headers,
			"x-fiscal-period": "2026-06",
		});
		const payload = await response.json();

		expect(response.status).toBe(404);
		expect(payload.code).toBe("DRENYRA_RISK_SOURCE_NOT_FOUND");
	});

	it("denies explain-risk envelope without redaction proof", async () => {
		const client = app();
		const caseId = await createScopedRiskCase(client);
		const response = await postExplainRisk(client, caseId, {
			...headers,
			"x-drenyra-redaction-ok": "",
		});
		const payload = await response.json();

		expect(response.status).toBe(403);
		expect(payload.code).toBe("DRENYRA_CAPABILITY_DENIED");
		expect(payload.details.reason).toBe("Required redaction failed");

		const details = await getCaseDetails(client, caseId);
		expect(details.auditEvents).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					eventType: "CAPABILITY_DENIED",
					metadata: expect.objectContaining({
						commandId: "explain-risk",
						reason: "Required redaction failed",
					}),
				}),
			]),
		);
	});
});

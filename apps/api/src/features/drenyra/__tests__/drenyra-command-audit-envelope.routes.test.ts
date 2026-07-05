import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const headers = {
	"content-type": "application/json",
	"x-company-id": "company-command-audit-001",
	"x-company-ruc": "20123456786",
	"x-drenyra-capability-grant": "scoped",
	"x-drenyra-redaction-ok": "true",
	"x-fiscal-period": "2026-05",
	"x-trace-id": "trace-command-audit-001",
	"x-user-id": "user-command-audit-001",
};

function app() {
	return new Elysia().use(drenyraModule);
}

async function postReviewSunat(client: Elysia): Promise<Response> {
	return client.handle(
		new Request("http://localhost/api/drenyra/commands/review-sunat", {
			method: "POST",
			headers,
			body: JSON.stringify({ sourceRef: "sunat:sire" }),
		}),
	);
}

async function listAudit(
	client: Elysia,
	requestHeaders = headers,
): Promise<Response> {
	return client.handle(
		new Request(
			"http://localhost/api/drenyra/commands/audit-events?commandId=review-sunat&eventType=CAPABILITY_ALLOWED",
			{
				headers: requestHeaders,
			},
		),
	);
}

describe("Drenyra command envelope audit routes", () => {
	it("lists command capability audit events without requiring a case id", async () => {
		const client = app();
		const commandResponse = await postReviewSunat(client);
		const response = await listAudit(client);
		const payload = await response.json();

		expect(commandResponse.status).toBe(200);
		expect(response.status).toBe(200);
		expect(payload.success).toBe(true);
		expect(payload.data).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					eventType: "CAPABILITY_ALLOWED",
					metadata: expect.objectContaining({
						commandId: "review-sunat",
						traceId: "trace-command-audit-001",
					}),
				}),
			]),
		);
	});

	it("keeps command audit reads isolated by fiscal period", async () => {
		const client = app();
		await postReviewSunat(client);
		const response = await listAudit(client, {
			...headers,
			"x-fiscal-period": "2026-06",
		});
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data).toEqual([]);
	});
});

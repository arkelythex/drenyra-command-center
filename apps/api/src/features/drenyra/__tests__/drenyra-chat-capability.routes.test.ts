import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { drenyraModule } from "../drenyra.routes";

const fiscalChatHeaders = {
	"content-type": "application/json",
	"x-company-id": "company-chat-001",
	"x-company-ruc": "20123456786",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-chat-001",
};

function app() {
	return new Elysia().use(drenyraModule);
}

async function postChat(
	headers: Record<string, string>,
	message: string,
): Promise<Response> {
	return app().handle(
		new Request("http://localhost/api/drenyra/chat", {
			method: "POST",
			headers,
			body: JSON.stringify({ message }),
		}),
	);
}

describe("Drenyra chat capability guard", () => {
	it("requires RUC and fiscal period before legacy chat execution", async () => {
		const response = await postChat(
			{
				"content-type": "application/json",
				"x-company-id": "company-chat-001",
				"x-user-id": "user-chat-001",
			},
			"calcula igv",
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toContain("x-company-ruc");
		expect(payload.details.missingHeaders).toContain("x-fiscal-period");
	});

	it("routes fiscal chat to compliance agent via orchestrator", async () => {
		const response = await postChat(
			{ ...fiscalChatHeaders, "x-drenyra-redaction-ok": "true" },
			"calcula igv de esta operación",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.ok).toBe(true);
		expect(payload.agent).toBe("compliance");
		expect(payload.intent.tool).toBe("igv");
		expect(payload.result.success).toBe(true);
		expect(payload.result.data).toEqual({
			agent: "compliance",
			intent: "igv",
			input: "calcula igv de esta operación",
		});
	});

	it("routes SIRE request to compliance agent via orchestrator", async () => {
		const response = await postChat(
			{
				...fiscalChatHeaders,
				"x-drenyra-capability-grant": "scoped",
				"x-drenyra-redaction-ok": "true",
			},
			"prepara sire pse cpe",
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.ok).toBe(true);
		expect(payload.agent).toBe("compliance");
		expect(payload.intent.tool).toBe("sire");
		expect(payload.result.success).toBe(true);
		expect(payload.result.data).toEqual({
			agent: "compliance",
			intent: "sire",
			input: "prepara sire pse cpe",
		});
	});
});

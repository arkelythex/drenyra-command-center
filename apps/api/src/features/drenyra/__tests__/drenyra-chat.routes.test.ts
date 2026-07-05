import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { type ChatRoutesDeps, createChatRoutes } from "../chat.routes";

const chatHeaders = {
	"content-type": "application/json",
	"x-company-id": "company-chat-001",
	"x-user-id": "user-chat-001",
};

function createTestApp() {
	const intent = {
		agent: "CPE_AGENT",
		tool: "chat_response",
		confidence: 0.91,
	};
	const deps: ChatRoutesDeps = {
		intentDetector: {
			async detectIntent() {
				return intent;
			},
		},
		drenyra: {
			async handleInput(_message, _context, sessionId) {
				return {
					sessionId: sessionId ?? "session-chat-001",
					agent: intent.agent,
					intent,
					result: { ok: true, data: "Respuesta fiscal segura para el chat" },
				};
			},
		},
	};
	return new Elysia({ prefix: "/api/drenyra" }).use(createChatRoutes(deps));
}

describe("Drenyra chat routes", () => {
	it("rejects chat requests without tenant and user context", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request("http://localhost/api/drenyra/chat", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ message: "revisar factura" }),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.details.missingHeaders).toEqual(
			expect.arrayContaining(["x-company-id", "x-user-id"]),
		);
	});

	it("streams intent, token, result and done events", async () => {
		const app = createTestApp();
		const response = await app.handle(
			new Request(
				"http://localhost/api/drenyra/chat/stream?message=revisar%20factura&sessionId=session-fixed",
				{ headers: chatHeaders },
			),
		);
		const text = await response.text();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		expect(text).toContain("event: intent");
		expect(text).toContain('"agent":"CPE_AGENT"');
		expect(text).toContain("event: token");
		expect(text).toContain("Respuesta fiscal segura");
		expect(text).toContain("event: result");
		expect(text).toContain('"sessionId":"session-fixed"');
		expect(text).toContain("event: done");
	});
});

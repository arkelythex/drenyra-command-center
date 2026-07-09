import type { AgentContext, ApprovalRequest } from "@drenyra/pi";
import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { createApprovalStreamRoutes } from "../approval-stream.routes";

function approvalFor(context: AgentContext): ApprovalRequest {
	return {
		id: "approval-stream-001",
		toolName: "invoice_create",
		input: { documentId: "doc-1" },
		context,
		approvalLevel: "gate",
		state: "proposed",
		proposedAt: new Date("2026-05-26T10:00:00.000Z"),
		governanceResult: {
			valid: false,
			reasons: ["Requires manager approval"],
			evidenceRefs: ["ev-1"],
		},
	};
}

function createTestApp() {
	return new Elysia({ prefix: "/api/drenyra" }).use(
		createApprovalStreamRoutes({
			approvalGate: {
				getPendingApprovals(context) {
					return context ? [approvalFor(context)] : [];
				},
			},
		}),
	);
}

async function readChunk(reader: ReadableStreamDefaultReader<Uint8Array>) {
	const result = await reader.read();
	expect(result.done).toBe(false);
	return new TextDecoder().decode(result.value);
}

describe("Drenyra approval stream routes", () => {
	it("rejects blank company id after trimming", async () => {
		const response = await createTestApp().handle(
			new Request(
				"http://localhost/api/drenyra/approvals/stream?companyId=%20%20",
			),
		);
		const payload = await response.json();

		expect(response.status).toBe(400);
		expect(payload.code).toBe("TENANT_CONTEXT_REQUIRED");
		expect(payload.field).toBe("companyId");
	});

	it("emits connected and snapshot events scoped to the requested company", async () => {
		const abortController = new AbortController();
		const response = await createTestApp().handle(
			new Request(
				"http://localhost/api/drenyra/approvals/stream?companyId=company-stream-001",
				{ signal: abortController.signal },
			),
		);
		const reader = response.body?.getReader();
		expect(reader).toBeDefined();
		if (!reader) return;

		const connected = await readChunk(reader);
		const snapshot = await readChunk(reader);
		abortController.abort();
		await reader.cancel();

		expect(response.status).toBe(200);
		expect(response.headers.get("Content-Type")).toBe("text/event-stream");
		expect(connected).toContain("event: connected");
		expect(connected).toContain('"companyId":"company-stream-001"');
		expect(snapshot).toContain("event: snapshot");
		expect(snapshot).toContain('"id":"approval-stream-001"');
		expect(snapshot).toContain('"module":"invoice"');
		expect(snapshot).toContain('"ruc":""');
	});
});

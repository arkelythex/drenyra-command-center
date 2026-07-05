import { Elysia } from "elysia";
import { describe, expect, it } from "vitest";
import { InMemoryPlatformMcpAuditSink } from "./mcp.audit";
import { createPlatformMcpModule, platformMcpModule } from "./mcp.routes";

const headers = {
	"content-type": "application/json",
	"x-organization-id": "org-001",
	"x-company-id": "company-001",
	"x-company-ruc": "20100070970",
	"x-fiscal-period": "2026-05",
	"x-user-id": "user-001",
};
const auditorHeaders = { ...headers, "x-user-role": "auditor" };

function app() {
	return new Elysia().use(platformMcpModule);
}

describe("platformMcpModule", () => {
	it("exposes a read-only MCP capability manifest", async () => {
		const response = await app().handle(
			new Request("http://localhost/api/platform/mcp/manifest"),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.defaultPolicy).toBe("deny_by_default");
		expect(
			payload.data.tools.every(
				(tool: { mode: string }) => tool.mode === "read_only",
			),
		).toBe(true);
	});

	it("authorizes a scoped read-only tool with redaction", async () => {
		const response = await app().handle(
			new Request("http://localhost/api/platform/mcp/authorize", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "drenyra.brain.list_threads",
					redactionStatus: "passed",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data).toEqual({ allowed: true, reason: "ALLOWED" });
	});

	it("invokes Drenyra contract read after authorization", async () => {
		const response = await app().handle(
			new Request("http://localhost/api/platform/mcp/invoke", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "drenyra.contract.read",
					redactionStatus: "not_required",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data.sourceOfTruth).toBe("apps/api");
	});

	it("invokes injected scoped Brain list handler", async () => {
		const testApp = new Elysia().use(
			createPlatformMcpModule({
				brainRepository: {
					listThreads: async () => [{ id: "thread-001", title: "MCP thread" }],
				},
			}),
		);
		const response = await testApp.handle(
			new Request("http://localhost/api/platform/mcp/invoke", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "drenyra.brain.list_threads",
					redactionStatus: "passed",
				}),
			}),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data).toEqual([{ id: "thread-001", title: "MCP thread" }]);
	});

	it("audits authorize and invoke decisions", async () => {
		const auditSink = new InMemoryPlatformMcpAuditSink();
		const testApp = new Elysia().use(
			createPlatformMcpModule({
				auditSink,
				now: () => "2026-05-26T00:00:00.000Z",
			}),
		);
		await testApp.handle(
			new Request("http://localhost/api/platform/mcp/authorize", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "drenyra.contract.read",
					redactionStatus: "not_required",
				}),
			}),
		);
		await testApp.handle(
			new Request("http://localhost/api/platform/mcp/invoke", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "fiscal_truth.evidence.read_graph",
					redactionStatus: "failed",
				}),
			}),
		);

		await expect(auditSink.list()).resolves.toEqual([
			expect.objectContaining({
				operation: "invoke",
				outcome: "denied",
				toolName: "fiscal_truth.evidence.read_graph",
				reason: "REDACTION_FAILED",
			}),
			expect.objectContaining({
				operation: "authorize",
				outcome: "allowed",
				actorId: "user-001",
				reason: "ALLOWED",
			}),
		]);
	});

	it("audits failed invoke attempts", async () => {
		const auditSink = new InMemoryPlatformMcpAuditSink();
		const testApp = new Elysia().use(
			createPlatformMcpModule({
				auditSink,
				now: () => "2026-05-26T00:00:00.000Z",
			}),
		);
		const response = await testApp.handle(
			new Request("http://localhost/api/platform/mcp/invoke", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "fiscal_truth.evidence.read_graph",
					redactionStatus: "passed",
					arguments: {},
				}),
			}),
		);

		expect(response.status).toBe(400);
		await expect(auditSink.list()).resolves.toEqual([
			expect.objectContaining({
				operation: "invoke",
				outcome: "failed",
				reason: "MCP_INVOKE_FAILED",
			}),
		]);
	});

	it("exposes scoped MCP audit events to auditor roles", async () => {
		const auditStore = new InMemoryPlatformMcpAuditSink();
		const testApp = new Elysia().use(
			createPlatformMcpModule({
				auditSink: auditStore,
				auditReader: auditStore,
				now: () => "2026-05-26T00:00:00.000Z",
			}),
		);
		await testApp.handle(
			new Request("http://localhost/api/platform/mcp/authorize", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "drenyra.contract.read",
					redactionStatus: "not_required",
				}),
			}),
		);

		const response = await testApp.handle(
			new Request(
				"http://localhost/api/platform/mcp/audit?limit=10&outcome=allowed",
				{
					headers: auditorHeaders,
				},
			),
		);
		const payload = await response.json();

		expect(response.status).toBe(200);
		expect(payload.data).toEqual([
			expect.objectContaining({
				operation: "authorize",
				outcome: "allowed",
				toolName: "drenyra.contract.read",
			}),
		]);
	});

	it("denies MCP audit reads without an auditor role or valid fiscal scope", async () => {
		const auditStore = new InMemoryPlatformMcpAuditSink();
		const testApp = new Elysia().use(
			createPlatformMcpModule({
				auditSink: auditStore,
				auditReader: auditStore,
			}),
		);

		const roleResponse = await testApp.handle(
			new Request("http://localhost/api/platform/mcp/audit", { headers }),
		);
		const scopeResponse = await testApp.handle(
			new Request("http://localhost/api/platform/mcp/audit", {
				headers: { ...auditorHeaders, "x-company-ruc": "20100070971" },
			}),
		);

		expect(roleResponse.status).toBe(403);
		expect(scopeResponse.status).toBe(403);
	});

	it("denies invalid RUC or redaction failure", async () => {
		const invalidRucResponse = await app().handle(
			new Request("http://localhost/api/platform/mcp/authorize", {
				method: "POST",
				headers: { ...headers, "x-company-ruc": "20100070971" },
				body: JSON.stringify({
					toolName: "drenyra.contract.read",
					redactionStatus: "not_required",
				}),
			}),
		);
		const redactionResponse = await app().handle(
			new Request("http://localhost/api/platform/mcp/authorize", {
				method: "POST",
				headers,
				body: JSON.stringify({
					toolName: "fiscal_truth.evidence.read_graph",
					redactionStatus: "failed",
				}),
			}),
		);

		expect(invalidRucResponse.status).toBe(403);
		expect(redactionResponse.status).toBe(403);
	});
});

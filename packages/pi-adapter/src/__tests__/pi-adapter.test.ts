import { describe, expect, it, vi } from "vitest";
import { PiAgentRuntimeAdapter } from "../pi-adapter";

describe("PiAgentRuntimeAdapter", () => {
	it("should create a session handle", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const handle = await adapter.createSession({
			goal: "test goal",
			context: {
				tenantId: "tenant-1",
				userId: "user-1",
				organizationId: "org-1",
				companyId: "comp-1",
				ruc: "20123456789",
				traceId: "trace-1",
			},
		});

		expect(handle.sessionId).toBeDefined();
		expect(handle.createdAt).toBeInstanceOf(Date);
	});

	it("should get session status", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const handle = await adapter.createSession({
			goal: "test",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		const status = await adapter.getSession(handle.sessionId);
		expect(status).not.toBeNull();
		expect(status!.status).toBeDefined();
	});

	it("should return null for unknown sessions", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const status = await adapter.getSession("nonexistent");
		expect(status).toBeNull();
	});

	it("should abort and cleanup a session", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const handle = await adapter.createSession({
			goal: "test",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		await adapter.abort(handle.sessionId);
		const status = await adapter.getSession(handle.sessionId);
		expect(status).toBeNull();
	});

	it("should subscribe and unsubscribe from events", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const handle = await adapter.createSession({
			goal: "test",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		const listener = vi.fn();
		const unsubscribe = adapter.subscribe(handle.sessionId, listener);

		expect(unsubscribe).toBeTypeOf("function");
		unsubscribe();
	});

	it("should fork a session", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		const parent = await adapter.createSession({
			goal: "parent",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		const child = await adapter.fork({
			sourceSessionId: parent.sessionId,
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		expect(child.sessionId).toBeDefined();
		expect(child.sessionId).not.toBe(parent.sessionId);
	});

	it("should throw on subscribe for unknown sessions", () => {
		const adapter = new PiAgentRuntimeAdapter();
		expect(() => adapter.subscribe("nonexistent", () => {})).toThrow(
			"Session not found",
		);
	});

	it("should throw on prompt for unknown sessions", async () => {
		const adapter = new PiAgentRuntimeAdapter();
		await expect(
			adapter.prompt("nonexistent", {
				text: "hello",
				context: {
					tenantId: "t-1",
					userId: "u-1",
					organizationId: "o-1",
					companyId: "c-1",
					ruc: "20123456789",
					traceId: "t-1",
				},
			}),
		).rejects.toThrow("Session not found");
	});
});

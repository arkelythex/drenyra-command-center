import { describe, expect, it } from "vitest";
import { ShadowRunner } from "../shadow-runner";

// Re-expose MockAgentRuntime for shadow testing
// It's defined inline in port-contract.test.ts, so we create a minimal one here
class SimpleMockRuntime {
	private sessions = new Map<
		string,
		{ status: string; messageCount: number }
	>();

	async createSession(_request: {
		goal: string;
		context: Record<string, string>;
	}) {
		const sessionId = `mock-${this.sessions.size + 1}`;
		this.sessions.set(sessionId, { status: "idle", messageCount: 0 });
		return { sessionId, createdAt: new Date() };
	}

	async prompt(_sessionId: string, _input: unknown) {
		// no-op
	}

	subscribe(_sessionId: string, _listener: unknown) {
		return () => {};
	}

	async fork(_request: {
		sourceSessionId: string;
		context: Record<string, string>;
	}) {
		return { sessionId: `fork-${Date.now()}`, createdAt: new Date() };
	}

	async abort(_sessionId: string) {
		// no-op
	}

	async getSession(sessionId: string) {
		return this.sessions.get(sessionId) ?? null;
	}
}

class FailingMockRuntime {
	async createSession() {
		throw new Error("Pi runtime unavailable");
	}
	async prompt() {
		throw new Error("not supported");
	}
	subscribe() {
		return () => {};
	}
	async fork() {
		throw new Error("not supported");
	}
	async abort() {}
	async getSession() {
		return null;
	}
}

describe("ShadowRunner", () => {
	it("should compare two successful session creations", async () => {
		const legacy = new SimpleMockRuntime() as any;
		const pi = new SimpleMockRuntime() as any;
		const shadow = new ShadowRunner(legacy, pi);

		const result = await shadow.createSession({
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

		expect(result.legacy.success).toBe(true);
		expect(result.pi.success).toBe(true);
		expect(result.match).toBe(true);
		expect(result.legacy.durationMs).toBeGreaterThanOrEqual(0);
	});

	it("should detect mismatch when Pi fails", async () => {
		const legacy = new SimpleMockRuntime() as any;
		const pi = new FailingMockRuntime() as any;
		const shadow = new ShadowRunner(legacy, pi);

		const result = await shadow.createSession({
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

		expect(result.legacy.success).toBe(true);
		expect(result.pi.success).toBe(false);
		expect(result.match).toBe(false);
		expect(result.pi.error).toContain("Pi runtime unavailable");
	});

	it("should compare prompt behavior", async () => {
		const legacy = new SimpleMockRuntime() as any;
		const pi = new SimpleMockRuntime() as any;
		const shadow = new ShadowRunner(legacy, pi);

		const result = await shadow.comparePrompt("session-1", {
			text: "analyze",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		expect(result.match).toBe(true);
	});

	it("should compare abort behavior", async () => {
		const legacy = new SimpleMockRuntime() as any;
		const pi = new SimpleMockRuntime() as any;
		const shadow = new ShadowRunner(legacy, pi);

		const result = await shadow.compareAbort("session-1");
		expect(result.match).toBe(true);
	});
});

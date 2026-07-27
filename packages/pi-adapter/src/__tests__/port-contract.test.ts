import { describe, expect, it } from "vitest";
import type { AgentRuntimePort } from "../port";
import type {
	SessionHandle,
	FiscalPrompt,
	RuntimeEvent,
	RuntimeEventListener,
	CreateSessionRequest,
	ForkSessionRequest,
	Unsubscribe,
} from "../port";

/**
 * In-memory mock of AgentRuntimePort for testing.
 * Does not require Pi SDK or any real runtime.
 */
class MockAgentRuntime implements AgentRuntimePort {
	private sessions = new Map<
		string,
		{ status: string; messageCount: number }
	>();
	private listeners = new Map<string, Set<RuntimeEventListener>>();

	async createSession(_request: CreateSessionRequest): Promise<SessionHandle> {
		const sessionId = `mock-session-${this.sessions.size + 1}`;
		this.sessions.set(sessionId, { status: "idle", messageCount: 0 });
		return { sessionId, createdAt: new Date() };
	}

	async prompt(sessionId: string, _input: FiscalPrompt): Promise<void> {
		const session = this.sessions.get(sessionId);
		if (!session) throw new Error(`Session not found: ${sessionId}`);
		session.messageCount++;
	}

	subscribe(sessionId: string, listener: RuntimeEventListener): Unsubscribe {
		if (!this.sessions.has(sessionId)) {
			throw new Error(`Session not found: ${sessionId}`);
		}
		if (!this.listeners.has(sessionId)) {
			this.listeners.set(sessionId, new Set());
		}
		this.listeners.get(sessionId)!.add(listener);
		return () => {
			this.listeners.get(sessionId)?.delete(listener);
		};
	}

	async fork(request: ForkSessionRequest): Promise<SessionHandle> {
		if (!this.sessions.has(request.sourceSessionId)) {
			throw new Error(`Source session not found: ${request.sourceSessionId}`);
		}
		const sessionId = `mock-fork-${this.sessions.size + 1}`;
		this.sessions.set(sessionId, { status: "idle", messageCount: 0 });
		return { sessionId, createdAt: new Date() };
	}

	async abort(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
		this.listeners.delete(sessionId);
	}

	async getSession(
		sessionId: string,
	): Promise<{ status: string; messageCount: number } | null> {
		return this.sessions.get(sessionId) ?? null;
	}

	/** Test helper: emit an event to all listeners of a session */
	emitEvent(sessionId: string, event: RuntimeEvent): void {
		this.listeners.get(sessionId)?.forEach((l) => {
			l(event);
		});
	}
}

describe("AgentRuntimePort — contract parity", () => {
	it("should create a session and return a handle", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		expect(handle.sessionId).toBeDefined();
		expect(handle.createdAt).toBeInstanceOf(Date);
	});

	it("should get session status", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		const status = await runtime.getSession(handle.sessionId);
		expect(status).not.toBeNull();
		expect(status!.status).toBe("idle");
		expect(status!.messageCount).toBe(0);
	});

	it("should return null for unknown session", async () => {
		const runtime = new MockAgentRuntime();
		expect(await runtime.getSession("unknown")).toBeNull();
	});

	it("should increment message count on prompt", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		await runtime.prompt(handle.sessionId, {
			text: "hello",
			context: {
				tenantId: "t-1",
				userId: "u-1",
				organizationId: "o-1",
				companyId: "c-1",
				ruc: "20123456789",
				traceId: "t-1",
			},
		});

		const status = await runtime.getSession(handle.sessionId);
		expect(status!.messageCount).toBe(1);
	});

	it("should subscribe and receive events", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		const events: RuntimeEvent[] = [];
		runtime.subscribe(handle.sessionId, (e) => events.push(e));

		(runtime as MockAgentRuntime).emitEvent(handle.sessionId, {
			type: "message_delta",
			sessionId: handle.sessionId,
			timestamp: new Date(),
			payload: { delta: "hello" },
		});

		expect(events).toHaveLength(1);
		expect(events[0].type).toBe("message_delta");
	});

	it("should unsubscribe from events", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		const events: RuntimeEvent[] = [];
		const unsub = runtime.subscribe(handle.sessionId, (e) => events.push(e));
		unsub();

		(runtime as MockAgentRuntime).emitEvent(handle.sessionId, {
			type: "message_delta",
			sessionId: handle.sessionId,
			timestamp: new Date(),
			payload: {},
		});

		expect(events).toHaveLength(0);
	});

	it("should fork a session from a parent", async () => {
		const runtime = new MockAgentRuntime();
		const parent = await runtime.createSession({
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

		const child = await runtime.fork({
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

		expect(child.sessionId).not.toBe(parent.sessionId);
	});

	it("should abort and remove a session", async () => {
		const runtime = new MockAgentRuntime();
		const handle = await runtime.createSession({
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

		await runtime.abort(handle.sessionId);
		expect(await runtime.getSession(handle.sessionId)).toBeNull();
	});

	it("should throw on prompt for unknown session", async () => {
		const runtime = new MockAgentRuntime();
		await expect(
			runtime.prompt("unknown", {
				text: "hi",
				context: {
					tenantId: "t-1",
					userId: "u-1",
					organizationId: "o-1",
					companyId: "c-1",
					ruc: "20123456789",
					traceId: "t-1",
				},
			}),
		).rejects.toThrow("not found");
	});

	it("should throw on subscribe for unknown session", () => {
		const runtime = new MockAgentRuntime();
		expect(() => runtime.subscribe("unknown", () => {})).toThrow("not found");
	});
});

import { describe, expect, it, vi } from "vitest";
import { PiAgentRuntimeAdapter } from "../pi-adapter";

/** Minimal stand-in for the Pi SDK session surface the adapter uses. */
function fakeSession(id = "s1") {
	const listeners: Array<(e: { type: string }) => void> = [];
	return {
		sessionId: id,
		isStreaming: false,
		messages: [1, 2, 3],
		prompt: vi.fn(async () => {}),
		subscribe: vi.fn((l: (e: { type: string }) => void) => {
			listeners.push(l);
			return () => listeners.splice(listeners.indexOf(l), 1);
		}),
		abort: vi.fn(async () => {}),
		dispose: vi.fn(),
		emit: (e: { type: string }) => {
			for (const l of listeners) l(e);
		},
	};
}

function sdkWith(sessions: ReturnType<typeof fakeSession>[]) {
	const createAgentSession = vi.fn(async () => ({ session: sessions.shift() }));
	return { createAgentSession, SessionManager: { inMemory: () => "mem" } };
}

const req = { workspaceId: "w1" } as never;

describe("PiAgentRuntimeAdapter", () => {
	it("explains how to fix a missing Pi SDK instead of a bare module error", async () => {
		// The SDK is an optional runtime dependency and is not installed in this repo.
		const adapter = new PiAgentRuntimeAdapter();
		await expect(adapter.createSession(req)).rejects.toThrow(
			/Install @earendil-works\/pi-coding-agent/,
		);
	});

	it("creates a session through the SDK in memory with read-only tools", async () => {
		const s = fakeSession();
		const sdk = sdkWith([s]);
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdk as never,
		});
		const handle = await adapter.createSession(req);
		expect(handle.sessionId).toBe("s1");
		expect(sdk.createAgentSession).toHaveBeenCalledWith({
			sessionManager: "mem",
			tools: ["read", "bash", "grep", "find", "ls"],
		});
	});

	it("forwards prompts and rejects unknown sessions", async () => {
		const s = fakeSession();
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdkWith([s]) as never,
		});
		const { sessionId } = await adapter.createSession(req);
		await adapter.prompt(sessionId, { text: "hola" } as never);
		expect(s.prompt).toHaveBeenCalledWith("hola");
		await expect(
			adapter.prompt("nope", { text: "x" } as never),
		).rejects.toThrow("Session not found: nope");
	});

	it("maps Pi events to runtime events and drops unknown ones", async () => {
		const s = fakeSession();
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdkWith([s]) as never,
		});
		const { sessionId } = await adapter.createSession(req);
		const got: Array<{ type: string; sessionId: string }> = [];
		adapter.subscribe(sessionId, (e) =>
			got.push({ type: e.type, sessionId: e.sessionId }),
		);
		s.emit({ type: "message_update" });
		s.emit({ type: "turn_end" });
		s.emit({ type: "something_else" });
		expect(got).toEqual([
			{ type: "message_delta", sessionId: "s1" },
			{ type: "turn_end", sessionId: "s1" },
		]);
	});

	it("reports status and message count, and null for unknown sessions", async () => {
		const s = fakeSession();
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdkWith([s]) as never,
		});
		const { sessionId } = await adapter.createSession(req);
		expect(await adapter.getSession(sessionId)).toEqual({
			status: "idle",
			messageCount: 3,
		});
		s.isStreaming = true;
		expect(await adapter.getSession(sessionId)).toEqual({
			status: "streaming",
			messageCount: 3,
		});
		expect(await adapter.getSession("nope")).toBeNull();
	});

	it("abort disposes and forgets the session", async () => {
		const s = fakeSession();
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdkWith([s]) as never,
		});
		const { sessionId } = await adapter.createSession(req);
		await adapter.abort(sessionId);
		expect(s.abort).toHaveBeenCalled();
		expect(s.dispose).toHaveBeenCalled();
		expect(await adapter.getSession(sessionId)).toBeNull();
	});

	it("fork creates a new session and requires an existing source", async () => {
		const a = fakeSession("a");
		const b = fakeSession("b");
		const sdk = sdkWith([a, b]);
		const adapter = new PiAgentRuntimeAdapter({
			loadSdk: async () => sdk as never,
		});
		const src = await adapter.createSession(req);
		const forked = await adapter.fork({
			sourceSessionId: src.sessionId,
		} as never);
		expect(forked.sessionId).toBe("b");
		await expect(
			adapter.fork({ sourceSessionId: "nope" } as never),
		).rejects.toThrow("Source session not found: nope");
	});
});

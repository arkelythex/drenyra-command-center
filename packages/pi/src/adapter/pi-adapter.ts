/**
 * PiAgentRuntimeAdapter — Pi SDK implementation of AgentRuntimePort.
 *
 * Wraps @earendil-works/pi-coding-agent to provide Drenyra's
 * fiscal agent runtime. Each session maps to a Pi AgentSession.
 */

import type { AgentSession } from "@earendil-works/pi-coding-agent";
import type {
	AgentRuntimePort,
	SessionHandle,
	FiscalPrompt,
	RuntimeEvent,
	RuntimeEventType,
	RuntimeEventListener,
	CreateSessionRequest,
	ForkSessionRequest,
	Unsubscribe,
} from "./port";

/** Internal handle wrapping a Pi AgentSession */
interface PiSessionHandle {
	session: AgentSession;
	createdAt: Date;
}

/**
 * PiAgentRuntimeAdapter adapts Pi SDK sessions to Drenyra's
 * AgentRuntimePort hexagonal port.
 */
export class PiAgentRuntimeAdapter implements AgentRuntimePort {
	private sessions = new Map<string, PiSessionHandle>();

	async createSession(_request: CreateSessionRequest): Promise<SessionHandle> {
		const { createAgentSession, SessionManager } = await import(
			"@earendil-works/pi-coding-agent"
		);

		const { session } = await createAgentSession({
			sessionManager: SessionManager.inMemory(),
			tools: ["read", "bash", "grep", "find", "ls"],
		});

		const handle: PiSessionHandle = { session, createdAt: new Date() };
		this.sessions.set(session.sessionId, handle);

		return {
			sessionId: session.sessionId,
			createdAt: handle.createdAt,
		};
	}

	async prompt(sessionId: string, input: FiscalPrompt): Promise<void> {
		const handle = this.sessions.get(sessionId);
		if (!handle) {
			throw new Error(`Session not found: ${sessionId}`);
		}
		await handle.session.prompt(input.text);
	}

	subscribe(sessionId: string, listener: RuntimeEventListener): Unsubscribe {
		const handle = this.sessions.get(sessionId);
		if (!handle) {
			throw new Error(`Session not found: ${sessionId}`);
		}

		return handle.session.subscribe((piEvent: { type: string }) => {
			const mapped = this.mapPiEvent(piEvent, sessionId);
			if (mapped) listener(mapped);
		});
	}

	async fork(request: ForkSessionRequest): Promise<SessionHandle> {
		const source = this.sessions.get(request.sourceSessionId);
		if (!source) {
			throw new Error(`Source session not found: ${request.sourceSessionId}`);
		}

		const { createAgentSession, SessionManager } = await import(
			"@earendil-works/pi-coding-agent"
		);

		const { session } = await createAgentSession({
			sessionManager: SessionManager.inMemory(),
		});

		const handle: PiSessionHandle = { session, createdAt: new Date() };
		this.sessions.set(session.sessionId, handle);

		return {
			sessionId: session.sessionId,
			createdAt: handle.createdAt,
		};
	}

	async abort(sessionId: string): Promise<void> {
		const handle = this.sessions.get(sessionId);
		if (handle) {
			await handle.session.abort();
			handle.session.dispose();
			this.sessions.delete(sessionId);
		}
	}

	async getSession(
		sessionId: string,
	): Promise<{ status: string; messageCount: number } | null> {
		const handle = this.sessions.get(sessionId);
		if (!handle) return null;

		return {
			status: handle.session.isStreaming ? "streaming" : "idle",
			messageCount: handle.session.messages.length,
		};
	}

	// ─── Event mapping ───────────────────────────────────

	private mapPiEvent(
		piEvent: { type: string },
		sessionId: string,
	): RuntimeEvent | null {
		const typeMap: Record<string, RuntimeEventType> = {
			message_update: "message_delta",
			tool_execution_start: "tool_execution_start",
			tool_execution_end: "tool_execution_end",
			turn_start: "turn_start",
			turn_end: "turn_end",
			agent_start: "agent_start",
			agent_end: "agent_end",
		};

		const mappedType = typeMap[piEvent.type];
		if (!mappedType) return null;

		return {
			type: mappedType,
			sessionId,
			timestamp: new Date(),
			payload: piEvent,
		};
	}
}

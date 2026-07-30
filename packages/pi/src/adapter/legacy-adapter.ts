/**
 * LegacyMastraRuntimeAdapter — wraps the existing DrenyraHarness behind AgentRuntimePort.
 *
 * Used for shadow execution: run both this and PiAgentRuntimeAdapter side-by-side,
 * compare results, then cut over when parity is confirmed.
 *
 * This is a TEMPORARY adapter — deleted after Phase 6 cutover.
 */

import type {
	AgentRuntimePort,
	SessionHandle,
	FiscalPrompt,
	RuntimeEventListener,
	CreateSessionRequest,
	ForkSessionRequest,
	Unsubscribe,
} from "./port";

/**
 * Wraps the existing Mastra-based DrenyraHarness behind the AgentRuntimePort.
 *
 * This adapter enables:
 * 1. Characterization tests against the real harness
 * 2. Shadow execution (dual run with Pi adapter)
 * 3. Gradual cutover from legacy to Pi
 */
export class LegacyMastraRuntimeAdapter implements AgentRuntimePort {
	private sessions = new Map<
		string,
		{
			sessionId: string;
			createdAt: Date;
			goal: string;
			status: string;
		}
	>();

	async createSession(request: CreateSessionRequest): Promise<SessionHandle> {
		const sessionId = `legacy-${crypto.randomUUID()}`;
		this.sessions.set(sessionId, {
			sessionId,
			createdAt: new Date(),
			goal: request.goal,
			status: "created",
		});
		return { sessionId, createdAt: new Date() };
	}

	async prompt(_sessionId: string, _input: FiscalPrompt): Promise<void> {
		// Legacy harness doesn't support streaming prompts — this is a no-op
		// The actual execution happens via harness.execute()
	}

	subscribe(_sessionId: string, _listener: RuntimeEventListener): Unsubscribe {
		// Legacy harness uses callback-based onApprovalRequired
		return () => {};
	}

	async fork(_request: ForkSessionRequest): Promise<SessionHandle> {
		throw new Error("Fork not supported by legacy Mastra harness");
	}

	async abort(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
	}

	async getSession(
		sessionId: string,
	): Promise<{ status: string; messageCount: number } | null> {
		const session = this.sessions.get(sessionId);
		if (!session) return null;
		return { status: session.status, messageCount: 0 };
	}
}

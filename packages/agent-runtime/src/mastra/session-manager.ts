import type { AgentContext, AgentSession } from "../types/erp-types";

/**
 * Manages workflow sessions.
 * Tracks state across multi-step domain operations.
 */
export class SessionManager {
	private readonly sessions = new Map<string, AgentSession>();
	private readonly ttlMs: number;

	constructor(ttlMs = 30 * 60 * 1000) {
		// Default: 30min TTL
		this.ttlMs = ttlMs;
	}

	create(goal: string, context: AgentContext): AgentSession {
		const session: AgentSession = {
			id: crypto.randomUUID(),
			goal,
			context,
			activeAgent: "drenyra",
			startedAt: new Date(),
			lastActivityAt: new Date(),
			status: "active",
			steps: [],
			metadata: {},
			history: [],
		};

		this.sessions.set(session.id, session);
		return session;
	}

	get(id: string): AgentSession | undefined {
		const session = this.sessions.get(id);
		if (!session) return undefined;

		// Check TTL
		const elapsed = Date.now() - session.lastActivityAt.getTime();
		if (elapsed > this.ttlMs) {
			this.sessions.set(id, { ...session, status: "timeout" });
			return this.sessions.get(id);
		}

		return session;
	}

	update(id: string, partial: Partial<AgentSession>): void {
		const existing = this.sessions.get(id);
		if (existing) {
			this.sessions.set(id, {
				...existing,
				...partial,
				lastActivityAt: new Date(),
			});
		}
	}

	addStep(sessionId: string, domain: string): string | undefined {
		const session = this.sessions.get(sessionId);
		if (!session) return undefined;

		const stepId = `${sessionId}-${domain}-${session.steps.length + 1}`;
		session.steps.push({
			id: stepId,
			domain,
			status: "pending",
		});
		session.lastActivityAt = new Date();

		return stepId;
	}

	updateStep(
		sessionId: string,
		stepId: string,
		partial: Partial<AgentSession["steps"][0]>,
	): void {
		const session = this.sessions.get(sessionId);
		if (!session) return;

		const step = session.steps.find((s) => s.id === stepId);
		if (step) {
			Object.assign(step, partial);
			session.lastActivityAt = new Date();

			// Auto-mark session completed if all steps done
			const allDone = session.steps.every(
				(s) => s.status === "completed" || s.status === "failed",
			);
			if (allDone) {
				const hasFailures = session.steps.some((s) => s.status === "failed");
				session.status = hasFailures ? "failed" : "completed";
			}
		}
	}

	/** List all sessions */
	listAll(): AgentSession[] {
		return Array.from(this.sessions.values());
	}

	/** Clean up expired sessions */
	cleanup(): number {
		const now = Date.now();
		let count = 0;

		for (const [id, session] of this.sessions) {
			if (now - session.lastActivityAt.getTime() > this.ttlMs) {
				this.sessions.set(id, { ...session, status: "timeout" });
				count++;
			}
		}

		return count;
	}

	/** Get active sessions for observability */
	getActiveSessions(): AgentSession[] {
		return Array.from(this.sessions.values()).filter(
			(s) => s.status === "active",
		);
	}
}

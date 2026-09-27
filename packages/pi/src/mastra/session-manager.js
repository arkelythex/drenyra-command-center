export class SessionManager {
    sessions = new Map();
    ttlMs;
    constructor(ttlMs = 30 * 60 * 1000) {
        this.ttlMs = ttlMs;
    }
    create(goal, context) {
        const session = {
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
    get(id) {
        const session = this.sessions.get(id);
        if (!session)
            return undefined;
        const elapsed = Date.now() - session.lastActivityAt.getTime();
        if (elapsed > this.ttlMs) {
            this.sessions.set(id, { ...session, status: "timeout" });
            return this.sessions.get(id);
        }
        return session;
    }
    update(id, partial) {
        const existing = this.sessions.get(id);
        if (existing) {
            this.sessions.set(id, {
                ...existing,
                ...partial,
                lastActivityAt: new Date(),
            });
        }
    }
    addStep(sessionId, domain) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return undefined;
        const stepId = `${sessionId}-${domain}-${session.steps.length + 1}`;
        session.steps.push({
            id: stepId,
            domain,
            status: "pending",
        });
        session.lastActivityAt = new Date();
        return stepId;
    }
    updateStep(sessionId, stepId, partial) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const step = session.steps.find((s) => s.id === stepId);
        if (step) {
            Object.assign(step, partial);
            session.lastActivityAt = new Date();
            const allDone = session.steps.every((s) => s.status === "completed" || s.status === "failed");
            if (allDone) {
                const hasFailures = session.steps.some((s) => s.status === "failed");
                session.status = hasFailures ? "failed" : "completed";
            }
        }
    }
    listAll() {
        return Array.from(this.sessions.values());
    }
    cleanup() {
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
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter((s) => s.status === "active");
    }
}
//# sourceMappingURL=session-manager.js.map
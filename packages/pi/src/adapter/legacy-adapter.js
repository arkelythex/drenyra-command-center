export class LegacyMastraRuntimeAdapter {
    sessions = new Map();
    async createSession(request) {
        const sessionId = `legacy-${crypto.randomUUID()}`;
        this.sessions.set(sessionId, {
            sessionId,
            createdAt: new Date(),
            goal: request.goal,
            status: "created",
        });
        return { sessionId, createdAt: new Date() };
    }
    async prompt(_sessionId, _input) {
    }
    subscribe(_sessionId, _listener) {
        return () => { };
    }
    async fork(_request) {
        throw new Error("Fork not supported by legacy Mastra harness");
    }
    async abort(sessionId) {
        this.sessions.delete(sessionId);
    }
    async getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return null;
        return { status: session.status, messageCount: 0 };
    }
}
//# sourceMappingURL=legacy-adapter.js.map
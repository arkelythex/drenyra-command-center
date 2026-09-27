export class PiAgentRuntimeAdapter {
    sessions = new Map();
    async createSession(_request) {
        const { createAgentSession, SessionManager } = await import("@earendil-works/pi-coding-agent");
        const { session } = await createAgentSession({
            sessionManager: SessionManager.inMemory(),
            tools: ["read", "bash", "grep", "find", "ls"],
        });
        const handle = { session, createdAt: new Date() };
        this.sessions.set(session.sessionId, handle);
        return {
            sessionId: session.sessionId,
            createdAt: handle.createdAt,
        };
    }
    async prompt(sessionId, input) {
        const handle = this.sessions.get(sessionId);
        if (!handle) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        await handle.session.prompt(input.text);
    }
    subscribe(sessionId, listener) {
        const handle = this.sessions.get(sessionId);
        if (!handle) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        return handle.session.subscribe((piEvent) => {
            const mapped = this.mapPiEvent(piEvent, sessionId);
            if (mapped)
                listener(mapped);
        });
    }
    async fork(request) {
        const source = this.sessions.get(request.sourceSessionId);
        if (!source) {
            throw new Error(`Source session not found: ${request.sourceSessionId}`);
        }
        const { createAgentSession, SessionManager } = await import("@earendil-works/pi-coding-agent");
        const { session } = await createAgentSession({
            sessionManager: SessionManager.inMemory(),
        });
        const handle = { session, createdAt: new Date() };
        this.sessions.set(session.sessionId, handle);
        return {
            sessionId: session.sessionId,
            createdAt: handle.createdAt,
        };
    }
    async abort(sessionId) {
        const handle = this.sessions.get(sessionId);
        if (handle) {
            await handle.session.abort();
            handle.session.dispose();
            this.sessions.delete(sessionId);
        }
    }
    async getSession(sessionId) {
        const handle = this.sessions.get(sessionId);
        if (!handle)
            return null;
        return {
            status: handle.session.isStreaming ? "streaming" : "idle",
            messageCount: handle.session.messages.length,
        };
    }
    mapPiEvent(piEvent, sessionId) {
        const typeMap = {
            message_update: "message_delta",
            tool_execution_start: "tool_execution_start",
            tool_execution_end: "tool_execution_end",
            turn_start: "turn_start",
            turn_end: "turn_end",
            agent_start: "agent_start",
            agent_end: "agent_end",
        };
        const mappedType = typeMap[piEvent.type];
        if (!mappedType)
            return null;
        return {
            type: mappedType,
            sessionId,
            timestamp: new Date(),
            payload: piEvent,
        };
    }
}
//# sourceMappingURL=pi-adapter.js.map
export class AgentEventBus {
    handlers = new Map();
    wildcardHandlers = new Set();
    async connect() {
    }
    async disconnect() {
        this.handlers.clear();
        this.wildcardHandlers.clear();
    }
    async publish(eventType, payload, context, metadata) {
        const event = {
            id: crypto.randomUUID(),
            type: eventType,
            payload,
            context,
            timestamp: new Date(),
            correlationId: metadata?.correlationId ?? crypto.randomUUID(),
            causationId: metadata?.causationId,
            source: metadata?.source ?? "drenyra-orchestrator",
        };
        const specificHandlers = this.handlers.get(eventType);
        if (specificHandlers) {
            const promises = [];
            for (const handler of specificHandlers) {
                const result = handler(event);
                if (result instanceof Promise)
                    promises.push(result);
            }
            await Promise.allSettled(promises);
        }
        if (this.wildcardHandlers.size > 0) {
            const promises = [];
            for (const handler of this.wildcardHandlers) {
                const result = handler(event);
                if (result instanceof Promise)
                    promises.push(result);
            }
            await Promise.allSettled(promises);
        }
    }
    async subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, new Set());
        }
        this.handlers.get(eventType).add(handler);
        return () => {
            this.handlers
                .get(eventType)
                ?.delete(handler);
        };
    }
    async subscribeMultiple(eventTypes, handler) {
        const unsubscribers = await Promise.all(eventTypes.map((type) => this.subscribe(type, handler)));
        return () => {
            for (const unsub of unsubscribers) {
                unsub();
            }
        };
    }
    subscribeAll(handler) {
        this.wildcardHandlers.add(handler);
        return () => {
            this.wildcardHandlers.delete(handler);
        };
    }
    isHealthy() {
        return true;
    }
    getEventTypes() {
        return Array.from(this.handlers.keys());
    }
}
//# sourceMappingURL=event-bus.js.map
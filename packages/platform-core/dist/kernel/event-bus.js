export class EventBus {
    handlers = new Map();
    onceHandlers = new Map();
    on(type, handler) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type).add(handler);
    }
    once(type, handler) {
        if (!this.onceHandlers.has(type)) {
            this.onceHandlers.set(type, new Set());
        }
        this.onceHandlers.get(type).add(handler);
    }
    off(type, handler) {
        this.handlers.get(type)?.delete(handler);
        this.onceHandlers.get(type)?.delete(handler);
    }
    emit(type, payload) {
        const envelope = {
            type,
            payload,
            timestamp: new Date().toISOString(),
        };
        this.dispatch(type, envelope);
        this.dispatch("*", envelope);
        this.onceHandlers.delete(type);
    }
    removeAllListeners(type) {
        this.handlers.delete(type);
        this.onceHandlers.delete(type);
    }
    dispatch(type, envelope) {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            for (const handler of typeHandlers) {
                try {
                    handler(envelope);
                }
                catch {
                }
            }
        }
        const onceHandlers = this.onceHandlers.get(type);
        if (onceHandlers) {
            for (const handler of onceHandlers) {
                try {
                    handler(envelope);
                }
                catch {
                }
            }
        }
    }
}
//# sourceMappingURL=event-bus.js.map
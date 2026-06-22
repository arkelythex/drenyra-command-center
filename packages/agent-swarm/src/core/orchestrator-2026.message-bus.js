import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { EventEmitter } from "events";
export class MessageBus {
    subscribers = new Map();
    eventEmitter = new EventEmitter();
    subscribe(agentId, handler) {
        if (!this.subscribers.has(agentId))
            this.subscribers.set(agentId, []);
        this.subscribers.get(agentId).push(handler);
    }
    publish(topic, message) {
        this.eventEmitter.emit(topic, message);
        const handlers = this.subscribers.get(topic);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(message);
                }
                catch {
                    SecureLogger.error("Message handler error:", { topic });
                }
            });
        }
    }
    async route(fromAgent, toAgent, message) {
        this.publish(`agent:${toAgent}`, {
            from: fromAgent,
            to: toAgent,
            data: message,
            timestamp: new Date(),
        });
    }
}
//# sourceMappingURL=orchestrator-2026.message-bus.js.map
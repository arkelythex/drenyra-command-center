export const VALID_TRANSITIONS = {
    idle: ["busy", "offline"],
    busy: ["completed", "error", "idle"],
    completed: ["idle"],
    error: ["idle"],
    offline: ["idle"],
};
function isValidStatus(value) {
    return ["idle", "busy", "error", "completed", "offline"].includes(value);
}
export class AgentLifecycleManager {
    current;
    options;
    constructor(initialStatus = "idle", options = {}) {
        if (!isValidStatus(initialStatus)) {
            throw new Error(`Invalid initial status: ${initialStatus}`);
        }
        this.current = initialStatus;
        this.options = options;
    }
    getStatus() {
        return this.current;
    }
    transitionTo(target) {
        const allowed = VALID_TRANSITIONS[this.current];
        if (!allowed.includes(target)) {
            const message = `Invalid transition from ${this.current} to ${target}`;
            this.options.onError?.(message);
            throw new Error(message);
        }
        const from = this.current;
        this.current = target;
        this.options.onTransition?.({
            from,
            to: target,
            timestamp: new Date().toISOString(),
        });
    }
}
//# sourceMappingURL=lifecycle.js.map
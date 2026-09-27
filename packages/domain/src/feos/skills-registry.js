import { generateId, nowTimestamp } from "./types";
export class Automation {
    props;
    constructor(props) {
        this.props = props;
        Object.freeze(this);
    }
    static create(input) {
        const now = nowTimestamp();
        return new Automation({
            id: generateId(),
            name: input.name,
            description: input.description,
            skillId: input.skillId,
            trigger: input.trigger,
            status: "active",
            riskLevel: input.riskLevel,
            scope: input.scope,
            createdBy: input.createdBy,
            params: input.params,
            notifyOnFailure: input.notifyOnFailure,
            maxRetries: input.maxRetries ?? 3,
            createdAt: now,
            updatedAt: now,
        });
    }
    static fromProps(props) {
        return new Automation(props);
    }
    get id() { return this.props.id; }
    get name() { return this.props.name; }
    get status() { return this.props.status; }
    get skillId() { return this.props.skillId; }
    get trigger() { return this.props.trigger; }
    get lastExecutedAt() { return this.props.lastExecutedAt; }
    get lastError() { return this.props.lastError; }
    pause() {
        return new Automation({ ...this.props, status: "paused", updatedAt: nowTimestamp() });
    }
    activate() {
        return new Automation({ ...this.props, status: "active", updatedAt: nowTimestamp() });
    }
    disable() {
        return new Automation({ ...this.props, status: "disabled", updatedAt: nowTimestamp() });
    }
    recordExecution() {
        return new Automation({
            ...this.props,
            lastExecutedAt: nowTimestamp(),
            lastError: undefined,
            updatedAt: nowTimestamp(),
        });
    }
    recordError(error) {
        return new Automation({
            ...this.props,
            status: "error",
            lastError: error,
            updatedAt: nowTimestamp(),
        });
    }
    toProps() {
        return { ...this.props };
    }
}
//# sourceMappingURL=skills-registry.js.map
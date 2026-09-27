export class AgenticOSError extends Error {
    name = "AgenticOSError";
    constructor(message) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}
export class PluginValidationError extends AgenticOSError {
    name = "PluginValidationError";
    pluginName;
    constructor(message, pluginName) {
        super(message);
        this.pluginName = pluginName;
    }
}
export class AgentError extends AgenticOSError {
    name = "AgentError";
    agentId;
    cause;
    constructor(message, agentId, cause) {
        super(message);
        this.agentId = agentId;
        this.cause = cause;
    }
}
export class TaskError extends AgenticOSError {
    name = "TaskError";
    taskId;
    constructor(message, taskId) {
        super(message);
        this.taskId = taskId;
    }
}
export function isPluginValidationError(error) {
    return error instanceof PluginValidationError;
}
export function isAgentError(error) {
    return error instanceof AgentError;
}
export function isTaskError(error) {
    return error instanceof TaskError;
}
//# sourceMappingURL=errors.js.map
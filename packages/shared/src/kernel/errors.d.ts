export declare class AgenticOSError extends Error {
	name: string;
	constructor(message: string);
}
export declare class PluginValidationError extends AgenticOSError {
	name: string;
	pluginName?: string;
	constructor(message: string, pluginName?: string);
}
export declare class AgentError extends AgenticOSError {
	name: string;
	agentId?: string;
	cause?: Error;
	constructor(message: string, agentId?: string, cause?: Error);
}
export declare class TaskError extends AgenticOSError {
	name: string;
	taskId?: string;
	constructor(message: string, taskId?: string);
}
export declare function isPluginValidationError(
	error: unknown,
): error is PluginValidationError;
export declare function isAgentError(error: unknown): error is AgentError;
export declare function isTaskError(error: unknown): error is TaskError;
//# sourceMappingURL=errors.d.ts.map

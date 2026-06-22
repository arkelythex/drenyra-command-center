/**
 * Error hierarchy for the Platform Core kernel.
 *
 * Provides structured error types that carry domain metadata
 * (plugin name, agent ID, task ID) for better diagnostics.
 *
 * @module @arkelythex/platform-core/kernel
 */

/**
 * Base platform-core error with a name discriminator for type guards.
 */
export class AgenticOSError extends Error {
  override name = "AgenticOSError";

  constructor(message: string) {
    super(message);
    // Ensure the prototype chain is correct
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Error thrown when a plugin fails validation during registration.
 */
export class PluginValidationError extends AgenticOSError {
  override name = "PluginValidationError";
  /** Name of the plugin that failed validation */
  pluginName?: string;

  constructor(message: string, pluginName?: string) {
    super(message);
    this.pluginName = pluginName;
  }
}

/**
 * Error thrown when an agent encounters a failure during execution.
 */
export class AgentError extends AgenticOSError {
  override name = "AgentError";
  /** The ID of the agent that failed */
  agentId?: string;
  /** The underlying error that caused this failure */
  cause?: Error;

  constructor(message: string, agentId?: string, cause?: Error) {
    super(message);
    this.agentId = agentId;
    this.cause = cause;
  }
}

/**
 * Error thrown when a task fails or reaches an invalid state.
 */
export class TaskError extends AgenticOSError {
  override name = "TaskError";
  /** The ID of the task that failed */
  taskId?: string;

  constructor(message: string, taskId?: string) {
    super(message);
    this.taskId = taskId;
  }
}

// ──────────────────────────────────────────────
// Type Guards
// ──────────────────────────────────────────────

/** Narrow an unknown error to PluginValidationError */
export function isPluginValidationError(error: unknown): error is PluginValidationError {
  return error instanceof PluginValidationError;
}

/** Narrow an unknown error to AgentError */
export function isAgentError(error: unknown): error is AgentError {
  return error instanceof AgentError;
}

/** Narrow an unknown error to TaskError */
export function isTaskError(error: unknown): error is TaskError {
  return error instanceof TaskError;
}

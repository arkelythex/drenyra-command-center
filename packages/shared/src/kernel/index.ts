/**
 * Kernel — Error hierarchy, event bus, lifecycle, core types
 *
 * Migrated from @drenyra/platform-core/kernel
 *
 * @module @drenyra/shared/kernel
 */

export {
	AgentError,
	isAgentError,
	isPluginValidationError,
	isTaskError,
	PluginValidationError,
	TaskError,
} from "./errors.js";
export type { EventEnvelope, EventHandler } from "./event-bus.js";
export { EventBus } from "./event-bus.js";
export type {
	LifecycleOptions,
	LifecycleTransition,
} from "./lifecycle.js";
export {
	AgentLifecycleManager,
	VALID_TRANSITIONS,
} from "./lifecycle.js";
export type {
	AgentContext,
	AgentStatus,
	AgentType,
	TaskDefinition,
	TaskPriority,
	TaskResult,
	TaskStatus,
} from "./types.js";

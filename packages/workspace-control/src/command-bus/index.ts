// ─── Barrel Exports — command-bus ───────────────────────────────────────────

export { CommandBus } from "./bus";
export {
	validationMiddleware,
	authMiddleware,
	loggingMiddleware,
} from "./middlewares";
export type { LoggingMiddlewareOptions } from "./middlewares";
export { registerWorkspaceHandlers } from "./registry";
export type {
	CommandMiddleware,
	CommandHandler,
	CommandResult,
	MiddlewareContext,
} from "./types";

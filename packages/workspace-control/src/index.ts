// ─── Barrel Exports — workspace-control ─────────────────────────────────────

// Concurrency
export type {
	ConflictEvent,
	ConflictResolutionStrategy,
	OperationLock,
	LockResult,
} from "./concurrency/types";
export { CONFLICT_RESOLUTION_STRATEGY } from "./concurrency/types";
export type { LockStore } from "./concurrency/lock-manager";
export {
	InMemoryLockStore,
	DEFAULT_LOCK_TTL_MS,
} from "./concurrency/lock-manager";
export type { ConflictResolver } from "./concurrency/conflict-resolver";
export {
	DefaultConflictResolver,
	detectConflict,
} from "./concurrency/conflict-resolver";

// Authorization
export type {
	WorkspacePermission,
	AuthorizationContext,
	AuthorizationDecision,
	AuthorizedResource,
	SensitivityLevel,
} from "./authorization/types";
export { WORKSPACE_PERMISSION, SENSITIVITY_LEVEL } from "./authorization/types";
export type { AuthorizationPolicy } from "./authorization/policy";
export { DefaultAuthorizationPolicy } from "./authorization/policy";
export { authorizeViewAccess } from "./authorization/view-guard";

// Performance
export type {
	PerformanceBudget,
	BudgetMeasurement,
	BudgetStatus,
	BackpressureState,
} from "./performance/types";
export { BUDGET_STATUS } from "./performance/types";
export { DEFAULT_PERFORMANCE_BUDGETS } from "./performance/budgets";
export type { BudgetTracker } from "./performance/budget-tracker";
export { InMemoryBudgetTracker } from "./performance/budget-tracker";
export type { BackpressureManager } from "./performance/backpressure";
export { SimpleBackpressureManager } from "./performance/backpressure";

// Attach
export type {
	AttachRequest,
	AttachResult,
} from "./attach/types";
export { attachToExecution } from "./attach/service";

// Detach
export type {
	DetachRequest,
	DetachResult,
} from "./detach/types";
export { detachFromExecution, detachFromExecutionSafe } from "./detach/service";

// Resume
export type {
	ResumeRequest,
	ResumeResult,
	ResumeExecutionState,
} from "./resume/types";
export { resumeWorkspace } from "./resume/service";
export { catchUpEvents } from "./resume/catch-up";

// Errors
export { AttachError, DetachError, ResumeError } from "./attach/errors";

// CommandBus
export { CommandBus } from "./command-bus/bus";
export {
	validationMiddleware,
	authMiddleware,
	loggingMiddleware,
} from "./command-bus/middlewares";
export type { LoggingMiddlewareOptions } from "./command-bus/middlewares";
export { registerWorkspaceHandlers } from "./command-bus/registry";
export type {
	CommandMiddleware,
	CommandHandler,
	CommandResult,
	MiddlewareContext,
} from "./command-bus/types";

// Notifications
export type {
	ExecutionSubscription,
	SubscriptionEvent,
	StateNotification,
	WaitResult,
	WaitOptions,
} from "./notifications/types";
export { WaitTimeoutError, SubscriptionError } from "./notifications/errors";
export type { SubscriptionStore } from "./notifications/subscription";
export { InMemorySubscriptionStore } from "./notifications/subscription";
export type {
	NotificationRouter,
	NotificationHandler,
} from "./notifications/notification-router";
export { InMemoryNotificationRouter } from "./notifications/notification-router";
export { WaitService } from "./notifications/wait-service";

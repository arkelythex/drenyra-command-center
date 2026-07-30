// ─── Barrel Exports ─────────────────────────────────────────────────────────

export {
	WorkspaceError,
	WorkspaceNotFoundError,
	WorkspaceValidationError,
	WorkspaceDuplicateCompanyError,
	WorkspaceSchemaVersionError,
	type WorkspaceErrorCode,
} from "./types/errors";

export {
	type WorkspaceId,
	createWorkspaceId,
	parseWorkspaceId,
	type WorkspaceObjective,
	objectiveDisplayName,
	type FinancialWorkspace,
	type CreateWorkspaceInput,
	createWorkspace,
	addCompanyToWorkspace,
	changeWorkspaceObjective,
	workspaceToJSON,
	workspaceFromJSON,
	CURRENT_WORKSPACE_SCHEMA_VERSION,
} from "./types/workspace";

export {
	type WorkspaceViewId,
	VIEW_KIND,
	type ViewKind,
	type LayoutPlacement,
	type WorkspaceView,
	type CreateViewInput,
	createView,
	moveView,
} from "./types/view";

export {
	type ExecutionId,
	createExecutionId,
	type ExecutionReference,
	createExecutionReference,
	type ExecutionRuntimeBinding,
	createExecutionRuntimeBinding,
} from "./types/execution";

export {
	LIFECYCLE_STATE,
	type LifecycleState,
	ATTENTION_STATE,
	type AttentionState,
	PROJECTED_RISK_TIER,
	type ProjectedRiskTier,
	FRESHNESS_STATE,
	type FreshnessState,
	type OperationalState,
	type CreateOperationalStateInput,
	createOperationalState,
	isTerminal,
	type StateViolation,
	validateOperationalState,
} from "./types/state";

export {
	type LifecycleSummary,
	type RollupReason,
	type AttentionRollup,
	type AttentionCounts,
	createEmptyAttentionRollup,
	aggregateRollups,
	CURRENT_ROLLUP_SCHEMA_VERSION,
} from "./types/rollup";

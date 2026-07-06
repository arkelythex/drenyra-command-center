/**
 * Automation Studio — API types.
 *
 * Re-exported from canonical @drenyra/application/features/automation-studio
 * with backward-compatible aliases for existing controller code.
 *
 * @module features/automation-studio/types
 */

import type {
	ActionType,
	ExecutionStatus,
	LastRunStatus,
	StepStatus,
	StepType,
	TriggerType,
	WorkflowCategory,
	WorkflowStatus,
} from "@drenyra/persistence/schema/automation-studio.schema";

export type {
	ActionType,
	ExecutionStatus,
	LastRunStatus,
	StepStatus,
	StepType,
	TriggerType,
	WorkflowCategory,
	WorkflowStatus,
};

// Re-export application types with backward-compatible names
import type {
	CreateStepRequest,
	CreateWorkflowRequest,
	DashboardStatsDTO,
	ExecutionDTO,
	StepDTO,
	UpdateStepRequest,
	UpdateWorkflowRequest,
	WorkflowDTO,
} from "@drenyra/application/features/automation-studio";

export type WorkflowResponse = WorkflowDTO;
export type StepResponse = StepDTO;
export type ExecutionResponse = ExecutionDTO;
export type DashboardStatsResponse = DashboardStatsDTO;
export type CreateWorkflowBody = CreateWorkflowRequest;
export type UpdateWorkflowBody = UpdateWorkflowRequest;
export type CreateStepBody = CreateStepRequest;
export type UpdateStepBody = UpdateStepRequest;
export type ReorderStepsBody = { workflowId: string; stepIds: string[] };

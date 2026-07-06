/**
 * Workflow type definitions shared between Go CLI and TS backend.
 *
 * Mirrors the Go `internal/workflow/catalog.go` Template struct.
 *
 * @module packages/agents/src/mastra/workflows/types
 */

/**
 * Canonical workflow definition.
 * Shared contract between Go CLI (apps/drenyra-cli) and TS backend.
 */
export interface WorkflowDefinition {
	/** Unique workflow identifier (e.g. "fiscal-compliance") */
	id: string;
	/** Human-readable purpose */
	description: string;
	/** Primary orchestrating agent ID */
	rootAgentId: string;
}

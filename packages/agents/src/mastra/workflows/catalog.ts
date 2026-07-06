/**
 * Workflow Catalog — Canonical Workflow Definitions
 *
 * Catalogs all known workflows shared between Go CLI and TS backend.
 * Mirrors `apps/drenyra-cli/internal/workflow/catalog.go`.
 *
 * Go has 10 workflows that the TS backend now registers as known
 * workflow definitions. Each entry includes its orchestrating agent,
 * description, and canonical ID for cross-referencing.
 *
 * @module packages/agents/src/mastra/workflows
 */
import { complianceCheckWorkflow } from "./compliance-check";
import type { WorkflowDefinition } from "./types";

/**
 * Canonical workflow catalog shared between Go CLI and TS backend.
 */
export const workflowCatalog: WorkflowDefinition[] = [
	{
		id: "architecture-check",
		description: "Check architecture boundaries between packages",
		rootAgentId: "ai-swarm-orchestrator",
	},
	{
		id: "fiscal-compliance",
		description: "Run fiscal compliance check (SUNAT, SIRE, detracciones)",
		rootAgentId: "fiscal-command-orchestrator",
	},
	{
		id: "code-generation",
		description: "Generate code from specification",
		rootAgentId: "ai-swarm-orchestrator",
	},
	{
		id: "test-generation",
		description: "Generate tests from source code",
		rootAgentId: "ai-swarm-orchestrator",
	},
	{
		id: "code-review",
		description: "Review code changes for quality and compliance",
		rootAgentId: "ai-swarm-orchestrator",
	},
	{
		id: "document-generation",
		description: "Generate documentation from source",
		rootAgentId: "latin-moderno-orchestrator",
	},
	{
		id: "evidence-gathering",
		description: "Gather audit evidence from fiscal sources",
		rootAgentId: "fiscal-command-orchestrator",
	},
	{
		id: "reconciliation",
		description: "Reconcile bank transactions with ledger entries",
		rootAgentId: "fiscal-command-orchestrator",
	},
	{
		id: "tax-calculation",
		description: "Calculate tax obligations for a period",
		rootAgentId: "fiscal-command-orchestrator",
	},
	{
		id: "monthly-close",
		description: "Execute monthly close workflow",
		rootAgentId: "fiscal-command-orchestrator",
	},
	{
		id: "compliance-check",
		description: "Run compliance check via Mastra",
		rootAgentId: "ai-swarm-orchestrator",
	},
];

/**
 * Look up a workflow by its canonical ID.
 */
export function getWorkflowById(id: string): WorkflowDefinition | undefined {
	return workflowCatalog.find((w) => w.id === id);
}

/**
 * Get all workflows for a given orchestrating agent.
 */
export function getWorkflowsByAgent(rootAgentId: string): WorkflowDefinition[] {
	return workflowCatalog.filter((w) => w.rootAgentId === rootAgentId);
}

export { complianceCheckWorkflow };

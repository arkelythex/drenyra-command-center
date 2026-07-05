/**
 * Governance Pipeline End-to-End Test.
 *
 * Tests the full governance pipeline:
 *   register agent → register tool → evaluate → evidence saved → getScoped returns it
 *
 * Uses mocked AgentRegistry, ToolRegistry, and a real (in-memory) evidence store
 * to verify the end-to-end flow without requiring a real PostgreSQL instance.
 */

import { describe, expect, it, vi } from "vitest";
import type { AgentRegistry } from "../../src/control-plane/agent-registry";
import type {
	AgentRegistryEntry,
	TenantCompanyRucScope,
	ToolDefinition,
} from "../../src/control-plane/contracts";
import { PolicyEngine } from "../../src/control-plane/policy-engine";
import type { ToolRegistry } from "../../src/control-plane/tool-registry";
import type {
	EvidenceTraceBundle,
	TraceEvidenceStore,
} from "../../src/control-plane/trace-evidence";
import { createInMemoryTraceEvidenceStore } from "../../src/control-plane/trace-evidence";

// ============================================================================
// Fixtures
// ============================================================================

const scope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

const otherScope: TenantCompanyRucScope = {
	tenantId: "tenant-2",
	organizationId: "org-2",
	companyId: "company-2",
	ruc: "20987654321",
};

const agent: AgentRegistryEntry = {
	agentId: "e2e-agent-1",
	purpose: "E2E test agent",
	tenantScope: scope,
	capabilities: ["advisory.review"],
	allowedTools: ["e2e.tool.read"],
	approvalClass: "not-required",
	supportedSurfaces: ["api"],
};

const tool: ToolDefinition = {
	id: 1,
	name: "e2e.tool.read",
	description: "E2E test tool",
	riskTier: "T0",
	inputSchema: {},
	outputSchema: {},
	requiresApproval: false,
	fiscalImpact: false,
	approvalLevel: "auto",
	metadata: {},
	createdAt: new Date(),
	updatedAt: new Date(),
};

type AsyncMock<TArgs extends unknown[], TResult> = ((
	...args: TArgs
) => Promise<TResult>) & {
	mockResolvedValue(value: TResult): void;
	mockRejectedValue(error: unknown): void;
};

const asAsyncMock = <TArgs extends unknown[], TResult>(
	fn: (...args: TArgs) => Promise<TResult>,
): AsyncMock<TArgs, TResult> => fn as AsyncMock<TArgs, TResult>;

// ============================================================================
// Mock helpers
// ============================================================================

function createMockAgentRegistry(): AgentRegistry {
	return {
		getAgent: vi.fn(),
		registerAgent: vi.fn(),
		queryByScope: vi.fn(),
		queryByCapability: vi.fn(),
		updateAgent: vi.fn(),
		deactivateAgent: vi.fn(),
	} as unknown as AgentRegistry;
}

function createMockToolRegistry(): ToolRegistry {
	return {
		getTool: vi.fn(),
		registerTool: vi.fn(),
		listToolsByRiskTier: vi.fn(),
		listToolsByScope: vi.fn(),
		getAllTools: vi.fn(),
		updateTool: vi.fn(),
		deleteTool: vi.fn(),
	} as unknown as ToolRegistry;
}

// ============================================================================
// Tests
// ============================================================================

describe("Governance Pipeline (E2E)", () => {
	it("should complete full pipeline: register → evaluate → evidence saved → getScoped returns it", async () => {
		const agentRegistry = createMockAgentRegistry();
		const toolRegistry = createMockToolRegistry();
		const evidenceStore: TraceEvidenceStore =
			createInMemoryTraceEvidenceStore();
		const engine = new PolicyEngine(agentRegistry, toolRegistry, evidenceStore);

		// Mock agent and tool lookups
		asAsyncMock(agentRegistry.getAgent).mockResolvedValue(agent);
		asAsyncMock(toolRegistry.getTool).mockResolvedValue(tool);

		// Execute the policy evaluation
		const result = await engine.evaluate({
			traceId: "e2e-trace-1",
			agentId: "e2e-agent-1",
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "e2e.tool.read",
			action: "read",
		});

		// Verify policy result
		expect(result.allowed).toBe(true);
		expect(result.violations).toHaveLength(0);
		expect(result.approvalState).toBe("validated");

		// Verify evidence was saved and is retrievable with matching scope
		const evidenceResult = evidenceStore.getScoped({
			traceId: "e2e-trace-1",
			tenantScope: scope,
		});

		expect(evidenceResult.found).toBe(true);
		if (evidenceResult.found) {
			expect(evidenceResult.bundle.traceId).toBe("e2e-trace-1");
			expect(evidenceResult.bundle.rationale).toContain("Policy approved");
			expect(evidenceResult.bundle.toolCalls).toContain("e2e.tool.read");
			expect(evidenceResult.bundle.tenantScope).toEqual(scope);
		}
	});

	it("should enforce cross-tenant isolation on evidence", async () => {
		const agentRegistry = createMockAgentRegistry();
		const toolRegistry = createMockToolRegistry();
		const evidenceStore: TraceEvidenceStore =
			createInMemoryTraceEvidenceStore();
		const engine = new PolicyEngine(agentRegistry, toolRegistry, evidenceStore);

		asAsyncMock(agentRegistry.getAgent).mockResolvedValue(agent);
		asAsyncMock(toolRegistry.getTool).mockResolvedValue(tool);

		await engine.evaluate({
			traceId: "e2e-trace-isolation",
			agentId: "e2e-agent-1",
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "e2e.tool.read",
			action: "read",
		});

		// Try to read with a different tenant scope
		const wrongTenant = evidenceStore.getScoped({
			traceId: "e2e-trace-isolation",
			tenantScope: otherScope,
		});

		expect(wrongTenant.found).toBe(false);
		if (!wrongTenant.found) {
			expect(wrongTenant.reason).toBe("scope-mismatch");
		}

		// Own tenant can still read
		const ownTenant = evidenceStore.getScoped({
			traceId: "e2e-trace-isolation",
			tenantScope: scope,
		});
		expect(ownTenant.found).toBe(true);
	});

	it("should persist evidence with correct bundle contents", async () => {
		const agentRegistry = createMockAgentRegistry();
		const toolRegistry = createMockToolRegistry();
		const evidenceStore: TraceEvidenceStore =
			createInMemoryTraceEvidenceStore();
		const engine = new PolicyEngine(agentRegistry, toolRegistry, evidenceStore);

		asAsyncMock(agentRegistry.getAgent).mockResolvedValue(agent);
		asAsyncMock(toolRegistry.getTool).mockResolvedValue(tool);

		await engine.evaluate({
			traceId: "e2e-trace-bundle",
			agentId: "e2e-agent-1",
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "e2e.tool.read",
			action: "read",
		});

		const result = evidenceStore.getScoped({
			traceId: "e2e-trace-bundle",
			tenantScope: scope,
		});

		expect(result.found).toBe(true);
		if (result.found) {
			const bundle = result.bundle;

			// Check required bundle fields
			expect(bundle.traceId).toBe("e2e-trace-bundle");
			expect(bundle.redactionStatus).toBe("redacted");
			expect(bundle.toolCalls).toContain("e2e.tool.read");
			expect(bundle.tenantScope).toEqual(scope);

			// Check evidence array exists (PolicyEngine creates empty array)
			expect(Array.isArray(bundle.evidence)).toBe(true);

			// Bundle should not have unredacted evidence
			for (const item of bundle.evidence) {
				expect(item.isRedacted).toBe(true);
			}
		}
	});

	it("should deny and record evidence for policy violation", async () => {
		const agentRegistry = createMockAgentRegistry();
		const toolRegistry = createMockToolRegistry();
		const evidenceStore: TraceEvidenceStore =
			createInMemoryTraceEvidenceStore();
		const engine = new PolicyEngine(agentRegistry, toolRegistry, evidenceStore);

		asAsyncMock(agentRegistry.getAgent).mockResolvedValue(agent);
		asAsyncMock(toolRegistry.getTool).mockResolvedValue(tool);

		// Request a tool NOT in the agent's allowedTools list
		const result = await engine.evaluate({
			traceId: "e2e-trace-denied",
			agentId: "e2e-agent-1",
			requestedScope: scope,
			requestedCapability: "advisory.review",
			requestedTool: "unauthorized.tool.write",
			action: "write",
		});

		expect(result.allowed).toBe(false);
		expect(result.violations).toContain("tool-not-allowed");

		// Evidence should still be recorded (denied decisions are audit events)
		const evidence = evidenceStore.getScoped({
			traceId: "e2e-trace-denied",
			tenantScope: scope,
		});

		expect(evidence.found).toBe(true);
		if (evidence.found) {
			expect(evidence.bundle.rationale).toContain("Policy denied");
		}
	});

	it("should allow approval lineage updates on evidence", async () => {
		const evidenceStore: TraceEvidenceStore =
			createInMemoryTraceEvidenceStore();

		// Directly save a bundle
		const bundle: EvidenceTraceBundle = {
			traceId: "e2e-trace-lineage",
			tenantScope: scope,
			redactionStatus: "redacted",
			toolCalls: ["ledger.read"],
			rationale: "Needs approval",
			evidence: [
				{
					sourceRef: "source://approval",
					hash: "hash-approval-1",
					scope: "policy-artifact",
					isRedacted: true,
				},
			],
		};

		evidenceStore.save(bundle);

		// Update with approval
		const updated = evidenceStore.updateApprovalLineage({
			traceId: "e2e-trace-lineage",
			tenantScope: scope,
			approvalLineage: {
				approvalId: "approval-e2e-1",
				approvalStatus: "approved",
				decision: "approved",
			},
		});

		expect(updated.found).toBe(true);
		if (updated.found) {
			expect(updated.bundle.approvalLineage).toBeDefined();
			expect(updated.bundle.approvalLineage?.approvalStatus).toBe("approved");
			expect(updated.bundle.approvalLineage?.decision).toBe("approved");
		}
	});
});

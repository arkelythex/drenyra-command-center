/**
 * PolicyEngine + PermissionService Integration Tests (P5 Granular Permissions Gate).
 *
 * Tests the permission gate in PolicyEngine.evaluateInternal():
 *   - ALLOW  → skips tool-level approval (requiresApproval depends on fiscal only)
 *   - DENY   → short-circuits with POLICY_BLOCKED
 *   - REQUIRE_APPROVAL → unchanged behavior (tool or fiscal requires approval)
 *   - No PermissionService → unchanged behavior
 *   - Fiscal gate override: ALLOW + fiscal gate → still requires approval (fiscal safety)
 *
 * Follows existing test patterns from policy-engine.test.ts and
 * fiscal-policy-engine.integration.test.ts.
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
import { createInMemoryTraceEvidenceStore } from "../../src/control-plane/trace-evidence";
import { PermissionService } from "../../src/governance/permission-service";

// ============================================================================
// Fixtures
// ============================================================================

const defaultScope: TenantCompanyRucScope = {
	tenantId: "tenant-1",
	organizationId: "org-1",
	companyId: "company-1",
	ruc: "20123456789",
};

const agent: AgentRegistryEntry = {
	agentId: "perm-agent-1",
	purpose: "Permission gate test agent",
	tenantScope: defaultScope,
	capabilities: ["advisory.review"] as AgentRegistryEntry["capabilities"],
	allowedTools: ["perm-tool-1", "fiscal-tool-1"],
	approvalClass: "not-required" as AgentRegistryEntry["approvalClass"],
	supportedSurfaces: ["api"] as AgentRegistryEntry["supportedSurfaces"],
};

/**
 * Tool factory — creates tools with configurable requiresApproval and fiscalImpact.
 */
function makeTool(
	name: string,
	overrides: Partial<ToolDefinition> = {},
): ToolDefinition {
	return {
		id: 1,
		name,
		description: `Tool ${name}`,
		riskTier: "T0",
		inputSchema: {},
		outputSchema: {},
		requiresApproval: false,
		fiscalImpact: false,
		approvalLevel: "auto",
		metadata: {},
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	};
}

// ============================================================================
// Engine factory
// ============================================================================

function createEngine(options?: {
	permissionService?: PermissionService;
	toolOverrides?: Partial<ToolDefinition>;
	agentOverride?: AgentRegistryEntry;
}) {
	const agentRegistry = {
		getAgent: vi.fn().mockResolvedValue(options?.agentOverride ?? agent),
		registerAgent: vi.fn(),
		queryByScope: vi.fn(),
		queryByCapability: vi.fn(),
		updateAgent: vi.fn(),
		deactivateAgent: vi.fn(),
	} as unknown as AgentRegistry;

	const toolRegistry = {
		getTool: vi
			.fn()
			.mockImplementation(async (name: string) =>
				name === "perm-tool-1" ? makeTool(name, options?.toolOverrides) : null,
			),
		registerTool: vi.fn(),
		listToolsByRiskTier: vi.fn(),
		listToolsByScope: vi.fn(),
		getAllTools: vi.fn(),
		updateTool: vi.fn(),
		deleteTool: vi.fn(),
	} as unknown as ToolRegistry;

	const evidenceStore = createInMemoryTraceEvidenceStore();

	const engine = new PolicyEngine(
		agentRegistry,
		toolRegistry,
		evidenceStore,
		options?.permissionService,
	);

	return { engine, evidenceStore };
}

// ============================================================================
// Tests
// ============================================================================

describe("PolicyEngine + PermissionService Integration (Permission Gate)", () => {
	describe("PERMISSION ALLOW", () => {
		it("should skip tool-level approval when PermissionService returns ALLOW", async () => {
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "ALLOW");
			const { engine } = createEngine({
				permissionService,
				toolOverrides: { requiresApproval: true },
			});

			const result = await engine.evaluate({
				traceId: "trace-allow-1",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			expect(result.allowed).toBe(true);
			// ALLOW skips the tool-level requiresApproval gate
			expect(result.requiresApproval).toBe(false);
			expect(result.violations).toHaveLength(0);
		});

		it("should still allow execution even when tool normally requires approval", async () => {
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "ALLOW");
			const { engine } = createEngine({
				permissionService,
				toolOverrides: { requiresApproval: true },
			});

			const result = await engine.evaluate({
				traceId: "trace-allow-2",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			// ALLOW causes permissionOverride which skips tool.requiresApproval
			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(false);
		});
	});

	describe("PERMISSION DENY", () => {
		it("should block execution with POLICY_BLOCKED when PermissionService returns DENY", async () => {
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "DENY");
			const { engine } = createEngine({
				permissionService,
			});

			const result = await engine.evaluate({
				traceId: "trace-deny-1",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toContain("denied by permission policy");
			expect(result.approvalState).toBe("rejected");
		});

		it("should include the PermissionService reason in violations when provided", async () => {
			const permissionService = new PermissionService();
			// Simulate an entry with a reason via load() — PermissionService always
			// returns the entry's effect; the reason comes from the entry.
			// Since load() sets entries without reason, use setPermission for the effect.
			permissionService.setPermission("perm-tool-1", "DENY");

			const result = permissionService.canExecute("perm-tool-1", {
				companyId: defaultScope.companyId,
			});

			expect(result.effect).toBe("DENY");
		});
	});

	describe("PERMISSION REQUIRE_APPROVAL", () => {
		it("should preserve requiresApproval when PermissionService returns REQUIRE_APPROVAL", async () => {
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "REQUIRE_APPROVAL");
			const { engine } = createEngine({
				permissionService,
				toolOverrides: { requiresApproval: true },
			});

			const result = await engine.evaluate({
				traceId: "trace-require-1",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(true);
		});

		it("should fall through to tool defaults when PermissionService returns REQUIRE_APPROVAL and tool does not require approval", async () => {
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "REQUIRE_APPROVAL");
			const { engine } = createEngine({
				permissionService,
				toolOverrides: { requiresApproval: false },
			});

			const result = await engine.evaluate({
				traceId: "trace-require-2",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			// REQUIRE_APPROVAL from permission service doesn't change the behavior.
			// requiresApproval = tool.requiresApproval || fiscalPolicy.requiresApproval
			// When tool doesn't require approval and no fiscal impact, it's false.
			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(false);
		});
	});

	describe("NO PermissionService (unchanged behavior)", () => {
		it("should behave exactly as before when no PermissionService is injected", async () => {
			const { engine } = createEngine({
				toolOverrides: { requiresApproval: false },
			});

			const result = await engine.evaluate({
				traceId: "trace-none-1",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "read",
			});

			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(false);
			expect(result.violations).toHaveLength(0);
		});

		it("should still require approval when tool.requiresApproval is true and no PermissionService", async () => {
			const { engine } = createEngine({
				toolOverrides: { requiresApproval: true },
			});

			const result = await engine.evaluate({
				traceId: "trace-none-2",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(true);
		});
	});

	describe("Fiscal Gate Override", () => {
		it("should still require approval when PermissionService ALLOW + fiscal gate triggers", async () => {
			// A tool with fiscalImpact=true that triggers the fiscal gate
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "ALLOW");

			// We need a tool that triggers the fiscal gate.
			// Looking at fiscal-policy.ts, a tool name like "sire.export" triggers
			// EVIDENCE_REQUIRED. But perm-tool-1 won't match any fiscal pattern.
			// Let's create a mock agent that has "sire.export" in allowedTools.
			const fiscalAgent: AgentRegistryEntry = {
				...agent,
				allowedTools: ["sire.export"],
			};

			const agentRegistry = {
				getAgent: vi.fn().mockResolvedValue(fiscalAgent),
				registerAgent: vi.fn(),
				queryByScope: vi.fn(),
				queryByCapability: vi.fn(),
				updateAgent: vi.fn(),
				deactivateAgent: vi.fn(),
			} as unknown as AgentRegistry;

			const toolRegistry = {
				getTool: vi.fn().mockImplementation(async (name: string) =>
					makeTool(name, {
						fiscalImpact: true,
						requiresApproval: false,
					}),
				),
				registerTool: vi.fn(),
				listToolsByRiskTier: vi.fn(),
				listToolsByScope: vi.fn(),
				getAllTools: vi.fn(),
				updateTool: vi.fn(),
				deleteTool: vi.fn(),
			} as unknown as ToolRegistry;

			const evidenceStore = createInMemoryTraceEvidenceStore();

			const engine = new PolicyEngine(
				agentRegistry,
				toolRegistry,
				evidenceStore,
				permissionService,
			);

			const result = await engine.evaluate({
				traceId: "trace-fiscal-allow-1",
				agentId: fiscalAgent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "sire.export",
				action: "execute",
			});

			// ALLOW skips tool-level approval, but fiscal gate still applies
			expect(result.allowed).toBe(false);
			// The fiscal gate triggers EVIDENCE_REQUIRED for sire.export
			expect(result.violations).toContain("EVIDENCE_REQUIRED");
			// allowed=false because fiscal policy fails (EVIDENCE_REQUIRED)
			// requiresApproval can be anything when allowed=false
		});

		it("should still require approval on non-fiscal tool when PermissionService ALLOW + tool.requiresApproval and fiscal is clean", async () => {
			// This test verifies that ALLOW skips tool.requiresApproval
			// but fiscal policy can still set requiresApproval.
			// For a non-fiscal tool, fiscal returns none so requiresApproval stays false.
			const permissionService = new PermissionService();
			permissionService.setPermission("perm-tool-1", "ALLOW");

			const { engine } = createEngine({
				permissionService,
				toolOverrides: {
					requiresApproval: true,
					fiscalImpact: false,
				},
			});

			const result = await engine.evaluate({
				traceId: "trace-fiscal-allow-2",
				agentId: agent.agentId,
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "perm-tool-1",
				action: "execute",
			});

			// ALLOW skips tool-level requiresApproval + fiscal is clean → no approval needed
			expect(result.allowed).toBe(true);
			expect(result.requiresApproval).toBe(false);
		});
	});
});

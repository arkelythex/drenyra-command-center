/**
 * PolicyEngine tests
 *
 * Tests the PolicyEngine class with mocked AgentRegistry, ToolRegistry,
 * and TraceEvidenceStore dependencies.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { PolicyEngine } from "../../src/control-plane/policy-engine";
import type { AgentRegistry } from "../../src/control-plane/agent-registry";
import type { ToolRegistry } from "../../src/control-plane/tool-registry";
import type {
	TraceEvidenceStore,
	EvidenceTraceBundle,
} from "../../src/control-plane/trace-evidence";
import type {
	AgentRegistryEntry,
	ToolDefinition,
	TenantCompanyRucScope,
} from "../../src/control-plane/contracts";

// ============================================================================
// Helpers
// ============================================================================

const defaultScope: TenantCompanyRucScope = {
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

const mockAgent: AgentRegistryEntry = {
	agentId: "agent-1",
	purpose: "Test agent",
	tenantScope: defaultScope,
	capabilities: ["advisory.review"] as AgentRegistryEntry["capabilities"],
	allowedTools: ["test-tool-1", "test-tool-2"],
	approvalClass: "not-required" as AgentRegistryEntry["approvalClass"],
	supportedSurfaces: ["api"] as AgentRegistryEntry["supportedSurfaces"],
};

const mockTool: ToolDefinition = {
	id: 1,
	name: "test-tool-1",
	description: "A test tool",
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
// Mocks
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

function createMockEvidenceStore(): TraceEvidenceStore {
	return {
		save: vi.fn(),
		getScoped: vi.fn(),
		updateApprovalLineage: vi.fn(),
		appendAuditEvent: vi.fn(),
	} as unknown as TraceEvidenceStore;
}

// ============================================================================
// Tests
// ============================================================================

describe("PolicyEngine", () => {
	let agentRegistry: AgentRegistry;
	let toolRegistry: ToolRegistry;
	let evidenceStore: TraceEvidenceStore;
	let engine: PolicyEngine;

	beforeEach(() => {
		agentRegistry = createMockAgentRegistry();
		toolRegistry = createMockToolRegistry();
		evidenceStore = createMockEvidenceStore();
		engine = new PolicyEngine(agentRegistry, toolRegistry, evidenceStore);
	});

	describe("evaluate", () => {
		it("should return allowed=true for registered agent with allowed tool", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "agent-1",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "test-tool-1",
				action: "read",
			});

			expect(result.allowed).toBe(true);
			expect(result.violations).toHaveLength(0);
			expect(result.approvalState).toBe("validated");
		});

		it("should return allowed=false for unregistered agent", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(null);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "unknown-agent",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "test-tool-1",
				action: "read",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toContain(
				'Agent "unknown-agent" is not registered',
			);
		});

		it("should return allowed=false for tool not in allowed list", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "agent-1",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "unauthorized-tool",
				action: "read",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toContain("tool-not-allowed");
		});

		it("should return allowed=false for scope mismatch", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "agent-1",
				requestedScope: otherScope,
				requestedCapability: "advisory.review",
				requestedTool: "test-tool-1",
				action: "read",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toContain("scope mismatch");
		});

		it("should return allowed=false for unregistered tool", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(null);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "agent-1",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "non-existent-tool",
				action: "read",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toContain(
				'Tool "non-existent-tool" is not registered in ToolRegistry',
			);
		});

		it("should save evidence after evaluation", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);
			const saveSpy = evidenceStore.save as ReturnType<typeof vi.fn>;

			await engine.evaluate({
				traceId: "trace-evidence-1",
				agentId: "agent-1",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "test-tool-1",
				action: "read",
			});

			expect(saveSpy).toHaveBeenCalledTimes(1);
			const bundle = saveSpy.mock.calls[0][0] as EvidenceTraceBundle;
			expect(bundle.traceId).toBe("trace-evidence-1");
			expect(bundle.rationale).toContain("Policy approved");
		});

		it("should fail closed on registry error", async () => {
			asAsyncMock(agentRegistry.getAgent).mockRejectedValue(
				new Error("DB connection failed"),
			);

			const result = await engine.evaluate({
				traceId: "trace-1",
				agentId: "agent-1",
				requestedScope: defaultScope,
				requestedCapability: "advisory.review",
				requestedTool: "test-tool-1",
				action: "read",
			});

			expect(result.allowed).toBe(false);
			expect(result.violations).toHaveLength(1);
			expect(result.violations[0]).toContain("PolicyEngine error");
		});
	});

	describe("evaluateToolAction", () => {
		it("should extract scope from context and delegate to evaluate", async () => {
			asAsyncMock(agentRegistry.getAgent).mockResolvedValue(mockAgent);
			asAsyncMock(toolRegistry.getTool).mockResolvedValue(mockTool);

			const result = await engine.evaluateToolAction({
				traceId: "tool-trace-1",
				agentId: "agent-1",
				toolName: "test-tool-1",
				input: { some: "data" },
				context: {
					tenantId: defaultScope.tenantId,
					organizationId: defaultScope.organizationId,
					companyId: defaultScope.companyId,
					ruc: defaultScope.ruc,
					userId: "user-1",
					sessionId: "session-1",
					traceId: "tool-trace-1",
				},
				action: "execute",
			});

			expect(result.allowed).toBe(true);
			expect(result.violations).toHaveLength(0);
			expect(result.toolName).toBe("test-tool-1");
		});
	});
});

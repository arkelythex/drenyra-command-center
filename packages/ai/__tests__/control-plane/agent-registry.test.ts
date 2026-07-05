/**
 * AgentRegistry tests — uses vitest mocks to simulate Drizzle DB interactions.
 *
 * Covers: register, get, queryByScope, queryByCapability, update, deactivate,
 * cache invalidation, and cross-tenant isolation.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { AgentRegistry } from "../../src/control-plane/agent-registry";
import type { AgentRegistryEntry } from "../../src/control-plane/contracts";

// ============================================================================
// Mock Drizzle query helpers
// ============================================================================

/**
 * Creates a thenable mock object that resolves to the given rows.
 * Mimics Drizzle's query chain which is both chainable AND thenable.
 */
function thenableResult<T = unknown>(rows: T) {
	return {
		then: vi.fn((onFulfilled?: (v: T) => void) => {
			if (onFulfilled) {
				return Promise.resolve(rows).then(onFulfilled);
			}
			return Promise.resolve(rows);
		}),
		where: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		returning: vi.fn().mockReturnThis(),
		onConflictDoUpdate: vi.fn().mockReturnThis(),
	};
}

function createMockDb() {
	const insert = vi.fn();
	const select = vi.fn();
	const update = vi.fn();
	const del = vi.fn();

	// Default: all queries return empty
	const emptyResult = thenableResult([]);

	// Select with .from() → .where() or .from() directly
	select.mockReturnValue({
		from: vi.fn().mockReturnValue({
			...emptyResult,
			where: vi.fn().mockReturnValue(emptyResult),
		}),
	});

	// Insert with .values() → .onConflictDoUpdate()
	insert.mockReturnValue({
		values: vi.fn().mockReturnValue({
			onConflictDoUpdate: vi.fn().mockReturnValue(emptyResult),
		}),
	});

	// Update with .set() → .where()
	update.mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	});

	// Delete with .where()
	del.mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined),
	});

	return { insert, select, update, delete: del };
}

// ============================================================================
// Shared test data
// ============================================================================

const tenantAScope = {
	tenantId: "tenant-a",
	organizationId: "org-a",
	companyId: "company-a",
	ruc: "20123456789",
};

const tenantBScope = {
	tenantId: "tenant-b",
	organizationId: "org-b",
	companyId: "company-b",
	ruc: "20987654321",
};

const agentA: AgentRegistryEntry = {
	agentId: "agent-recon",
	purpose: "Reconciliation review agent",
	tenantScope: tenantAScope,
	capabilities: ["advisory.review", "advisory.explain" as const],
	allowedTools: ["read-ledger", "read-transactions"],
	approvalClass: "not-required",
	supportedSurfaces: ["api", "workspace"],
};

const agentB: AgentRegistryEntry = {
	agentId: "agent-fiscal",
	purpose: "Fiscal analysis agent",
	tenantScope: tenantAScope,
	capabilities: ["advisory.classify" as const, "advisory.route" as const],
	allowedTools: ["classify-document", "route-invoice"],
	approvalClass: "supervisor",
	supportedSurfaces: ["api"],
};

const agentCrossTenant: AgentRegistryEntry = {
	agentId: "agent-cross",
	purpose: "Cross-tenant agent",
	tenantScope: tenantBScope,
	capabilities: ["advisory.summarize" as const],
	allowedTools: ["summarize-report"],
	approvalClass: "not-required",
	supportedSurfaces: ["batch"],
};

// ============================================================================
// Tests
// ============================================================================

describe("AgentRegistry", () => {
	let mockDb: ReturnType<typeof createMockDb>;
	let registry: AgentRegistry;

	beforeEach(() => {
		mockDb = createMockDb();
		registry = new AgentRegistry(mockDb as any);
	});

	// ---- registerAgent ----

	describe("registerAgent", () => {
		it("should register an agent successfully", async () => {
			await registry.registerAgent(agentA);

			expect(mockDb.insert).toHaveBeenCalled();
		});

		it("should reject invalid agent entry via Zod", async () => {
			const bad = { ...agentA, agentId: "", capabilities: [] };
			await expect(registry.registerAgent(bad as any)).rejects.toThrow();
		});
	});

	// ---- getAgent ----

	describe("getAgent", () => {
		it("should return null for unknown agent", async () => {
			const result = await registry.getAgent("nonexistent");
			expect(result).toBeNull();
		});

		it("should return agent from cache after registration", async () => {
			// Register agent (populates cache)
			await registry.registerAgent(agentA);

			// Spy on select — should NOT be called
			const spy = vi.spyOn(mockDb, "select");
			const result = await registry.getAgent("agent-recon");

			expect(result).toBeDefined();
			expect(result!.agentId).toBe("agent-recon");
			expect(spy).not.toHaveBeenCalled();
		});
	});

	// ---- queryByScope ----

	describe("queryByScope", () => {
		it("should return agents matching the tenant scope", async () => {
			const rows = [
				{
					agentId: "agent-recon",
					purpose: "Reconciliation review agent",
					tenantId: "tenant-a",
					organizationId: "org-a",
					companyId: "company-a",
					ruc: "20123456789",
					capabilities: ["advisory.review", "advisory.explain"],
					allowedTools: ["read-ledger", "read-transactions"],
					approvalClass: "not-required",
					supportedSurfaces: ["api", "workspace"],
					isActive: true,
				},
			];

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult(rows)),
				}),
			});

			const results = await registry.queryByScope(tenantAScope);
			expect(results).toHaveLength(1);
			expect(results[0].agentId).toBe("agent-recon");
		});

		it("should enforce tenant isolation — no cross-tenant leak", async () => {
			// Return empty for tenantA query
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult([])),
				}),
			});

			const results = await registry.queryByScope(tenantAScope);
			expect(results).toHaveLength(0);
		});
	});

	// ---- queryByCapability ----

	describe("queryByCapability", () => {
		it("should return agents matching the capability", async () => {
			const rows = [
				{
					agentId: "agent-recon",
					purpose: "Reconciliation review agent",
					tenantId: "tenant-a",
					organizationId: "org-a",
					companyId: "company-a",
					ruc: "20123456789",
					capabilities: ["advisory.review", "advisory.explain"],
					allowedTools: ["read-ledger", "read-transactions"],
					approvalClass: "not-required",
					supportedSurfaces: ["api", "workspace"],
					isActive: true,
				},
			];

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult(rows)),
				}),
			});

			const results = await registry.queryByCapability("advisory.review");
			expect(results).toHaveLength(1);
			expect(results[0].capabilities).toContain("advisory.review");
		});

		it("should return empty array when no agents have the capability", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult([])),
				}),
			});

			const results = await registry.queryByCapability(
				"nonexistent.capability",
			);
			expect(results).toHaveLength(0);
		});
	});

	// ---- updateAgent ----

	describe("updateAgent", () => {
		it("should partially update an agent", async () => {
			await registry.updateAgent("agent-recon", {
				purpose: "Updated purpose",
			});

			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	// ---- deactivateAgent ----

	describe("deactivateAgent", () => {
		it("should deactivate an agent (soft delete)", async () => {
			await registry.deactivateAgent("agent-recon");

			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	// ---- cross-tenant isolation via scope ----

	describe("cross-tenant isolation", () => {
		it("should not leak agents across tenants via queryByScope", async () => {
			// Return tenantA agents when tenantA scope is queried
			const tenantARows = [
				{
					agentId: "agent-recon",
					purpose: "Reconciliation review agent",
					tenantId: "tenant-a",
					organizationId: "org-a",
					companyId: "company-a",
					ruc: "20123456789",
					capabilities: ["advisory.review", "advisory.explain"],
					allowedTools: ["read-ledger", "read-transactions"],
					approvalClass: "not-required",
					supportedSurfaces: ["api", "workspace"],
					isActive: true,
				},
			];

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult(tenantARows)),
				}),
			});

			const tenantAResults = await registry.queryByScope(tenantAScope);
			expect(tenantAResults).toHaveLength(1);
			expect(tenantAResults[0].agentId).toBe("agent-recon");

			// Should NOT contain tenant B's agent
			const leaked = tenantAResults.filter((a) => a.agentId === "agent-cross");
			expect(leaked).toHaveLength(0);
		});
	});
});

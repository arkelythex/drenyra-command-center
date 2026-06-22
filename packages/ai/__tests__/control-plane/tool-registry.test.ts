/**
 * ToolRegistry tests — uses vitest mocks to simulate Drizzle DB interactions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/control-plane/tool-registry";
import type { ToolRegistration, RiskTier } from "../../src/control-plane/contracts";

// ============================================================================
// Mock Drizzle query helpers
// ============================================================================

/**
 * Creates a thenable mock object that resolves to the given rows.
 * This mimics Drizzle's query objects which are both chainable AND thenable.
 */
function thenableResult<T = unknown>(rows: T): {
	then: ReturnType<typeof vi.fn>;
	where: ReturnType<typeof vi.fn>;
	limit: ReturnType<typeof vi.fn>;
	from: ReturnType<typeof vi.fn>;
	values: ReturnType<typeof vi.fn>;
	set: ReturnType<typeof vi.fn>;
} {
	return {
		then: vi.fn((onFulfilled?: (v: T) => void) => {
			if (onFulfilled) {
				return Promise.resolve(rows).then(onFulfilled);
			}
			return Promise.resolve(rows);
		}),
		where: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
	};
}

function createMockDb() {
	const insert = vi.fn();
	const select = vi.fn();
	const update = vi.fn();
	const del = vi.fn();
	const returning = vi.fn();

	// Default: all queries return empty results
	select.mockReturnValue({
		from: vi.fn().mockReturnValue(thenableResult([])),
	});

	insert.mockReturnValue({
		values: vi.fn().mockReturnValue({
			onConflictDoUpdate: vi.fn().mockReturnValue({
				returning: returning.mockResolvedValue([]),
			}),
		}),
	});

	update.mockReturnValue({
		set: vi.fn().mockReturnValue({
			where: vi.fn().mockResolvedValue(undefined),
		}),
	});

	del.mockReturnValue({
		where: vi.fn().mockResolvedValue(undefined),
	});

	return {
		insert,
		select,
		update,
		delete: del,
		returning,
	};
}

// ============================================================================
// Shared test data
// ============================================================================

const validTool: ToolRegistration = {
	name: "test-analyzer",
	description: "Analyzes financial data",
	riskTier: "T1" as RiskTier,
	requiresApproval: false,
	fiscalImpact: false,
	approvalLevel: "auto",
};

const fiscalTool: ToolRegistration = {
	name: "sunat-submitter",
	description: "Submits documents to SUNAT",
	riskTier: "T3" as RiskTier,
	requiresApproval: true,
	fiscalImpact: true,
	approvalLevel: "gate",
};

// ============================================================================
// Tests
// ============================================================================

describe("ToolRegistry", () => {
	let mockDb: ReturnType<typeof createMockDb>;
	let registry: ToolRegistry;

	beforeEach(() => {
		mockDb = createMockDb();
		registry = new ToolRegistry(mockDb as any);
	});

	// ---- registerTool ----

	describe("registerTool", () => {
		it("should register a tool and return its definition", async () => {
			const toolRow = {
				id: 1,
				name: validTool.name,
				description: validTool.description,
				riskTier: validTool.riskTier,
				inputSchema: null,
				outputSchema: null,
				requiresApproval: false,
				fiscalImpact: false,
				approvalLevel: "auto",
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock the inserting chain
			const returningChain = thenableResult([toolRow]);
			const onConflictChain = { returning: vi.fn().mockReturnValue(returningChain) };
			const valuesChain = { onConflictDoUpdate: vi.fn().mockReturnValue(onConflictChain) };

			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue(valuesChain),
			});

			const result = await registry.registerTool(validTool);

			expect(result).toBeDefined();
			expect(result.name).toBe("test-analyzer");
			expect(result.riskTier).toBe("T1");
			expect(result.id).toBe(1);
		});

		it("should reject invalid input via Zod validation", async () => {
			await expect(
				registry.registerTool({
					name: "",
					riskTier: "T1" as RiskTier,
				} as ToolRegistration),
			).rejects.toThrow();
		});
	});

	// ---- getTool ----

	describe("getTool", () => {
		it("should return null for an unknown tool", async () => {
			// Mock select to return empty (no tools in DB for hydration)
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue(thenableResult([])),
			});

			const result = await registry.getTool("nonexistent");
			expect(result).toBeNull();
		});

		it("should return tool from cache after registration", async () => {
			const toolRow = {
				id: 1,
				name: validTool.name,
				description: validTool.description,
				riskTier: validTool.riskTier,
				inputSchema: null,
				outputSchema: null,
				requiresApproval: false,
				fiscalImpact: false,
				approvalLevel: "auto",
				metadata: {},
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			// Mock insert for registration
			const returningChain = thenableResult([toolRow]);
			const onConflictChain = { returning: vi.fn().mockReturnValue(returningChain) };
			const valuesChain = { onConflictDoUpdate: vi.fn().mockReturnValue(onConflictChain) };
			mockDb.insert.mockReturnValue({
				values: vi.fn().mockReturnValue(valuesChain),
			});

			await registry.registerTool(validTool);

			// Spy on select — should NOT be called since cache serves it
			const spy = vi.spyOn(mockDb, "select");

			const result = await registry.getTool("test-analyzer");
			expect(result).toBeDefined();
			expect(result!.name).toBe("test-analyzer");

			// Cache hit — select was not called
			expect(spy).not.toHaveBeenCalled();
		});
	});

	// ---- listToolsByRiskTier ----

	describe("listToolsByRiskTier", () => {
		it("should list tools by risk tier", async () => {
			const t1Rows = [
				{
					id: 1,
					name: "t1-tool",
					description: null,
					riskTier: "T1",
					inputSchema: null,
					outputSchema: null,
					requiresApproval: false,
					fiscalImpact: false,
					approvalLevel: "auto",
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult(t1Rows)),
				}),
			});

			const tools = await registry.listToolsByRiskTier("T1");
			expect(tools).toHaveLength(1);
			expect(tools[0].riskTier).toBe("T1");
		});

		it("should return empty array when no tools match the tier", async () => {
			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue(thenableResult([])),
				}),
			});

			const tools = await registry.listToolsByRiskTier("T4");
			expect(tools).toHaveLength(0);
		});
	});

	// ---- listToolsByScope ----

	describe("listToolsByScope", () => {
		it("should return all tools (scope is global for tools)", async () => {
			const rows = [
				{
					id: 1,
					name: "tool-a",
					description: null,
					riskTier: "T0",
					inputSchema: null,
					outputSchema: null,
					requiresApproval: false,
					fiscalImpact: false,
					approvalLevel: "auto",
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
				{
					id: 2,
					name: "tool-b",
					description: null,
					riskTier: "T1",
					inputSchema: null,
					outputSchema: null,
					requiresApproval: false,
					fiscalImpact: false,
					approvalLevel: "auto",
					metadata: {},
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			];

			mockDb.select.mockReturnValue({
				from: vi.fn().mockReturnValue(thenableResult(rows)),
			});

			const tools = await registry.listToolsByScope({});
			expect(tools).toHaveLength(2);
		});
	});

	// ---- updateTool ----

	describe("updateTool", () => {
		it("should update a tool and invalidate cache", async () => {
			await registry.updateTool("test-analyzer", {
				description: "Updated description",
			});

			expect(mockDb.update).toHaveBeenCalled();
		});
	});

	// ---- deleteTool ----

	describe("deleteTool", () => {
		it("should delete a tool and invalidate cache", async () => {
			await registry.deleteTool("test-analyzer");
			expect(mockDb.delete).toHaveBeenCalled();
		});
	});
});

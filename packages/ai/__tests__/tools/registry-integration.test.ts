import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { RiskTier } from "../../src/control-plane/contracts";
import { ToolRegistry } from "../../src/control-plane/tool-registry";

// ============================================================================
// Mock Drizzle query helpers (same pattern as tool-registry.test.ts)
// ============================================================================

function thenableResult<T = unknown>(rows: T) {
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

	return { insert, select, update, delete: del, returning };
}

// ============================================================================
// Shared test data
// ============================================================================

const emptyRecordSchema = z.object({});

const personSchema = z.object({
	name: z.string(),
	age: z.number(),
});

// ============================================================================
// Tests
// ============================================================================

describe("ToolRegistry — Zod schema integration", () => {
	it("registerTool with zodSchema auto-converts to JSON Schema", async () => {
		const mockDb = createMockDb();
		const registry = new ToolRegistry(mockDb as never);

		// Capture what gets passed to the DB insert
		let insertedValues: Record<string, unknown> | undefined;
		mockDb.insert.mockReturnValue({
			values: vi.fn((v: Record<string, unknown>) => {
				insertedValues = v;
				return {
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: mockDb.returning.mockResolvedValue([
							{
								id: 1,
								name: "zod_tool",
								description: null,
								riskTier: "T1",
								inputSchema: v.inputSchema as Record<string, unknown>,
								outputSchema: null,
								requiresApproval: false,
								fiscalImpact: false,
								approvalLevel: "auto",
								metadata: {},
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]),
					}),
				};
			}),
		});

		await registry.registerTool({
			name: "zod_tool",
			description: "A tool registered with a Zod schema",
			riskTier: "T1" as RiskTier,
			zodSchema: personSchema,
		});

		// Verify auto-conversion happened
		expect(insertedValues).toBeDefined();
		const stored = insertedValues!.inputSchema as Record<string, unknown>;
		expect(stored).toBeDefined();
		expect(stored.type).toBe("object");
		expect(stored.properties).toBeDefined();

		const props = stored.properties as Record<string, unknown>;
		expect(props.name).toBeDefined();
		expect(props.age).toBeDefined();

		// additionalProperties should be false
		expect(stored.additionalProperties).toBe(false);
	});

	it("registerTool with zodSchema on empty object produces valid JSON Schema", async () => {
		const mockDb = createMockDb();
		const registry = new ToolRegistry(mockDb as never);

		let insertedValues: Record<string, unknown> | undefined;
		mockDb.insert.mockReturnValue({
			values: vi.fn((v: Record<string, unknown>) => {
				insertedValues = v;
				return {
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: mockDb.returning.mockResolvedValue([
							{
								id: 2,
								name: "empty_zod_tool",
								description: null,
								riskTier: "T0",
								inputSchema: v.inputSchema as Record<string, unknown>,
								outputSchema: null,
								requiresApproval: false,
								fiscalImpact: false,
								approvalLevel: "auto",
								metadata: {},
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]),
					}),
				};
			}),
		});

		await registry.registerTool({
			name: "empty_zod_tool",
			riskTier: "T0" as RiskTier,
			zodSchema: emptyRecordSchema,
		});

		const stored = insertedValues!.inputSchema as Record<string, unknown>;
		expect(stored.type).toBe("object");
		expect(stored.properties).toEqual({});
		expect(stored.additionalProperties).toBe(false);
	});

	it("registerTool without zodSchema stores raw inputSchema as-is (backward compat)", async () => {
		const mockDb = createMockDb();
		const registry = new ToolRegistry(mockDb as never);

		let insertedValues: Record<string, unknown> | undefined;
		mockDb.insert.mockReturnValue({
			values: vi.fn((v: Record<string, unknown>) => {
				insertedValues = v;
				return {
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: mockDb.returning.mockResolvedValue([
							{
								id: 3,
								name: "raw_tool",
								description: null,
								riskTier: "T1",
								inputSchema: v.inputSchema as Record<string, unknown>,
								outputSchema: null,
								requiresApproval: false,
								fiscalImpact: false,
								approvalLevel: "auto",
								metadata: {},
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]),
					}),
				};
			}),
		});

		const rawSchema = { type: "object", properties: { x: { type: "string" } } };

		await registry.registerTool({
			name: "raw_tool",
			riskTier: "T1" as RiskTier,
			inputSchema: rawSchema,
		});

		const stored = insertedValues!.inputSchema as Record<string, unknown>;
		// Should be stored as-is (exact same object)
		expect(stored).toEqual(rawSchema);
		// Should NOT have auto-converted (no zodSchema present)
		expect(stored.additionalProperties).toBeUndefined();
	});

	it("zodSchema takes precedence when both zodSchema and inputSchema are provided", async () => {
		const mockDb = createMockDb();
		const registry = new ToolRegistry(mockDb as never);

		let insertedValues: Record<string, unknown> | undefined;
		mockDb.insert.mockReturnValue({
			values: vi.fn((v: Record<string, unknown>) => {
				insertedValues = v;
				return {
					onConflictDoUpdate: vi.fn().mockReturnValue({
						returning: mockDb.returning.mockResolvedValue([
							{
								id: 4,
								name: "both_tool",
								description: null,
								riskTier: "T1",
								inputSchema: v.inputSchema as Record<string, unknown>,
								outputSchema: null,
								requiresApproval: false,
								fiscalImpact: false,
								approvalLevel: "auto",
								metadata: {},
								createdAt: new Date(),
								updatedAt: new Date(),
							},
						]),
					}),
				};
			}),
		});

		// Both zodSchema and inputSchema provided — zodSchema should win
		await registry.registerTool({
			name: "both_tool",
			riskTier: "T1" as RiskTier,
			inputSchema: { type: "object", properties: { old: { type: "string" } } },
			zodSchema: personSchema,
		});

		const stored = insertedValues!.inputSchema as Record<string, unknown>;
		expect(stored.type).toBe("object");
		const props = stored.properties as Record<string, unknown>;
		// PersonSchema has name and age (not "old")
		expect(props.name).toBeDefined();
		expect(props.age).toBeDefined();
		expect(props.old).toBeUndefined();
		// Zod schema adds additionalProperties: false
		expect(stored.additionalProperties).toBe(false);
	});
});

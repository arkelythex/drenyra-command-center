import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	const record = {
		id: "rule-123",
		companyId: "cmp-abc123",
		name: "Exact Match",
		ruleType: "MATCH",
		conditions: { amountTolerance: 0, dateTolerance: 0 },
		priority: 10,
		isActive: true,
		createdAt: new Date(),
	};
	return {
		mockFindFirst: vi.fn(),
		mockFindMany: vi.fn(),
		mockInsert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(() => Promise.resolve([record])),
			})),
		})),
		mockUpdate: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(() => Promise.resolve([record])),
				})),
			})),
		})),
	};
});

vi.mock("@drenyra/persistence/client", () => ({
	db: {
		insert: mocks.mockInsert,
		query: {
			reconciliationRules: {
				findFirst: mocks.mockFindFirst,
				findMany: mocks.mockFindMany,
			},
		},
		update: mocks.mockUpdate,
	},
}));

vi.mock("@drenyra/persistence/query", () => ({
	and: (...args: unknown[]) => args,
	eq: (_a: unknown, _b: unknown) => ({ field: _a, value: _b }),
}));

vi.mock("@drenyra/persistence/schema", () => ({
	reconciliationRules: {},
}));

import type { CompanyContext } from "../../../../shared/plugins/company-scope-guard";
import { reconciliationRuleHandlers } from "../../api/reconciliation-rule.handlers";

function makeSet() {
	return { status: undefined as number | string | undefined };
}

describe("ReconciliationRule Handlers", () => {
	const ctx = {
		companyId: "cmp-abc123",
		legacyUserId: "user-999",
	} as CompanyContext;

	beforeEach(() => {
		vi.clearAllMocks();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("createRule", () => {
		it("rejects without company context", async () => {
			const set = makeSet();
			await reconciliationRuleHandlers.createRule({
				body: {
					name: "Test",
					ruleType: "MATCH",
					conditions: {},
					priority: 10,
					isActive: true,
				},
				companyContext: undefined,
				set,
			});
			expect(set.status).toBe(401);
		});
		it("creates with valid data", async () => {
			const set = makeSet();
			const r = await reconciliationRuleHandlers.createRule({
				body: {
					name: "Exact",
					ruleType: "MATCH",
					conditions: {},
					priority: 10,
					isActive: true,
				},
				companyContext: ctx,
				set,
			});
			expect(r).toHaveProperty("success", true);
		});
	});

	describe("listRules", () => {
		it("returns empty when no rules", async () => {
			mocks.mockFindMany.mockResolvedValue([]);
			const set = makeSet();
			await reconciliationRuleHandlers.listRules({ companyContext: ctx, set });
			expect(set.status).toBeUndefined();
		});
	});

	describe("getRule", () => {
		it("returns 404 when not found", async () => {
			mocks.mockFindFirst.mockResolvedValue(null);
			const set = makeSet();
			await reconciliationRuleHandlers.getRule({
				params: { id: "bad" },
				companyContext: ctx,
				set,
			});
			expect(set.status).toBe(404);
		});
	});

	describe("updateRule", () => {
		it("returns 404 when not found", async () => {
			mocks.mockFindFirst.mockResolvedValue(null);
			const set = makeSet();
			await reconciliationRuleHandlers.updateRule({
				params: { id: "bad" },
				body: { name: "Updated" },
				companyContext: ctx,
				set,
			});
			expect(set.status).toBe(404);
		});
	});

	describe("deleteRule", () => {
		it("rejects without company context", async () => {
			const set = makeSet();
			await reconciliationRuleHandlers.deleteRule({
				params: { id: "x" },
				companyContext: undefined,
				set,
			});
			expect(set.status).toBe(401);
		});
	});
});

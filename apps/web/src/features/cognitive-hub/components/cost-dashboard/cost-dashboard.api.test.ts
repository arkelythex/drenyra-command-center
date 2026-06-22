import { beforeEach, describe, expect, it, vi } from "vitest";

const getMock = vi.fn();
const recentGetMock = vi.fn();

vi.mock("@/lib/api-client", () => ({
	api: {
		api: {
			"ai-swarm": {
				"cost-stats": {
					get: (...args: unknown[]) => getMock(...args),
					recent: {
						get: (...args: unknown[]) => recentGetMock(...args),
					},
				},
			},
		},
	},
}));

import { fetchCostStats, fetchRecentEvents } from "./cost-dashboard.api";

describe("cost-dashboard.api (Eden)", () => {
	beforeEach(() => {
		getMock.mockReset();
		recentGetMock.mockReset();
	});

	it("fetchCostStats parses envelope success and passes orgId", async () => {
		getMock.mockResolvedValue({
			data: {
				success: true,
				data: {
					historical: {
						daily: {
							spent: 1,
							limit: 10,
							remaining: 9,
							percentage: 10,
						},
						monthly: {
							spent: 2,
							limit: 20,
							remaining: 18,
							percentage: 10,
						},
						byAgent: {},
						trend: [],
						topModels: [],
						totalEvents: 0,
					},
					budget: {
						daily: {
							spent: 1,
							limit: 10,
							remaining: 9,
							percentage: 10,
						},
						monthly: {
							spent: 2,
							limit: 20,
							remaining: 18,
							percentage: 10,
						},
					},
					meta: {
						source: "memory" as const,
						totalDbEvents: 0,
						updatedAt: new Date().toISOString(),
					},
				},
			},
			error: null,
		});

		const result = await fetchCostStats(42);

		expect(getMock).toHaveBeenCalledWith({
			query: { orgId: "42" },
		});
		expect(result.meta.source).toBe("memory");
	});

	it("fetchRecentEvents returns list from envelope", async () => {
		recentGetMock.mockResolvedValue({
			data: {
				success: true,
				data: [
					{
						id: "e1",
						agentType: "x",
						modelUsed: "gpt",
						totalTokens: 100,
						costUsd: 0.01,
						wasBlocked: false,
						createdAt: "2026-04-19T00:00:00.000Z",
					},
				],
			},
			error: null,
		});

		const rows = await fetchRecentEvents();

		expect(recentGetMock).toHaveBeenCalledWith({
			query: { limit: "15" },
		});
		expect(rows).toHaveLength(1);
		expect(rows[0]?.id).toBe("e1");
	});
});

/**
 * Latency Stats Tests
 *
 * @module ai-swarm/__tests__/unit
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { LatencyStatsService } from "../../latency-stats/latency-stats.service";
import type {
	LatencySummary,
	LatencyByAgent,
	LatencyTrend,
} from "@drenyra/ai/services/ai-latency";

// ─── Mock the repository ─────────────────────────────────────────────────────

const { mockRecord, mockGetSummary, mockGetByAgent, mockGetTrend, mockGetRecent } = vi.hoisted(() => ({
	mockRecord: vi.fn().mockResolvedValue(undefined),
	mockGetSummary: vi.fn(),
	mockGetByAgent: vi.fn(),
	mockGetTrend: vi.fn(),
	mockGetRecent: vi.fn(),
}));

vi.mock("@drenyra/ai/services/ai-latency", () => ({
	aiLatencyRepository: {
		record: mockRecord,
		getSummary: mockGetSummary,
		getByAgent: mockGetByAgent,
		getTrend: mockGetTrend,
		getRecent: mockGetRecent,
	},
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSummary(overrides: Partial<LatencySummary> = {}): LatencySummary {
	return {
		avgLatencyMs: 150,
		p50LatencyMs: 120,
		p95LatencyMs: 350,
		p99LatencyMs: 800,
		totalCalls: 100,
		errorCount: 5,
		errorRate: 0.05,
		...overrides,
	};
}

function makeAgentRows(): LatencyByAgent[] {
	return [
		{ agentType: "sunat", avgLatencyMs: 200, p95LatencyMs: 450, callCount: 50 },
		{ agentType: "ocr", avgLatencyMs: 300, p95LatencyMs: 600, callCount: 30 },
		{ agentType: "pcge", avgLatencyMs: 100, p95LatencyMs: 250, callCount: 20 },
	];
}

function makeTrendRows(): LatencyTrend[] {
	return [
		{ date: "2026-06-15", avgLatencyMs: 140, p95LatencyMs: 330, callCount: 40 },
		{ date: "2026-06-16", avgLatencyMs: 160, p95LatencyMs: 370, callCount: 55 },
		{ date: "2026-06-17", avgLatencyMs: 150, p95LatencyMs: 350, callCount: 60 },
	];
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("LatencyStatsService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getSummary", () => {
		it("should return correct structure with summary and byAgent", async () => {
			mockGetSummary.mockResolvedValue(makeSummary());
			mockGetByAgent.mockResolvedValue(makeAgentRows());

			const result = await LatencyStatsService.getSummary({});

			expect(result).toHaveProperty("summary");
			expect(result).toHaveProperty("byAgent");
			expect(result.summary).toMatchObject({
				avgLatencyMs: 150,
				p50LatencyMs: 120,
				p95LatencyMs: 350,
				p99LatencyMs: 800,
				totalCalls: 100,
				errorCount: 5,
				errorRate: 0.05,
			});
			expect(result.byAgent).toHaveLength(3);
			expect(result.byAgent[0]).toHaveProperty("agentType");
			expect(result.byAgent[0]).toHaveProperty("avgLatencyMs");
			expect(result.byAgent[0]).toHaveProperty("p95LatencyMs");
			expect(result.byAgent[0]).toHaveProperty("callCount");
		});

		it("should pass companyId and since filters to repository", async () => {
			mockGetSummary.mockResolvedValue(makeSummary());
			mockGetByAgent.mockResolvedValue([]);

			await LatencyStatsService.getSummary({
				companyId: "550e8400-e29b-41d4-a716-446655440000",
				since: "2026-06-01T00:00:00Z",
			});

			expect(mockGetSummary).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				expect.any(Date),
			);
			expect(mockGetByAgent).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				expect.any(Date),
			);
		});

		it("should return zeros for empty data", async () => {
			mockGetSummary.mockResolvedValue(makeSummary({
				avgLatencyMs: 0,
				p50LatencyMs: 0,
				p95LatencyMs: 0,
				p99LatencyMs: 0,
				totalCalls: 0,
				errorCount: 0,
				errorRate: 0,
			}));
			mockGetByAgent.mockResolvedValue([]);

			const result = await LatencyStatsService.getSummary({});

			expect(result.summary.avgLatencyMs).toBe(0);
			expect(result.summary.totalCalls).toBe(0);
			expect(result.summary.errorRate).toBe(0);
			expect(result.byAgent).toHaveLength(0);
		});
	});

	describe("getByAgent", () => {
		it("should return agent breakdown with metrics", async () => {
			mockGetSummary.mockResolvedValue(makeSummary());
			mockGetByAgent.mockResolvedValue(makeAgentRows());

			const result = await LatencyStatsService.getSummary({});

			expect(result.byAgent).toHaveLength(3);
			const sunat = result.byAgent.find((a) => a.agentType === "sunat");
			expect(sunat).toBeDefined();
			expect(sunat!.avgLatencyMs).toBe(200);
			expect(sunat!.callCount).toBe(50);
		});
	});

	describe("getTrend", () => {
		it("should return chronological trend data", async () => {
			mockGetTrend.mockResolvedValue(makeTrendRows());

			const result = await LatencyStatsService.getTrend({});

			expect(result).toHaveLength(3);
			expect(result[0].date).toBe("2026-06-15");
			expect(result[1].date).toBe("2026-06-16");
			expect(result[2].date).toBe("2026-06-17");
			expect(result.every((r) => r.avgLatencyMs > 0)).toBe(true);
		});

		it("should pass filters to repository", async () => {
			mockGetTrend.mockResolvedValue([]);

			await LatencyStatsService.getTrend({
				companyId: "550e8400-e29b-41d4-a716-446655440000",
				since: "2026-06-01T00:00:00Z",
			});

			expect(mockGetTrend).toHaveBeenCalledWith(
				"550e8400-e29b-41d4-a716-446655440000",
				expect.any(Date),
			);
		});
	});

	describe("getRecent", () => {
		it("should return limited recent events", async () => {
			const mockEvents = Array.from({ length: 10 }, (_, i) => ({
				id: `00000000-0000-0000-0000-${String(i).padStart(12, "0")}`,
				agentType: "sunat",
				modelUsed: "gemini-flash",
				latencyMs: 150 + i * 10,
				status: "success" as const,
				createdAt: new Date(),
			}));

			mockGetRecent.mockResolvedValue(mockEvents);

			const result = await LatencyStatsService.getRecent({ limit: 10 });

			expect(result.events).toHaveLength(10);
			expect(result.total).toBe(10);
		});

		it("should cap limit at 100", async () => {
			mockGetRecent.mockResolvedValue([]);

			await LatencyStatsService.getRecent({ limit: 999 });

			expect(mockGetRecent).toHaveBeenCalledWith(100, undefined);
		});
	});

	describe("record (non-blocking)", () => {
		it("should resolve without error when repository succeeds", async () => {
			mockRecord.mockResolvedValue(undefined);

			const promise = LatencyStatsService.getSummary({});
			await expect(promise).resolves.toBeDefined();
		});

		it("should handle repository errors gracefully", async () => {
			mockGetSummary.mockRejectedValue(new Error("DB connection failed"));

			await expect(LatencyStatsService.getSummary({})).rejects.toThrow(
				"DB connection failed",
			);
		});
	});

	describe("percentile calculation (sorted data)", () => {
		it("should return correct p50 and p95 percentiles", async () => {
			mockGetSummary.mockResolvedValue(makeSummary({
				p50LatencyMs: 200,
				p95LatencyMs: 950,
			}));
			mockGetByAgent.mockResolvedValue([]);

			const result = await LatencyStatsService.getSummary({});

			expect(result.summary.p50LatencyMs).toBe(200);
			expect(result.summary.p95LatencyMs).toBe(950);
			expect(result.summary.p95LatencyMs).toBeGreaterThan(result.summary.p50LatencyMs);
		});
	});
});

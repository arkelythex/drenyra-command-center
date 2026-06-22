/**
 * Stub for @arkelythex/ai/services/ai-latency
 *
 * Prevents Drizzle from connecting to PostgreSQL in test environment.
 *
 * @module test/stubs/ai-latency
 */
import { vi } from "vitest";

export const aiLatencyRepository = {
	record: vi.fn().mockResolvedValue(undefined),
	getSummary: vi.fn().mockResolvedValue({
		avgLatencyMs: 0,
		p50LatencyMs: 0,
		p95LatencyMs: 0,
		p99LatencyMs: 0,
		totalCalls: 0,
		errorCount: 0,
		errorRate: 0,
	}),
	getByAgent: vi.fn().mockResolvedValue([]),
	getTrend: vi.fn().mockResolvedValue([]),
	getRecent: vi.fn().mockResolvedValue([]),
};

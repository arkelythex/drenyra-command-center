/**
 * Latency Stats Zod Schemas
 *
 * @module ai-swarm/latency-stats
 */

import { z } from "zod";

/**
 * Query schema for latency summary endpoints.
 */
export const LatencySummaryQuerySchema = z.object({
	since: z.string().datetime().optional(),
	companyId: z.string().uuid(),
});

export type LatencySummaryQuery = z.infer<typeof LatencySummaryQuerySchema>;

/**
 * Query schema for latency trend endpoints.
 */
export const LatencyTrendQuerySchema = z.object({
	since: z.string().datetime().optional(),
	companyId: z.string().uuid(),
});

export type LatencyTrendQuery = z.infer<typeof LatencyTrendQuerySchema>;

/**
 * Query schema for latency recent events endpoints.
 */
export const LatencyRecentQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(20),
	companyId: z.string().uuid(),
});

export type LatencyRecentQuery = z.infer<typeof LatencyRecentQuerySchema>;

/**
 * Response schema for latency summary.
 */
export const LatencySummaryResponseSchema = z.object({
	avgLatencyMs: z.number(),
	p50LatencyMs: z.number(),
	p95LatencyMs: z.number(),
	p99LatencyMs: z.number(),
	totalCalls: z.number().int(),
	errorCount: z.number().int(),
	errorRate: z.number(),
});

export type LatencySummaryResponse = z.infer<
	typeof LatencySummaryResponseSchema
>;

/**
 * Latency breakdown by agent type.
 */
export const LatencyByAgentItemSchema = z.object({
	agentType: z.string(),
	avgLatencyMs: z.number(),
	p95LatencyMs: z.number(),
	callCount: z.number().int(),
});

export type LatencyByAgentItem = z.infer<typeof LatencyByAgentItemSchema>;

/**
 * Latency trend data point.
 */
export const LatencyTrendItemSchema = z.object({
	date: z.string(),
	avgLatencyMs: z.number(),
	p95LatencyMs: z.number(),
	callCount: z.number().int(),
});

export type LatencyTrendItem = z.infer<typeof LatencyTrendItemSchema>;

/**
 * Recent latency event.
 */
export const LatencyRecentEventSchema = z.object({
	id: z.string().uuid(),
	agentType: z.string(),
	modelUsed: z.string(),
	latencyMs: z.number().int(),
	status: z.enum(["success", "failure"]),
	createdAt: z.date(),
});

export type LatencyRecentEvent = z.infer<typeof LatencyRecentEventSchema>;

/**
 * Combined summary response with by-agent breakdown.
 */
export const LatencyCombinedResponseSchema = z.object({
	summary: LatencySummaryResponseSchema,
	byAgent: z.array(LatencyByAgentItemSchema),
});

export type LatencyCombinedResponse = z.infer<
	typeof LatencyCombinedResponseSchema
>;

/**
 * Recent list response.
 */
export const LatencyRecentResponseSchema = z.object({
	events: z.array(LatencyRecentEventSchema),
	total: z.number().int(),
});

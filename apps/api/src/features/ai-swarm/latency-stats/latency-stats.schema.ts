/**
 * Latency Stats Elysia OpenAPI Schemas
 *
 * @module ai-swarm/latency-stats
 */

import { t } from "elysia";

/**
 * Query schema for GET /latency-stats
 */
export const LatencySummaryQuerySchema = t.Object({
	since: t.Optional(
		t.String({
			description: "ISO date filter (return data after this timestamp)",
		}),
	),
	companyId: t.String({ description: "UUID of the company to filter by" }),
});

/**
 * Query schema for GET /latency-stats/trend
 */
export const LatencyTrendQuerySchema = t.Object({
	since: t.Optional(t.String({ description: "ISO date filter" })),
	companyId: t.String({ description: "UUID of the company to filter by" }),
});

/**
 * Query schema for GET /latency-stats/recent
 */
export const LatencyRecentQuerySchema = t.Object({
	limit: t.Optional(
		t.String({ default: "20", description: "Max results (1–100)" }),
	),
	companyId: t.String({ description: "UUID of the company to filter by" }),
});

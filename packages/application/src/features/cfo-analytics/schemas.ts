/**
 * CFO Analytics — Validation schemas.
 *
 * Shared between backend API and frontend for consistent validation.
 * Types are derived via z.infer for single-source-of-truth.
 *
 * @module @drenyra/application/cfo-analytics/schemas
 */

import { z } from "zod";

// ─── Query Schemas ───────────────────────────────────────────────

export const CfoQuerySchema = z.object({
	companyId: z.string().uuid(),
	currency: z.union([z.literal("PEN"), z.literal("USD")]).optional(),
});

export const CfoDateRangeQuerySchema = CfoQuerySchema.extend({
	startDate: z.string().optional(),
	endDate: z.string().optional(),
});

export const CfoPeriodQuerySchema = CfoQuerySchema.extend({
	period: z
		.union([z.literal("monthly"), z.literal("quarterly"), z.literal("yearly")])
		.optional(),
});

// ─── Body Schemas ────────────────────────────────────────────────

export const SaveConfigSchema = z.object({
	companyId: z.string().uuid(),
	name: z.string().min(1).max(255),
	config: z.object({
		widgets: z.array(
			z.object({
				id: z.string(),
				type: z.string(),
				position: z.object({
					x: z.number(),
					y: z.number(),
					w: z.number(),
					h: z.number(),
				}),
			}),
		),
		layout: z.string(),
	}),
});

export const GenerateReportSchema = z.object({
	companyId: z.string().uuid(),
	type: z.union([
		z.literal("financial"),
		z.literal("tax"),
		z.literal("client"),
		z.literal("custom"),
	]),
	period: z.string().optional(),
	parameters: z.record(z.string(), z.unknown()).optional(),
});

// ─── Derived Types ───────────────────────────────────────────────

export type CfoQuery = z.infer<typeof CfoQuerySchema>;
export type CfoDateRangeQuery = z.infer<typeof CfoDateRangeQuerySchema>;
export type CfoPeriodQuery = z.infer<typeof CfoPeriodQuerySchema>;
export type SaveConfigBody = z.infer<typeof SaveConfigSchema>;
export type GenerateReportBody = z.infer<typeof GenerateReportSchema>;

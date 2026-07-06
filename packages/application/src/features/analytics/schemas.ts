import { z } from "zod";

/**
 * Zod schema for analytics endpoints that support date range filtering and currency selection.
 */
export const AnalyticsQuerySchema = z.object({
	companyId: z.string().uuid(),
	startDate: z.string().optional(),
	endDate: z.string().optional(),
	currency: z.union([z.literal("PEN"), z.literal("USD")]).optional(),
});

/**
 * Zod schema for analytics endpoints that only require company identification.
 */
export const OperationalQuerySchema = z.object({
	companyId: z.string().uuid(),
});

export type AnalyticsQuery = z.infer<typeof AnalyticsQuerySchema>;
export type OperationalQuery = z.infer<typeof OperationalQuerySchema>;

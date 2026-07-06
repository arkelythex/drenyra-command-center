import { z } from "zod";

export const DetractionItemSchema = z.object({
	id: z.string(),
	reference: z.string(),
	spotCode: z.string(),
	percentage: z.number(),
	amountCents: z.number(),
	status: z.enum(["pendiente", "depositado", "usado", "liberado"]),
	createdAt: z.string(),
});

export const ListDetractionsQuerySchema = z.object({
	companyId: z.string().uuid().optional(),
	status: z.enum(["pendiente", "depositado", "usado", "liberado"]).optional(),
});

export const ListDetractionsResponseSchema = z.array(DetractionItemSchema);

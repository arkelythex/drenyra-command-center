import { z } from "zod";
export const OCRResultSchema = z.object({
	text: z.string().optional(),
	confidence: z.number().min(0).max(1).optional(),
	language: z.string().optional(),
	processing_time_ms: z.number().optional(),
	series: z.string().optional(),
	number: z.union([z.string(), z.number()]).optional(),
	issueDate: z.union([z.string(), z.date()]).optional(),
	clientName: z.string().optional(),
	clientRuc: z.string().optional(),
	base: z.number().optional(),
	igv: z.number().optional(),
	total: z.number().optional(),
	currency: z.string().optional(),
	fields: z.record(z.string(), z.unknown()).optional(),
});
export const InvoiceSchema = z
	.object({
		series: z.string().optional(),
		number: z.string().optional(),
		clientRuc: z.string().optional(),
	})
	.passthrough();
export function validateInvoice(input) {
	const result = InvoiceSchema.safeParse(input);
	return {
		isValid: result.success,
		errors: result.success ? undefined : result.error.issues,
	};
}
//# sourceMappingURL=invoice.js.map

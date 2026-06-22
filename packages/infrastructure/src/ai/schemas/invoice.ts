import { z } from "zod";

/**
 * OCRResultSchema const.
 *
 * @example
 * ```ts
 * console.log(OCRResultSchema);
 * ```
 */
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

/**
 * OCRResult type.
 *
 * @example
 * ```ts
 * const value: OCRResult = {} as OCRResult;
 * console.log(value);
 * ```
 */
export type OCRResult = z.infer<typeof OCRResultSchema>;

/**
 * InvoiceSchema const.
 *
 * @example
 * ```ts
 * console.log(InvoiceSchema);
 * ```
 */
export const InvoiceSchema = z
	.object({
		series: z.string().optional(),
		number: z.string().optional(),
		clientRuc: z.string().optional(),
	})
	.passthrough();

/**
 * Invoice type.
 *
 * @example
 * ```ts
 * const value: Invoice = {} as Invoice;
 * console.log(value);
 * ```
 */
export type Invoice = z.infer<typeof InvoiceSchema>;

/**
 * validateInvoice operation.
 *
 * @param input - Input for input.
 * @returns Result of validateInvoice.
 * @example
 * ```ts
 * const result = validateInvoice(undefined);
 * console.log(result);
 * ```
 */
export function validateInvoice(input: unknown): {
	isValid: boolean;
	errors?: z.ZodIssue[];
} {
	const result = InvoiceSchema.safeParse(input);
	return {
		isValid: result.success,
		errors: result.success ? undefined : result.error.issues,
	};
}

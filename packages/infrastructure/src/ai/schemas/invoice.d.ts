import { z } from "zod";
export declare const OCRResultSchema: z.ZodObject<
	{
		text: z.ZodOptional<z.ZodString>;
		confidence: z.ZodOptional<z.ZodNumber>;
		language: z.ZodOptional<z.ZodString>;
		processing_time_ms: z.ZodOptional<z.ZodNumber>;
		series: z.ZodOptional<z.ZodString>;
		number: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>>;
		issueDate: z.ZodOptional<z.ZodUnion<readonly [z.ZodString, z.ZodDate]>>;
		clientName: z.ZodOptional<z.ZodString>;
		clientRuc: z.ZodOptional<z.ZodString>;
		base: z.ZodOptional<z.ZodNumber>;
		igv: z.ZodOptional<z.ZodNumber>;
		total: z.ZodOptional<z.ZodNumber>;
		currency: z.ZodOptional<z.ZodString>;
		fields: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
	},
	z.core.$strip
>;
export type OCRResult = z.infer<typeof OCRResultSchema>;
export declare const InvoiceSchema: z.ZodObject<
	{
		series: z.ZodOptional<z.ZodString>;
		number: z.ZodOptional<z.ZodString>;
		clientRuc: z.ZodOptional<z.ZodString>;
	},
	z.core.$loose
>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export declare function validateInvoice(input: unknown): {
	isValid: boolean;
	errors?: z.ZodIssue[];
};
//# sourceMappingURL=invoice.d.ts.map

import { z } from "zod";

const invoiceAmountSchema = z.union([z.string(), z.number()]);

export const invoiceItemSchema = z.object({
	description: z.string().min(1, "Descripción requerida"),
	quantity: invoiceAmountSchema,
	unitPrice: invoiceAmountSchema,
	total: invoiceAmountSchema,
});

export const invoiceSchema = z.object({
	series: z.string().min(1, "Serie requerida"),
	number: z.string().min(1, "Número requerido"),
	subtotal: invoiceAmountSchema.optional(),
	tax: invoiceAmountSchema,
	total: invoiceAmountSchema,
	issueDate: z.string().min(1, "Fecha de emisión requerida"),
	dueDate: z.string().optional(),
	customerTaxId: z.string().min(1, "Documento del cliente requerido"),
	customerName: z.string().optional(),
	customerAddress: z.string().optional(),
	currency: z.string().optional(),
	items: z.array(invoiceItemSchema).optional(),
});

export type Invoice = z.infer<typeof invoiceSchema>;
export type InvoiceItem = z.infer<typeof invoiceItemSchema>;

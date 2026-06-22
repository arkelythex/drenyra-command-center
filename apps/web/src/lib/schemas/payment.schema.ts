import { z } from "zod";

export const paymentMethodEnum = z.enum([
	"CASH",
	"TRANSFER",
	"CARD",
	"CHECK",
	"YAPE",
	"PLIN",
]);

export const paymentSchema = z.object({
	id: z.string().optional(),
	invoiceId: z.string().min(1, "ID de factura requerido"),
	companyId: z.string().min(1, "ID de empresa requerido"),
	amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
	paymentMethod: paymentMethodEnum,
	paymentDate: z.date(),
	reference: z.string().optional(),
	notes: z
		.string()
		.max(500, "Las notas no pueden exceder 500 caracteres")
		.optional(),
	createdAt: z.date().optional(),
	updatedAt: z.date().optional(),
});

export const paymentRecordSchema = z.object({
	id: z.string().min(1, "ID de pago requerido"),
	invoiceId: z.string().min(1, "ID de factura requerido"),
	companyId: z.string().min(1, "ID de empresa requerido"),
	amount: z.coerce.number().min(0.01, "El monto debe ser mayor a 0"),
	paymentMethod: paymentMethodEnum,
	paymentDate: z.coerce.date(),
	reference: z.string().optional(),
	notes: z
		.string()
		.max(500, "Las notas no pueden exceder 500 caracteres")
		.optional(),
	createdAt: z.coerce.date().optional(),
	updatedAt: z.coerce.date().optional(),
});

export const paymentSummarySchema = z.object({
	invoiceTotal: z.coerce.number(),
	totalPaid: z.coerce.number(),
	remaining: z.coerce.number(),
	paid: z.coerce.number().optional(),
	pending: z.coerce.number().optional(),
	paymentCount: z.coerce.number().optional(),
});

export type Payment = z.infer<typeof paymentSchema>;
export type CreatePaymentDTO = Omit<Payment, "id" | "createdAt" | "updatedAt">;
export type PaymentMethod = z.infer<typeof paymentMethodEnum>;
export type PaymentRecord = z.infer<typeof paymentRecordSchema>;
export type PaymentSummary = z.infer<typeof paymentSummarySchema>;

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
	CASH: "Efectivo",
	TRANSFER: "Transferencia Bancaria",
	CARD: "Tarjeta",
	CHECK: "Cheque",
	YAPE: "Yape",
	PLIN: "Plin",
};

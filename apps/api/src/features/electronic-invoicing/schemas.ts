import { z } from "zod";

/**
 * Priority levels for electronic invoice sending.
 */
export type SendElectronicInvoicePriority =
	| "low"
	| "medium"
	| "high"
	| "critical";

/**
 * Send electronic invoice body.
 */
export interface SendElectronicInvoiceBody {
	transactionId: string;
	xmlContent: string;
	invoiceNumber: string;
	invoiceType: "01" | "03";
	priority?: SendElectronicInvoicePriority;
	governance?: Record<string, unknown>;
}

/**
 * CDR webhook body.
 */
export interface CdrWebhookBody {
	transactionId?: string;
	invoiceNumber: string;
	cdrStatus: "ACEPTADO" | "RECHAZADO" | "OBSERVADO";
	sunatCode?: string;
	sunatDescription?: string;
	cdrContent?: string;
	providerReference?: string;
	occurredAt?: string;
}

/**
 * Company params.
 */
export interface CompanyParams {
	companyId: string;
}

/**
 * Transaction lifecycle params.
 */
export interface TransactionLifecycleParams {
	transactionId: string;
}

/**
 * Invoice lifecycle params.
 */
export interface InvoiceLifecycleParams {
	invoiceId: string;
}

/**
 * Send electronic invoice body schema (Zod).
 */
export const sendElectronicInvoiceBodySchema = z.object({
	transactionId: z.string().min(1),
	xmlContent: z.string().min(1),
	invoiceNumber: z.string().min(1),
	invoiceType: z.union([z.literal("01"), z.literal("03")]),
	priority: z
		.union([
			z.literal("low"),
			z.literal("medium"),
			z.literal("high"),
			z.literal("critical"),
		])
		.optional(),
	governance: z.record(z.string(), z.unknown()).optional(),
});

/**
 * CDR webhook body schema (Zod).
 */
export const cdrWebhookBodySchema = z.object({
	transactionId: z.string().optional(),
	invoiceNumber: z.string().min(3),
	cdrStatus: z.union([
		z.literal("ACEPTADO"),
		z.literal("RECHAZADO"),
		z.literal("OBSERVADO"),
	]),
	sunatCode: z.string().optional(),
	sunatDescription: z.string().optional(),
	cdrContent: z.string().optional(),
	providerReference: z.string().optional(),
	occurredAt: z.string().optional(),
});

/**
 * Company params schema (Zod).
 */
export const companyParamsSchema = z.object({
	companyId: z.string().min(1),
});

/**
 * Transaction lifecycle params schema (Zod).
 */
export const transactionLifecycleParamsSchema = z.object({
	transactionId: z.string().min(1),
});

/**
 * Invoice lifecycle params schema (Zod).
 */
export const invoiceLifecycleParamsSchema = z.object({
	invoiceId: z.string().min(1),
});

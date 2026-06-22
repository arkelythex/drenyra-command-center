/**
 * Database enums for ARKELYTHEX.
 * All pgEnum definitions are centralized here to avoid duplication
 * and enable consistent enum usage across schema files.
 */
import { pgEnum } from "drizzle-orm/pg-core";

/** Transaction type: income vs expense */
export const transactionTypeEnum = pgEnum("transaction_type", [
	"INCOME",
	"EXPENSE",
]);

/** Document types for Peruvian tax documents (CPE) */
export const documentTypeEnum = pgEnum("document_type", [
	"FACTURA",
	"BOLETA",
	"NOTA_CREDITO",
	"NOTA_DEBITO",
	"RECIBO_HONORARIOS",
	"TICKET",
	"MOVIMIENTO_BANCARIO",
]);

/** Currency codes supported */
export const currencyEnum = pgEnum("currency", ["PEN", "USD", "EUR"]);

/** SUNAT submission status lifecycle */
export const sunatStatusEnum = pgEnum("sunat_status", [
	"DRAFT",
	"SUBMITTED",
	"ACCEPTED",
	"OBSERVED",
	"REJECTED",
	"ANNULLED",
]);

/** Invoice payment status */
export const invoiceStatusEnum = pgEnum("invoice_status", [
	"DRAFT",
	"SENT",
	"OVERDUE",
	"PAID",
	"CANCELLED",
]);

/** Tax classification per SUNAT 2026 */
export const taxTypeEnum = pgEnum("tax_type", [
	"GRAVADO",
	"EXONERADO",
	"INAFECTO",
]);

/** AI accounting job run status */
export const accountingJobRunStatusEnum = pgEnum("accounting_job_run_status", [
	"QUEUED",
	"RUNNING",
	"AWAITING_APPROVAL",
	"COMPLETED",
	"FAILED",
	"CANCELLED",
]);

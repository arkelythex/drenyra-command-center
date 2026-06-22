import { pgEnum } from "drizzle-orm/pg-core";
export const transactionTypeEnum = pgEnum("transaction_type", [
    "INCOME",
    "EXPENSE",
]);
export const documentTypeEnum = pgEnum("document_type", [
    "FACTURA",
    "BOLETA",
    "NOTA_CREDITO",
    "NOTA_DEBITO",
    "RECIBO_HONORARIOS",
    "TICKET",
    "MOVIMIENTO_BANCARIO",
]);
export const currencyEnum = pgEnum("currency", ["PEN", "USD", "EUR"]);
export const sunatStatusEnum = pgEnum("sunat_status", [
    "DRAFT",
    "SUBMITTED",
    "ACCEPTED",
    "OBSERVED",
    "REJECTED",
    "ANNULLED",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
    "DRAFT",
    "SENT",
    "OVERDUE",
    "PAID",
    "CANCELLED",
]);
export const taxTypeEnum = pgEnum("tax_type", [
    "GRAVADO",
    "EXONERADO",
    "INAFECTO",
]);
export const accountingJobRunStatusEnum = pgEnum("accounting_job_run_status", [
    "QUEUED",
    "RUNNING",
    "AWAITING_APPROVAL",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
]);
//# sourceMappingURL=enums.js.map
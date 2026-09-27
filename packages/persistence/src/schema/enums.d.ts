export declare const transactionTypeEnum: import("drizzle-orm/pg-core").PgEnum<["INCOME", "EXPENSE"]>;
export declare const documentTypeEnum: import("drizzle-orm/pg-core").PgEnum<["FACTURA", "BOLETA", "NOTA_CREDITO", "NOTA_DEBITO", "RECIBO_HONORARIOS", "TICKET", "MOVIMIENTO_BANCARIO"]>;
export declare const currencyEnum: import("drizzle-orm/pg-core").PgEnum<["PEN", "USD", "EUR"]>;
export declare const sunatStatusEnum: import("drizzle-orm/pg-core").PgEnum<["DRAFT", "SUBMITTED", "ACCEPTED", "OBSERVED", "REJECTED", "ANNULLED"]>;
export declare const invoiceStatusEnum: import("drizzle-orm/pg-core").PgEnum<["DRAFT", "SENT", "OVERDUE", "PAID", "CANCELLED"]>;
export declare const taxTypeEnum: import("drizzle-orm/pg-core").PgEnum<["GRAVADO", "EXONERADO", "INAFECTO"]>;
export declare const fiscalStatusEnum: import("drizzle-orm/pg-core").PgEnum<["DRAFT", "PENDING_REVIEW", "SUBMITTED", "ACCEPTED", "REJECTED", "CANCELLED"]>;
export declare const accountingJobRunStatusEnum: import("drizzle-orm/pg-core").PgEnum<["QUEUED", "RUNNING", "AWAITING_APPROVAL", "COMPLETED", "FAILED", "CANCELLED"]>;
//# sourceMappingURL=enums.d.ts.map
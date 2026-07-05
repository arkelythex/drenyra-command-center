import { z } from "zod";

/**
 * Zod schema for {@link AccountType} values.
 *
 * @example
 * ```ts
 * AccountTypeSchema.parse('CHECKING'); // ok
 * ```
 */
export const AccountTypeSchema = z.enum(["CHECKING", "SAVINGS", "CREDIT"]);

/**
 * Zod schema for {@link TransactionType} values.
 *
 * @example
 * ```ts
 * TransactionTypeSchema.parse('DEBIT'); // ok
 * ```
 */
export const TransactionTypeSchema = z.enum(["DEBIT", "CREDIT"]);

/**
 * Request body schema for creating a bank account.
 *
 * @example
 * ```ts
 * CreateAccountSchema.parse({
 *   companyId: 'cmp_123',
 *   accountName: 'Cuenta principal',
 *   accountNumber: '191-1234567890',
 *   accountType: 'CHECKING',
 *   bankName: 'BCP',
 * });
 * ```
 */
export const CreateAccountSchema = z.object({
	companyId: z.string(),
	accountName: z.string().min(1),
	accountNumber: z.string().min(6),
	accountType: AccountTypeSchema,
	bankName: z.string().min(1),
	bankCode: z.string().optional(),
	branch: z.string().optional(),
	currency: z.string().optional(),
	currentBalance: z.number().optional(),
});

/**
 * Request body schema for creating a bank transaction.
 *
 * @example
 * ```ts
 * CreateTransactionSchema.parse({
 *   companyId: 'cmp_123',
 *   accountId: 'acc_123',
 *   transactionDate: '2026-02-03',
 *   description: 'Pago factura',
 *   type: 'DEBIT',
 *   amount: 150.5,
 * });
 * ```
 */
export const CreateTransactionSchema = z.object({
	companyId: z.string(),
	accountId: z.string(),
	transactionDate: z.coerce.date(),
	description: z.string().min(1),
	reference: z.string().optional(),
	type: TransactionTypeSchema,
	amount: z.number(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
});

/**
 * Query string schema for listing accounts.
 *
 * @example
 * ```ts
 * ListAccountsQuerySchema.parse({ companyId: 'cmp_123' });
 * ```
 */
export const ListAccountsQuerySchema = z.object({
	companyId: z.string(),
});

/**
 * Query string schema for listing transactions.
 *
 * @example
 * ```ts
 * ListTransactionsQuerySchema.parse({ startDate: '2026-01-01', endDate: '2026-01-31' });
 * ```
 */
export const ListTransactionsQuerySchema = z.object({
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
});

/**
 * Route params schema for endpoints with `:id`.
 *
 * @example
 * ```ts
 * IdParamSchema.parse({ id: '550e8400-e29b-41d4-a716-446655440000' });
 * ```
 */
export const IdParamSchema = z.object({
	id: z.string().uuid(),
});

/**
 * Request body schema for auto-reconciliation.
 *
 * @example
 * ```ts
 * AutoReconcileSchema.parse({ companyId: 'cmp_123', accountId: 'acc_123' });
 * ```
 */
export const AutoReconcileSchema = z.object({
	companyId: z.string(),
	accountId: z.string(),
});

/**
 * Optional filter for reconciliation shadow metrics by company.
 *
 * @example
 * ```ts
 * console.log(ReconciliationShadowMetricsQuerySchema);
 * ```
 */
export const ReconciliationShadowMetricsQuerySchema = z.object({
	companyId: z.string().optional(),
});

/**
 * Optional filter/query for reconciliation shadow cutover evaluation.
 *
 * @example
 * ```ts
 * console.log(ReconciliationShadowCutoverQuerySchema);
 * ```
 */
export const ReconciliationShadowCutoverQuerySchema = z.object({
	companyId: z.string().optional(),
	windowRuns: z.coerce.number().int().min(1).max(200).optional(),
});

/**
 * Query schema for airline ticket monitoring report (SUNAT 2026 project).
 * @example
 * ```ts
 * console.log(AirlineTicketReportQuerySchema);
 * ```
 */

export const AirlineTicketReportQuerySchema = z.object({
	companyId: z.string(),
	period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
	minAmountPen: z.coerce.number().nonnegative().optional(),
});

/**
 * Request body schema for reconciling a single transaction.
 *
 * Note: `documentId` and `documentType` must be provided together (or both omitted).
 *
 * @example
 * ```ts
 * ReconcileTransactionSchema.parse({});
 * ReconcileTransactionSchema.parse({ documentId: 'inv_123', documentType: 'INVOICE' });
 * ```
 */
export const ReconcileTransactionSchema = z
	.object({
		userId: z.string().uuid().optional(),
		documentId: z.string().uuid().optional(),
		documentType: z.enum(["INVOICE", "BILL"]).optional(),
	})
	.refine(
		(value) =>
			(value.documentId && value.documentType) ||
			(!value.documentId && !value.documentType),
		{
			message: "documentId and documentType must be provided together",
			path: ["documentId"],
		},
	);

/**
 * Request body schema for importing multiple transactions in a single request.
 *
 * @example
 * ```ts
 * ImportTransactionsSchema.parse({
 *   companyId: 'cmp_123',
 *   accountId: 'acc_123',
 *   transactions: [{ date: '2026-02-03', description: 'DEPÓSITO', amount: 500, type: 'CREDIT' }],
 * });
 * ```
 */
export const ImportTransactionsSchema = z.object({
	companyId: z.string(),
	accountId: z.string(),
	transactions: z.array(
		z.object({
			date: z.coerce.date(),
			description: z.string().min(1),
			amount: z.number(),
			type: TransactionTypeSchema,
			reference: z.string().optional(),
		}),
	),
});

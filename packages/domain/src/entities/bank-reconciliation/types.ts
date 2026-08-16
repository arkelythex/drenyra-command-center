/**
 * Lifecycle status for a reconciliation session.
 *
 * @example
 * ```ts
 * const status: ReconciliationStatus = "DRAFT";
 * ```
 */
export type ReconciliationStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

/**
 * Properties used to construct a {@link BankReconciliation}.
 *
 * @example
 * ```ts
 * const props: BankReconciliationProps = {
 *   id: 0,
 *   bankAccountId: 1,
 *   organizationId: 1,
 *   periodStart: new Date("2026-01-01"),
 *   periodEnd: new Date("2026-01-31"),
 *   openingBalance: 0,
 *   closingBalanceStatement: 0,
 *   closingBalanceBooks: 0,
 *   difference: 0,
 *   status: "DRAFT",
 *   reconciledTransactionIds: [],
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface BankReconciliationProps {
	id: number;
	bankAccountId: number;
	organizationId: number;
	periodStart: Date;
	periodEnd: Date;
	openingBalance: number;
	closingBalanceStatement: number;
	closingBalanceBooks: number;
	difference: number;
	status: ReconciliationStatus;
	reconciledTransactionIds: number[];
	reconciledByUserId?: string | undefined;
	notes?: string | undefined;
	createdAt: Date;
	updatedAt: Date;
	completedAt?: Date | undefined;
}

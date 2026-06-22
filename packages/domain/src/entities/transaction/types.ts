import { Money } from "../../value-objects/Money";
import type { AccountingTransactionType } from "../../value-objects/TransactionType";

/**
 * High-level transaction type/category.
 *
 * @deprecated Use AccountingTransactionType from value-objects instead
 * @example
 * ```ts
 * const t: AccountingTransactionType = "SALE";
 * ```
 */
export type TransactionType = AccountingTransactionType;

/**
 * Transaction lifecycle status.
 *
 * @example
 * ```ts
 * const s: TransactionStatus = "DRAFT";
 * ```
 */
export type TransactionStatus =
	| "DRAFT"
	| "POSTED"
	| "VOIDED";

/**
 * A single double-entry line (debit/credit) inside a transaction.
 *
 * @example
 * ```ts
 * const entry: TransactionEntry = { id: "1", accountCode: "7011", accountName: "Ventas", debit: Money.zero("PEN"), credit: Money.fromAmount(100, "PEN") };
 * ```
 */
export interface TransactionEntry {
	id: string;
	accountCode: string;
	accountName: string;
	debit: Money;
	credit: Money;
	description?: string;
}

/**
 * Properties used to construct a {@link Transaction}.
 *
 * @example
 * ```ts
 * const props: TransactionProps = {
 *   id: "tx_1",
 *   type: "SALE",
 *   date: new Date(),
 *   description: "Venta",
 *   entries: [],
 *   status: "DRAFT",
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 * };
 * ```
 */
export interface TransactionProps {
	id: string;
	type: TransactionType;
	date: Date;
	description: string;
	referenceNumber?: string;
	entries: TransactionEntry[];
	status: TransactionStatus;
	postedAt?: Date;
	postedBy?: string;
	voidedAt?: Date;
	voidedBy?: string;
	voidReason?: string;
	createdAt: Date;
	updatedAt: Date;
}

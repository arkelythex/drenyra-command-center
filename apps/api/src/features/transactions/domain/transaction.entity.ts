/**
 * Transaction — Domain Entity Types
 *
 * Pure types for the transactions bounded context.
 * No infrastructure or framework dependencies allowed here.
 */

import type { Currency } from "@arkelythex/domain";
import type { SpotDetractionProfile } from "../../taxation/domain/spot-detraction-profile";

// ─── Primitives ───────────────────────────────────────────────────────────────

/**
 * TransactionType type.
 *
 * @example
 * ```ts
 * const value: TransactionType = {} as TransactionType;
 * console.log(value);
 * ```
 */
export type TransactionType = "INCOME" | "EXPENSE";

// ─── Entities ─────────────────────────────────────────────────────────────────

/**
 * TransactionRow interface.
 *
 * @example
 * ```ts
 * const value: TransactionRow = {} as TransactionRow;
 * console.log(value);
 * ```
 */
export interface TransactionRow {
	id: string;
	companyId: string;
	type: string;
	partnerId: string | null;
	totalAmount: string;
	igvAmount: string;
	number: string | null;
	documentType: string;
	issueDate: Date | null;
	currency: string | null;
	isDetraction: boolean | null;
	subtotal: string | null;
	tags: unknown | null;
}

/**
 * TransactionWithPartner interface.
 *
 * @example
 * ```ts
 * const value: TransactionWithPartner = {} as TransactionWithPartner;
 * console.log(value);
 * ```
 */
export interface TransactionWithPartner extends TransactionRow {
	/** Joined partner entity. Loosely typed to avoid coupling to infrastructure schema. */
	partner: Record<string, unknown> | null;
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * CreateTransactionInput interface.
 *
 * @example
 * ```ts
 * const value: CreateTransactionInput = {} as CreateTransactionInput;
 * console.log(value);
 * ```
 */
export interface CreateTransactionInput {
	companyId: string;
	type: TransactionType;
	partnerId: string;
	totalAmount: string;
	currency: Currency;
	hasDetraction: boolean;
	detractionProfile?: SpotDetractionProfile;
}

/**
 *  Pre-computed insert data passed from handler to repository after tax calculation
 * @example
 * ```ts
 * const value: TransactionInsertData = {} as TransactionInsertData;
 * console.log(value);
 * ```
 */

export interface TransactionInsertData {
	companyId: string;
	type: TransactionType;
	partnerId: string;
	totalAmount: string;
	igvAmount: string;
	number: string;
	documentType: "FACTURA";
	issueDate: Date;
	currency: Currency;
	isDetraction: boolean;
	tags: { detractionProfile: SpotDetractionProfile } | null;
}

/**
 * UpdateTransactionInput interface.
 *
 * @example
 * ```ts
 * const value: UpdateTransactionInput = {} as UpdateTransactionInput;
 * console.log(value);
 * ```
 */
export interface UpdateTransactionInput {
	type?: TransactionType;
	partnerId?: string;
	totalAmount?: string;
	currency?: Currency;
	hasDetraction?: boolean;
	detractionProfile?: SpotDetractionProfile;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * TransactionFilters interface.
 *
 * @example
 * ```ts
 * const value: TransactionFilters = {} as TransactionFilters;
 * console.log(value);
 * ```
 */
export interface TransactionFilters {
	companyId: string;
	type?: string;
	partnerId?: string;
}

/**
 * TypeSummaryEntry interface.
 *
 * @example
 * ```ts
 * const value: TypeSummaryEntry = {} as TypeSummaryEntry;
 * console.log(value);
 * ```
 */
export interface TypeSummaryEntry {
	count: number;
	total: number;
	igv: number;
}

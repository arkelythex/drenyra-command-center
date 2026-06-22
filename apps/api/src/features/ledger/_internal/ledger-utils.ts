import { transactionTypeEnum } from "@arkelythex/persistence/schema";

/**
 * TransactionDirection type.
 *
 * @example
 * ```ts
 * const value: TransactionDirection = {} as TransactionDirection;
 * console.log(value);
 * ```
 */
export type TransactionDirection =
	(typeof transactionTypeEnum.enumValues)[number];

/**
 * toNumber operation.
 *
 * @param value - Input for value.
 * @returns Result of toNumber.
 * @example
 * ```ts
 * const result = toNumber(0);
 * console.log(result);
 * ```
 */
export function toNumber(value: number | string | null | undefined): number {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

/**
 * formatVoucher operation.
 *
 * @param series - Input for series.
 * @param number - Input for number.
 * @param transactionId - Input for transactionId.
 * @returns Result of formatVoucher.
 * @example
 * ```ts
 * const result = formatVoucher("", "", "");
 * console.log(result);
 * ```
 */
export function formatVoucher(
	series: string | null,
	number: string | null,
	transactionId: string,
): string {
	const safeSeries = series?.trim();
	const safeNumber = number?.trim();
	if (safeSeries && safeNumber) return `${safeSeries}-${safeNumber}`;
	if (safeSeries) return safeSeries;
	if (safeNumber) return safeNumber;
	return `TX-${transactionId.slice(0, 8).toUpperCase()}`;
}

/**
 * resolveAccountCode operation.
 *
 * @param direction - Input for direction.
 * @param index - Input for index.
 * @returns Result of resolveAccountCode.
 * @example
 * ```ts
 * const result = resolveAccountCode({} as TransactionDirection, 0);
 * console.log(result);
 * ```
 */
export function resolveAccountCode(
	direction: TransactionDirection | null,
	index: number,
): string {
	const slot = String((index % 90) + 10).padStart(2, "0");
	if (direction === "INCOME") return `70${slot}`;
	if (direction === "EXPENSE") return `60${slot}`;
	return `10${slot}`;
}

/**
 * resolveAccountType operation.
 *
 * @param direction - Input for direction.
 * @param totalDebit - Input for totalDebit.
 * @param totalCredit - Input for totalCredit.
 * @returns Result of resolveAccountType.
 * @example
 * ```ts
 * const result = resolveAccountType({} as TransactionDirection, 0, 0);
 * console.log(result);
 * ```
 */
export function resolveAccountType(
	direction: TransactionDirection | null,
	totalDebit: number,
	totalCredit: number,
): "ASSET" | "LIABILITY" | "REVENUE" | "EXPENSE" {
	if (direction === "INCOME") return "REVENUE";
	if (direction === "EXPENSE") return "EXPENSE";
	return totalDebit >= totalCredit ? "ASSET" : "LIABILITY";
}

/**
 * PERU_TAX_TIMEZONE const.
 *
 * @example
 * ```ts
 * console.log(PERU_TAX_TIMEZONE);
 * ```
 */
export const PERU_TAX_TIMEZONE = "America/Lima";

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat("en-US", {
	timeZone: PERU_TAX_TIMEZONE,
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

/**
 * toPeruTaxDateKey operation.
 *
 * @param value - Input for value.
 * @returns Result of toPeruTaxDateKey.
 * @throws Error when toPeruTaxDateKey cannot complete successfully.
 * @example
 * ```ts
 * const result = toPeruTaxDateKey(new Date());
 * console.log(result);
 * ```
 */
export function toPeruTaxDateKey(value: Date): string {
	const parts = DATE_PARTS_FORMATTER.formatToParts(value);
	const year = parts.find((part) => part.type === "year")?.value;
	const month = parts.find((part) => part.type === "month")?.value;
	const day = parts.find((part) => part.type === "day")?.value;

	if (!year || !month || !day) {
		throw new Error("Unable to normalize tax date");
	}

	return `${year}-${month}-${day}`;
}

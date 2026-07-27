/**
 * PLE Formatter Utilities
 *
 * Helper functions for building SUNAT Formato 5.1 fixed-width records.
 */

/**
 * Pad a string to the exact width for PLE fixed-width format.
 * - Strings: right-padded with spaces
 * - Numbers: left-padded with zeros (for cents fields)
 *
 * @param value - The value to format.
 * @param width - Exact field width.
 * @param alignRight - Pad left with zeros instead of right with spaces.
 * @returns Padded string of exact width.
 */
export function padField(
	value: string | number | undefined | null,
	width: number,
	alignRight = false,
): string {
	if (value === undefined || value === null) value = "";
	const str = typeof value === "number" ? value.toString() : String(value);

	if (alignRight) {
		return str.padStart(width, "0").slice(0, width);
	}
	return str.padEnd(width, " ").slice(0, width);
}

/**
 * Format a pipe-delimited PLE record from an array of field values.
 * Each field is padded to its specified width.
 *
 * @param fields - Array of [value, width, alignRight?] tuples.
 * @returns Pipe-delimited PLE record string.
 */
export function formatRecord(
	fields: Array<[string | number | undefined | null, number, boolean?]>,
): string {
	return fields
		.map(([value, width, alignRight]) => padField(value, width, alignRight))
		.join("|");
}

/**
 * Convert an amount in PEN (decimal string like "1500.00") to cents string.
 *
 * @param amount - Decimal amount string.
 * @returns 12-character zero-padded cents string.
 */
export function amountToCents(amount: string | number | undefined | null): string {
	if (amount === undefined || amount === null) return "000000000000";
	const num = typeof amount === "string" ? parseFloat(amount) : amount;
	const cents = Math.round(num * 100);
	return String(cents).padStart(12, "0");
}

/**
 * Format a Date or ISO string to DD/MM/YYYY.
 */
export function formatDateDDMMYYYY(
	date: Date | string | undefined | null,
): string {
	if (!date) return "".padEnd(10, " ");
	const d = typeof date === "string" ? new Date(date) : date;
	if (isNaN(d.getTime())) return "".padEnd(10, " ");
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}

/**
 * Extract MM and YYYY from a period string (YYYY-MM).
 */
export function parsePeriod(period: string): { month: string; year: string } {
	const [year, month] = period.split("-");
	return {
		month: month ?? "01",
		year: year ?? "2026",
	};
}

/**
 * Truncate a string to max length, preserving whole words when possible.
 */
export function truncateText(text: string | undefined | null, maxLen: number): string {
	if (!text) return "".padEnd(maxLen, " ");
	const cleaned = text.replace(/\s+/g, " ").trim();
	if (cleaned.length <= maxLen) return cleaned.padEnd(maxLen, " ");
	return cleaned.slice(0, maxLen);
}

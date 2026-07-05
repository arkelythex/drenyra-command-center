import type { ImportTransactionInput } from "../agentic-ledger.service";
import { parseBcpCsv } from "./bcp";
import { parsePeruHeaderCsv } from "./peru-header";
import type { BankCsvFormat, BankCsvParseResult } from "./types";

/**
 * Parse bank-export CSV into normalized transactions.
 *
 * @param csvText - Raw CSV text (exported from bank)
 * @param format - Bank CSV format key
 * @returns Normalized transactions + warnings
 * @throws Error when format is not supported in this version.
 *
 * @example
 * ```ts
 * const res = parseBankCsv("Fecha;Descripción;Cargo;Abono\\n...", "BCP");
 * console.log(res.transactions.length);
 * ```
 */
export function parseBankCsv(
	csvText: string,
	format: BankCsvFormat,
): BankCsvParseResult {
	if (format === "GENERIC") {
		return {
			transactions: parseGenericCsv(csvText),
			warnings: [],
		};
	}

	if (format === "BCP") return parseBcpCsv(csvText);

	// v1: use Perú header heuristics for other banks while we collect real export samples.
	if (format === "BBVA") return parsePeruHeaderCsv(csvText, "BBVA");
	if (format === "INTERBANK") return parsePeruHeaderCsv(csvText, "INTERBANK");
	if (format === "SCOTIABANK") return parsePeruHeaderCsv(csvText, "SCOTIABANK");

	throw new Error(`CSV format not supported: ${format}`);
}

function parseGenericCsv(csvText: string): ImportTransactionInput[] {
	// Matches the constrained v1 format:
	// date,description,amount,type,reference?
	const trimmed = csvText.trim();
	if (!trimmed) return [];

	const lines = trimmed.split(/\r?\n/).filter(Boolean);
	const out: ImportTransactionInput[] = [];

	for (const line of lines) {
		const [date, description, amount, type, reference] = line
			.split(",")
			.map((s) => s.trim().replace(/^"|"$/g, ""));
		if (!date || !description || !amount || !type) continue;

		const parsedAmount = Number(amount);
		if (!Number.isFinite(parsedAmount)) continue;
		if (type !== "DEBIT" && type !== "CREDIT") continue;

		out.push({
			date: new Date(date),
			description,
			amount: parsedAmount,
			type,
			reference: reference || undefined,
		});
	}

	return out;
}

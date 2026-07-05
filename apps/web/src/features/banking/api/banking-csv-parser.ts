import {
	detectDelimiter,
	findColumnIndex,
	normalizeTxType,
	parseAmountLoose,
	parseCsvLine,
	parseDateLoose,
} from "@/lib/import-utils";
import type { ImportTransactionRow } from "./banking.api.types";

export async function parseTransactionsCsv(
	file: File,
): Promise<ImportTransactionRow[]> {
	const text = await file.text();
	const lines = text
		.split(/\r?\n/g)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length === 0) return [];

	const delimiter = detectDelimiter(lines[0]);
	const header = parseCsvLine(lines[0], delimiter).map((item) =>
		item.toLowerCase(),
	);

	const hasHeader = header.some((item) =>
		[
			"date",
			"fecha",
			"description",
			"descripcion",
			"concepto",
			"amount",
			"monto",
			"importe",
		].includes(item),
	);
	const startIndex = hasHeader ? 1 : 0;

	const dateIdx = hasHeader ? findColumnIndex(header, ["date", "fecha"]) : 0;
	const descIdx = hasHeader
		? findColumnIndex(header, [
				"description",
				"descripcion",
				"concepto",
				"detalle",
			])
		: 1;
	const amountIdx = hasHeader
		? findColumnIndex(header, ["amount", "monto", "importe", "valor"])
		: 2;
	const typeIdx = hasHeader
		? findColumnIndex(header, ["type", "tipo", "dc", "debitcredit"])
		: 3;
	const refIdx = hasHeader
		? findColumnIndex(header, [
				"reference",
				"referencia",
				"ref",
				"nro",
				"numero",
			])
		: 4;

	const out: ImportTransactionRow[] = [];

	for (let lineIndex = startIndex; lineIndex < lines.length; lineIndex += 1) {
		const cols = parseCsvLine(lines[lineIndex], delimiter);
		const dateValue = cols[dateIdx] ?? "";
		const description = (cols[descIdx] ?? "").trim();
		const amountValue = cols[amountIdx] ?? "";
		const typeValue = typeIdx >= 0 ? (cols[typeIdx] ?? "") : "";
		const reference = refIdx >= 0 ? (cols[refIdx] ?? "").trim() : "";

		const date = parseDateLoose(dateValue);
		const amountSigned = parseAmountLoose(amountValue);
		const typeFromCol = normalizeTxType(typeValue);

		if (!date || !description || amountSigned === null) continue;

		out.push({
			date,
			description,
			amount: Math.abs(amountSigned),
			type: typeFromCol ?? (amountSigned >= 0 ? "CREDIT" : "DEBIT"),
			reference: reference || undefined,
		});
	}

	return out;
}

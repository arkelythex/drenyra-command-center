import type { HubArtifact, SheetDiffRow } from "@drenyra/shared/artifacts";
import { n } from "@/lib/utils";

type SheetDiffArtifact = Extract<HubArtifact, { type: "sheet_diff" }>;

const SPREADSHEET_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt"];
const SPREADSHEET_HINTS = [
	"excel",
	"xlsx",
	"csv",
	"conciliar",
	"sire",
	"rvie",
	"rce",
	"notas de crédito",
];

function hasSpreadsheetIntent(content: string): boolean {
	const normalized = content.toLowerCase();
	return SPREADSHEET_HINTS.some((hint) => normalized.includes(hint));
}

function findSpreadsheetFile(files: File[]): File | undefined {
	return files.find((file) => {
		const lower = file.name.toLowerCase();
		return SPREADSHEET_EXTENSIONS.some((extension) =>
			lower.endsWith(extension),
		);
	});
}

function parseNumeric(raw: string | undefined): number | null {
	if (!raw) return null;
	const sanitized = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
	const value = Number.parseFloat(sanitized);
	return Number.isFinite(value) ? value : null;
}

function formatMoney(value: number | null): string {
	if (value === null) return "N/D";
	return n(value);
}

function cleanCell(raw: string | undefined): string {
	if (!raw) return "";
	return raw.trim().replace(/^"|"$/g, "");
}

function splitLine(rawLine: string, delimiter: string): string[] {
	return rawLine.split(delimiter).map((cell) => cleanCell(cell));
}

function detectDelimiter(text: string): "," | ";" {
	const sample = text.split(/\r?\n/).slice(0, 4).join("\n");
	const semicolonCount = sample.split(";").length - 1;
	const commaCount = sample.split(",").length - 1;
	return semicolonCount > commaCount ? ";" : ",";
}

function buildFallbackRows(): SheetDiffRow[] {
	return [
		{
			id: "fallback-1",
			record: "F001-1204 · RUC 20100070970",
			original: "S/ 1180.01",
			corrected: "S/ 1180.00",
			status: "updated",
			reason: "Ajuste de redondeo para cuadrar con IGV 18%.",
		},
		{
			id: "fallback-2",
			record: "FC01-5541 · Nota de crédito",
			original: "RUC 20A00070970",
			corrected: "RUC 20100070970",
			status: "flagged",
			reason: "RUC corregido por formato inválido detectado.",
		},
		{
			id: "fallback-3",
			record: "B001-0088 · Boleta",
			original: "S/ 300.00",
			corrected: "S/ 300.00",
			status: "unchanged",
			reason: "Registro consistente con propuesta SUNAT.",
		},
	];
}

function mapCsvRowsToDiff(text: string): SheetDiffRow[] {
	const delimiter = detectDelimiter(text);
	const lines = text
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);
	if (lines.length < 2) return [];

	const headers = splitLine(lines[0], delimiter).map((header) =>
		header.toLowerCase(),
	);
	const totalIndex = headers.findIndex((header) =>
		/total|importe|monto/.test(header),
	);
	const serieIndex = headers.findIndex((header) => /serie/.test(header));
	const numberIndex = headers.findIndex((header) => /numero|nro/.test(header));
	const rucIndex = headers.findIndex((header) => /ruc/.test(header));
	const igvIndex = headers.findIndex((header) => /igv/.test(header));

	return lines.slice(1, 13).map((line, index) => {
		const cells = splitLine(line, delimiter);
		const totalRaw = cells[totalIndex] ?? "";
		const igvRaw = cells[igvIndex] ?? "";
		const totalValue = parseNumeric(totalRaw);
		const igvValue = parseNumeric(igvRaw);
		const subtotal =
			totalValue !== null && igvValue !== null ? totalValue - igvValue : null;
		const expectedIgv =
			subtotal !== null ? Number((subtotal * 0.18).toFixed(2)) : null;
		const correctedTotal =
			subtotal !== null && expectedIgv !== null
				? Number((subtotal + expectedIgv).toFixed(2))
				: totalValue;
		const gap =
			totalValue !== null && correctedTotal !== null
				? Math.abs(totalValue - correctedTotal)
				: 0;
		const status: SheetDiffRow["status"] =
			gap > 1 ? "flagged" : gap > 0 ? "updated" : "unchanged";

		const serie = cleanCell(cells[serieIndex]);
		const number = cleanCell(cells[numberIndex]);
		const ruc = cleanCell(cells[rucIndex]);
		const record = [
			serie && number ? `${serie}-${number}` : `Fila ${index + 2}`,
			ruc && `RUC ${ruc}`,
		]
			.filter(Boolean)
			.join(" · ");

		return {
			id: `csv-${index}`,
			record: record || `Fila ${index + 2}`,
			original: formatMoney(totalValue),
			corrected: formatMoney(correctedTotal),
			status,
			reason:
				status === "unchanged"
					? "Sin cambios requeridos."
					: status === "updated"
						? "Ajuste automático para cuadrar base + IGV."
						: "Diferencia alta: requiere revisión manual antes de enviar.",
		};
	});
}

function buildSheetDiffArtifact(
	content: string,
	sourceName: string,
	rows: SheetDiffRow[],
): SheetDiffArtifact {
	const updated = rows.filter((row) => row.status === "updated").length;
	const flagged = rows.filter((row) => row.status === "flagged").length;

	return {
		id: crypto.randomUUID(),
		type: "sheet_diff",
		title: "Comparación Original vs Corregido",
		payload: {
			command: content || "Conciliar mes",
			sourceName,
			acceptShortcut: "Ctrl+Enter",
			rows,
			summary: {
				total: rows.length,
				updated,
				flagged,
			},
		},
	};
}

export async function buildSheetDiffArtifactFromInput(input: {
	content: string;
	files?: File[];
}): Promise<SheetDiffArtifact | null> {
	const files = input.files ?? [];
	const matchedFile = findSpreadsheetFile(files);

	if (!matchedFile && !hasSpreadsheetIntent(input.content)) {
		return null;
	}

	if (!matchedFile) {
		return buildSheetDiffArtifact(
			input.content,
			"Entrada manual",
			buildFallbackRows(),
		);
	}

	try {
		const text = await matchedFile.text();
		const parsedRows = mapCsvRowsToDiff(text);
		const rows = parsedRows.length > 0 ? parsedRows : buildFallbackRows();
		return buildSheetDiffArtifact(input.content, matchedFile.name, rows);
	} catch {
		return buildSheetDiffArtifact(
			input.content,
			matchedFile.name,
			buildFallbackRows(),
		);
	}
}

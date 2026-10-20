/**
 * Bank statement CSV → rows for `POST /api/banking/import`.
 *
 * Amounts are parsed as text into integer cents (never through a float), so
 * `1.234,56`, `1,234.56`, `S/ -80.00` and `(80.00)` all land exact. The
 * header row can sit below a bank's preamble; it is the first line that names
 * a date column and either an amount column or separate debit/credit ones.
 */
import { detectDelimiter, parseCsvLine } from "@/lib/import-utils-parse";

export type StatementDirection = "CREDIT" | "DEBIT";

/** One movement, as `POST /api/banking/import` expects it. */
export interface StatementRow {
	date: string;
	description: string;
	reference?: string;
	type: StatementDirection;
	amountCents: number;
}

export interface StatementLineError {
	/** 1-based line in the file. */
	line: number;
	message: string;
}

export interface ParsedStatement {
	rows: StatementRow[];
	errors: StatementLineError[];
	creditCents: number;
	debitCents: number;
}

const HEADER_SCAN_LINES = 30;

const COLUMNS = {
	date: [
		"fecha",
		"fecha operacion",
		"fecha de operacion",
		"fecha proceso",
		"f operacion",
		"date",
	],
	description: [
		"descripcion",
		"concepto",
		"detalle",
		"glosa",
		"descripcion operacion",
		"description",
	],
	reference: [
		"referencia",
		"nro",
		"numero",
		"nro operacion",
		"nro de operacion",
		"numero de operacion",
		"n operacion",
		"operacion",
		"reference",
	],
	amount: ["monto", "importe", "valor", "amount"],
	debit: [
		"cargo",
		"cargos",
		"debe",
		"debito",
		"retiro",
		"retiros",
		"salida",
		"debit",
	],
	credit: [
		"abono",
		"abonos",
		"haber",
		"credito",
		"deposito",
		"depositos",
		"ingreso",
		"credit",
	],
	type: ["tipo", "type", "dc", "d/c", "cargo/abono"],
} as const;

type ColumnName = keyof typeof COLUMNS;
type ColumnMap = Partial<Record<ColumnName, number>>;

const CREDIT_WORDS = new Set([
	"c",
	"cr",
	"credit",
	"credito",
	"abono",
	"h",
	"haber",
	"ingreso",
	"deposito",
]);
const DEBIT_WORDS = new Set([
	"d",
	"db",
	"dr",
	"debit",
	"debito",
	"cargo",
	"debe",
	"egreso",
	"retiro",
]);

function normalize(value: string): string {
	return value
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[°º#.]/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.toLowerCase();
}

function mapColumns(fields: string[]): ColumnMap {
	const normalized = fields.map(normalize);
	const map: ColumnMap = {};
	for (const [name, aliases] of Object.entries(COLUMNS) as [
		ColumnName,
		readonly string[],
	][]) {
		const index = normalized.findIndex((field) => aliases.includes(field));
		if (index >= 0) map[name] = index;
	}
	return map;
}

function isHeader(map: ColumnMap): boolean {
	const hasAmount =
		map.amount !== undefined ||
		(map.debit !== undefined && map.credit !== undefined);
	return map.date !== undefined && map.description !== undefined && hasAmount;
}

function validDate(year: number, month: number, day: number): string | null {
	const date = new Date(Date.UTC(year, month - 1, day));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** `31/01/2026`, `31-01-26` or `2026-01-31` → `2026-01-31`; anything else → null. */
export function parseStatementDate(raw: string): string | null {
	const value = raw.trim();
	const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
	if (iso) return validDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
	const local = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/.exec(value);
	if (!local) return null;
	const [, day = "", month = "", yearText = ""] = local;
	const year =
		yearText.length === 2 ? 2000 + Number(yearText) : Number(yearText);
	return validDate(year, Number(month), Number(day));
}

/** Digits with optional thousands groups, all with the one separator `sep`. */
function groupedUnits(text: string, sep: string): string | null {
	if (/^\d+$/.test(text)) return text;
	const groups = text.split(sep);
	const [head = "", ...rest] = groups;
	if (!/^\d{1,3}$/.test(head) || !rest.every((g) => /^\d{3}$/.test(g))) {
		return null;
	}
	return groups.join("");
}

/**
 * Splits `1.234,56` / `1,234.56` / `80` into units and decimals. The decimal
 * separator is the last `.` or `,` followed by one or two digits. A lone
 * three-digit group (`1,234`, `80.005`) is ambiguous and refused.
 */
function splitDecimal(digits: string): [string, string] | null {
	const decimal = /^(.*)([.,])(\d{1,2})$/.exec(digits);
	if (decimal) {
		const [, head = "", sep, cents = ""] = decimal;
		const thousands = sep === "," ? "." : ",";
		const units = groupedUnits(head, thousands);
		return units === null ? null : [units, cents];
	}
	for (const sep of [".", ","]) {
		const units = groupedUnits(digits, sep);
		if (units !== null && digits.split(sep).length > 2) return [units, ""];
	}
	return /^\d+$/.test(digits) ? [digits, ""] : null;
}

/**
 * Text amount → signed integer cents. A leading or trailing `-` or
 * parentheses make it negative; currency marks and spaces are ignored. More
 * than two decimals (other than zeros) are refused rather than rounded.
 */
export function parseStatementAmount(raw: string): number | null {
	let value = raw.replace(/ /g, " ").trim();
	if (!value) return null;
	let negative = false;
	if (/^\(.*\)$/.test(value)) {
		negative = true;
		value = value.slice(1, -1);
	}
	value = value.replace(/S\/\.?|PEN|USD|US\$|\$/gi, "").replace(/\s/g, "");
	if (value.startsWith("-")) {
		negative = !negative;
		value = value.slice(1);
	} else if (value.endsWith("-")) {
		negative = !negative;
		value = value.slice(0, -1);
	} else if (value.startsWith("+")) {
		value = value.slice(1);
	}
	// Extra decimal zeros (`80.0000`) carry no cents.
	value = value.replace(/([.,]\d{2})0+$/, "$1");
	if (!/^\d[\d.,]*$/.test(value)) return null;
	const parts = splitDecimal(value);
	if (!parts) return null;
	const [units, decimals] = parts;
	const cents = Number(units) * 100 + Number(decimals.padEnd(2, "0"));
	if (!Number.isSafeInteger(cents)) return null;
	return negative ? -cents : cents;
}

function directionFromText(raw: string): StatementDirection | null {
	const value = normalize(raw);
	if (CREDIT_WORDS.has(value)) return "CREDIT";
	if (DEBIT_WORDS.has(value)) return "DEBIT";
	return null;
}

function cell(fields: string[], index: number | undefined): string {
	return index === undefined ? "" : (fields[index] ?? "").trim();
}

/** Separate debit/credit columns → signed cents (credit positive). */
function splitColumnsAmount(
	fields: string[],
	columns: ColumnMap,
): number | string {
	const debitText = cell(fields, columns.debit);
	const creditText = cell(fields, columns.credit);
	const debit = debitText ? parseStatementAmount(debitText) : 0;
	const credit = creditText ? parseStatementAmount(creditText) : 0;
	if (debit === null || credit === null) return "monto ilegible";
	if (debit !== 0 && credit !== 0) return "tiene cargo y abono a la vez";
	return credit !== 0 ? Math.abs(credit) : -Math.abs(debit);
}

/** Signed cents of the row: one amount column (with optional type) or debit/credit columns. */
function rowAmount(fields: string[], columns: ColumnMap): number | string {
	if (columns.amount === undefined) return splitColumnsAmount(fields, columns);
	const amountText = cell(fields, columns.amount);
	const amount = parseStatementAmount(amountText);
	if (amount === null) return `monto ilegible "${amountText}"`;
	if (columns.type === undefined) return amount;
	const typeText = cell(fields, columns.type);
	const direction = directionFromText(typeText);
	if (!direction) return `tipo desconocido "${typeText}"`;
	return direction === "CREDIT" ? Math.abs(amount) : -Math.abs(amount);
}

function parseRow(fields: string[], columns: ColumnMap): StatementRow | string {
	const dateText = cell(fields, columns.date);
	const date = parseStatementDate(dateText);
	if (!date) return `fecha ilegible "${dateText}"`;
	const description = cell(fields, columns.description).slice(0, 500);
	if (!description) return "sin descripción";
	const amount = rowAmount(fields, columns);
	if (typeof amount === "string") return amount;
	if (amount === 0) return "monto cero";
	const reference = cell(fields, columns.reference).slice(0, 100);
	return {
		date,
		description,
		...(reference ? { reference } : {}),
		type: amount > 0 ? "CREDIT" : "DEBIT",
		amountCents: Math.abs(amount),
	};
}

/** Parses a bank statement export; rows that cannot be read are listed, not guessed. */
export function parseStatementCsv(text: string): ParsedStatement {
	const lines = text.replace(/^﻿/, "").split(/\r?\n/);
	const result: ParsedStatement = {
		rows: [],
		errors: [],
		creditCents: 0,
		debitCents: 0,
	};

	let headerIndex = -1;
	let columns: ColumnMap = {};
	let delimiter = detectDelimiter(lines[0] ?? "");
	for (
		let index = 0;
		index < Math.min(lines.length, HEADER_SCAN_LINES);
		index += 1
	) {
		const line = lines[index] ?? "";
		const candidate = detectDelimiter(line);
		const map = mapColumns(parseCsvLine(line, candidate));
		if (isHeader(map)) {
			headerIndex = index;
			columns = map;
			delimiter = candidate;
			break;
		}
	}
	if (headerIndex < 0) {
		result.errors.push({
			line: 1,
			message:
				"No se encontró la fila de encabezados (fecha, descripción y monto, o cargo y abono).",
		});
		return result;
	}

	for (let index = headerIndex + 1; index < lines.length; index += 1) {
		const fields = parseCsvLine(lines[index] ?? "", delimiter);
		if (fields.every((field) => field === "")) continue;
		const row = parseRow(fields, columns);
		if (typeof row === "string") {
			result.errors.push({ line: index + 1, message: row });
			continue;
		}
		result.rows.push(row);
		if (row.type === "CREDIT") result.creditCents += row.amountCents;
		else result.debitCents += row.amountCents;
	}
	return result;
}

/**
 * PLE Validator Service
 *
 * Validates PLE TXT content against SUNAT format rules:
 * - Header structure (RUC, period, book type)
 * - Field-level validation (dates, amounts, RUC)
 * - Fiscal consistency (debit=credit, IGV=base*0.18, balance formula)
 * - Period consistency
 */
import type {
	PleBookType,
	PleValidationError,
	PleValidationResult,
	PleValidationWarning,
} from "./ple.types";

// ─── Validation Options ────────────────────────────────────────────

export interface PleValidationOptions {
	/** Expected RUC for the company (if mismatch → error) */
	expectedRuc?: string;
}

// ─── Constants ─────────────────────────────────────────────────────

const VALID_BOOK_TYPES: PleBookType[] = [
	"LE-DIARIO",
	"LE-MAYOR",
	"LE-COMPRAS",
	"LE-VENTAS",
];

// ─── Helpers ───────────────────────────────────────────────────────

function isValidDate(dateStr: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
	const d = new Date(`${dateStr}T00:00:00Z`);
	return !Number.isNaN(d.getTime());
}

function parseAmount(value: string): number | null {
	const trimmed = value.trim();
	if (trimmed === "") return null;
	const num = Number(trimmed);
	if (Number.isNaN(num) || !Number.isFinite(num)) return null;
	return num;
}

function getPeriodMonths(period: string): { start: Date; end: Date } {
	const [year, month] = period.split("-").map(Number);
	const start = new Date(Date.UTC(year, month - 1, 1));
	const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
	return { start, end };
}

function isDateInPeriod(dateStr: string, period: string): boolean {
	if (!isValidDate(dateStr)) return false;
	const { start, end } = getPeriodMonths(period);
	const d = new Date(`${dateStr}T00:00:00Z`);
	return d >= start && d <= end;
}

// ─── Header Validation ─────────────────────────────────────────────

function validateHeader(
	header: string,
	bookType: PleBookType,
	options: PleValidationOptions,
): { errors: PleValidationError[]; headerRuc: string; headerPeriod: string } {
	const errors: PleValidationError[] = [];
	const parts = header.split("|");

	if (parts.length < 3) {
		errors.push({
			code: "MISSING_HEADER",
			message: `Header must have at least 3 pipe-delimited fields (RUC|period|bookType), got ${parts.length}`,
		});
		return { errors, headerRuc: "", headerPeriod: "" };
	}

	const [ruc, period, headerBookType] = parts;
	const headerRuc = ruc.trim();
	const headerPeriod = period.trim();

	// Validate RUC format: must be exactly 11 digits
	if (!/^\d{11}$/.test(headerRuc)) {
		errors.push({
			code: "MISSING_HEADER",
			message: `Header first field must be an 11-digit RUC, got "${headerRuc}"`,
		});
	}

	if (options.expectedRuc && headerRuc !== options.expectedRuc) {
		errors.push({
			code: "RUC_MISMATCH",
			message: `Header RUC "${headerRuc}" does not match expected "${options.expectedRuc}"`,
		});
	}

	if (headerBookType !== bookType) {
		errors.push({
			code: "BOOK_TYPE_MISMATCH",
			message: `Header book type "${headerBookType}" does not match expected "${bookType}"`,
		});
	}

	if (!/^\d{4}-\d{2}$/.test(headerPeriod)) {
		errors.push({
			code: "INVALID_PERIOD",
			message: `Invalid period format "${headerPeriod}", expected YYYY-MM`,
		});
	}

	return { errors, headerRuc, headerPeriod };
}

// ─── LE-DIARIO Validation ──────────────────────────────────────────

function validateDiario(lines: string[], period: string): PleValidationResult {
	const errors: PleValidationError[] = [];
	const warnings: PleValidationWarning[] = [];
	let totalDebit = 0;
	let totalCredit = 0;

	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split("|");
		const lineNum = i + 1;

		if (parts.length < 5) {
			errors.push({
				code: "INVALID_LINE_FORMAT",
				message: `Line ${lineNum}: expected 5 fields (date|glosa|cuenta|debe|haber), got ${parts.length}`,
				line: lineNum,
			});
			continue;
		}

		const [date, , accountCode, debitStr, creditStr] = parts;

		// Date validation
		if (!isValidDate(date.trim())) {
			errors.push({
				code: "INVALID_DATE",
				message: `Line ${lineNum}: invalid date "${date.trim()}"`,
				line: lineNum,
				field: "date",
			});
		} else if (!isDateInPeriod(date.trim(), period)) {
			warnings.push({
				code: "DATE_OUTSIDE_PERIOD",
				message: `Line ${lineNum}: date "${date.trim()}" is outside period ${period}`,
				line: lineNum,
			});
		}

		// Account code validation
		if (!accountCode.trim()) {
			errors.push({
				code: "MISSING_ACCOUNT_CODE",
				message: `Line ${lineNum}: account code is required`,
				line: lineNum,
				field: "accountCode",
			});
		}

		// Amount validation
		const debit = parseAmount(debitStr);
		const credit = parseAmount(creditStr);

		if (debit === null) {
			errors.push({
				code: "INVALID_AMOUNT",
				message: `Line ${lineNum}: invalid debit amount "${debitStr.trim()}"`,
				line: lineNum,
				field: "debit",
			});
		} else if (debit < 0) {
			errors.push({
				code: "NEGATIVE_AMOUNT",
				message: `Line ${lineNum}: negative debit amount ${debit}`,
				line: lineNum,
				field: "debit",
			});
		} else {
			totalDebit += debit;
		}

		if (credit === null) {
			errors.push({
				code: "INVALID_AMOUNT",
				message: `Line ${lineNum}: invalid credit amount "${creditStr.trim()}"`,
				line: lineNum,
				field: "credit",
			});
		} else if (credit < 0) {
			errors.push({
				code: "NEGATIVE_AMOUNT",
				message: `Line ${lineNum}: negative credit amount ${credit}`,
				line: lineNum,
				field: "credit",
			});
		} else {
			totalCredit += credit;
		}
	}

	// Fiscal consistency: debit must equal credit
	const tolerance = 0.01;
	if (errors.length === 0 && Math.abs(totalDebit - totalCredit) > tolerance) {
		errors.push({
			code: "DEBIT_CREDIT_MISMATCH",
			message: `Total debit (${totalDebit.toFixed(2)}) does not equal total credit (${totalCredit.toFixed(2)})`,
		});
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// ─── LE-MAYOR Validation ───────────────────────────────────────────

function validateMayor(lines: string[]): PleValidationResult {
	const errors: PleValidationError[] = [];
	const warnings: PleValidationWarning[] = [];

	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split("|");
		const lineNum = i + 1;

		if (parts.length < 6) {
			errors.push({
				code: "INVALID_LINE_FORMAT",
				message: `Line ${lineNum}: expected 6 fields, got ${parts.length}`,
				line: lineNum,
			});
			continue;
		}

		const [
			accountCode,
			,
			saldoAnteriorStr,
			debitStr,
			creditStr,
			saldoActualStr,
		] = parts;

		if (!accountCode.trim()) {
			errors.push({
				code: "MISSING_ACCOUNT_CODE",
				message: `Line ${lineNum}: account code is required`,
				line: lineNum,
				field: "accountCode",
			});
		}

		const saldoAnterior = parseAmount(saldoAnteriorStr);
		const debit = parseAmount(debitStr);
		const credit = parseAmount(creditStr);
		const saldoActual = parseAmount(saldoActualStr);

		if (
			saldoAnterior === null ||
			debit === null ||
			credit === null ||
			saldoActual === null
		) {
			errors.push({
				code: "INVALID_AMOUNT",
				message: `Line ${lineNum}: one or more invalid amounts`,
				line: lineNum,
			});
			continue;
		}

		// Balance formula: saldo_actual = saldo_anterior + debe - haber
		const expectedBalance = saldoAnterior + debit - credit;
		const tolerance = 0.01;
		if (Math.abs(expectedBalance - saldoActual) > tolerance) {
			errors.push({
				code: "BALANCE_MISMATCH",
				message: `Line ${lineNum}: balance mismatch — expected ${expectedBalance.toFixed(2)}, got ${saldoActual.toFixed(2)}`,
				line: lineNum,
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// ─── LE-COMPRAS / LE-VENTAS Validation ─────────────────────────────

function validateComprasVentas(
	lines: string[],
	period: string,
): PleValidationResult {
	const errors: PleValidationError[] = [];
	const warnings: PleValidationWarning[] = [];

	for (let i = 1; i < lines.length; i++) {
		const parts = lines[i].split("|");
		const lineNum = i + 1;

		if (parts.length < 9) {
			errors.push({
				code: "INVALID_LINE_FORMAT",
				message: `Line ${lineNum}: expected 9 fields, got ${parts.length}`,
				line: lineNum,
			});
			continue;
		}

		const [ruc, , , , , date, baseStr, igvStr, totalStr] = parts;

		// RUC validation
		if (!/^\d{11}$/.test(ruc.trim())) {
			errors.push({
				code: "INVALID_RUC",
				message: `Line ${lineNum}: invalid RUC "${ruc.trim()}"`,
				line: lineNum,
				field: "ruc",
			});
		}

		// Date validation
		if (!isValidDate(date.trim())) {
			errors.push({
				code: "INVALID_DATE",
				message: `Line ${lineNum}: invalid date "${date.trim()}"`,
				line: lineNum,
				field: "date",
			});
		} else if (!isDateInPeriod(date.trim(), period)) {
			warnings.push({
				code: "DATE_OUTSIDE_PERIOD",
				message: `Line ${lineNum}: date "${date.trim()}" is outside period ${period}`,
				line: lineNum,
			});
		}

		// IGV consistency: IGV should be base * 0.18 (within tolerance)
		const base = parseAmount(baseStr);
		const igv = parseAmount(igvStr);
		const total = parseAmount(totalStr);

		if (base === null || igv === null || total === null) {
			errors.push({
				code: "INVALID_AMOUNT",
				message: `Line ${lineNum}: one or more invalid amounts`,
				line: lineNum,
			});
			continue;
		}

		if (base < 0 || igv < 0 || total < 0) {
			errors.push({
				code: "NEGATIVE_AMOUNT",
				message: `Line ${lineNum}: negative amounts detected`,
				line: lineNum,
			});
			continue;
		}

		const expectedIgv = base * 0.18;
		const expectedTotal = base + igv;
		const tolerance = 0.02;

		if (Math.abs(igv - expectedIgv) > tolerance) {
			errors.push({
				code: "IGV_CONSISTENCY_ERROR",
				message: `Line ${lineNum}: IGV ${igv.toFixed(2)} does not match expected ${expectedIgv.toFixed(2)} (base × 18%)`,
				line: lineNum,
				field: "igv",
			});
		}

		if (Math.abs(total - expectedTotal) > tolerance) {
			errors.push({
				code: "TOTAL_CONSISTENCY_ERROR",
				message: `Line ${lineNum}: total ${total.toFixed(2)} does not equal base + IGV (${expectedTotal.toFixed(2)})`,
				line: lineNum,
				field: "total",
			});
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

// ─── Public API ────────────────────────────────────────────────────

export class PleValidator {
	/**
	 * Validate PLE TXT content against SUNAT rules.
	 *
	 * @param bookType - SUNAT PLE book type
	 * @param content - Full TXT content as string
	 * @param options - Optional validation constraints
	 */
	static validate(
		bookType: PleBookType,
		content: string,
		options: PleValidationOptions = {},
	): PleValidationResult {
		if (!VALID_BOOK_TYPES.includes(bookType)) {
			throw new Error(`Unsupported PLE book type: ${bookType}`);
		}

		const trimmed = content.trim();
		if (!trimmed) {
			return {
				valid: false,
				errors: [
					{
						code: "EMPTY_CONTENT",
						message: "Content is empty",
					},
				],
				warnings: [],
			};
		}

		const lines = trimmed.split("\n");
		const headerLine = lines[0];

		// Validate header
		const headerResult = validateHeader(headerLine, bookType, options);
		if (headerResult.errors.length > 0) {
			return {
				valid: false,
				errors: headerResult.errors,
				warnings: [],
			};
		}

		// Validate body based on book type
		const period = headerResult.headerPeriod;
		let bodyResult: PleValidationResult;

		switch (bookType) {
			case "LE-DIARIO":
				bodyResult = validateDiario(lines, period);
				break;
			case "LE-MAYOR":
				bodyResult = validateMayor(lines);
				break;
			case "LE-COMPRAS":
			case "LE-VENTAS":
				bodyResult = validateComprasVentas(lines, period);
				break;
			default:
				throw new Error(`Unsupported PLE book type: ${bookType}`);
		}

		return bodyResult;
	}
}

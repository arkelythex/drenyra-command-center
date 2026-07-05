import { createHash } from "node:crypto";

/**
 * AuditQueryFingerprintInput interface.
 *
 * @example
 * ```ts
 * const value: AuditQueryFingerprintInput = {} as AuditQueryFingerprintInput;
 * console.log(value);
 * ```
 */
export interface AuditQueryFingerprintInput {
	economicGroupId: string;
	detractionProfile?: string;
	detractionRuleCode?: string;
	dateFrom?: string;
	dateTo?: string;
	limit?: number;
	offset?: number;
	sortBy?: string;
	sortDir?: string;
}

const ISO_CIVIL_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const PERU_UTC_OFFSET = "-05:00";

function parsePeruCivilDate(value: string, boundary: "start" | "end"): Date {
	const match = ISO_CIVIL_DATE_RE.exec(value);
	if (!match) {
		throw new Error(`Invalid date format: ${value}`);
	}

	const year = Number.parseInt(match[1], 10);
	const month = Number.parseInt(match[2], 10);
	const day = Number.parseInt(match[3], 10);

	const validationDate = new Date(Date.UTC(year, month - 1, day));
	if (
		validationDate.getUTCFullYear() !== year ||
		validationDate.getUTCMonth() !== month - 1 ||
		validationDate.getUTCDate() !== day
	) {
		throw new Error(`Invalid date value: ${value}`);
	}

	const time = boundary === "start" ? "00:00:00.000" : "23:59:59.999";
	return new Date(`${value}T${time}${PERU_UTC_OFFSET}`);
}

function escapeCsvCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	const raw =
		value instanceof Date
			? value.toISOString()
			: typeof value === "object"
				? JSON.stringify(value)
				: String(value);

	if (!/[,"\n]/.test(raw)) return raw;
	return `"${raw.replace(/"/g, '""')}"`;
}

/**
 * buildDetractionAuditCsv operation.
 *
 * @param items - Input for items.
 * @returns Result of buildDetractionAuditCsv.
 * @example
 * ```ts
 * const result = buildDetractionAuditCsv({} as Array);
 * console.log(result);
 * ```
 */
export function buildDetractionAuditCsv(
	items: Array<Record<string, unknown>>,
): string {
	const headers = [
		"id",
		"createdAt",
		"economicGroupId",
		"fromCompanyId",
		"fromCompanyName",
		"fromCompanyRuc",
		"toCompanyId",
		"toCompanyName",
		"toCompanyRuc",
		"amount",
		"currency",
		"taxType",
		"igvAmount",
		"detractionAmount",
		"detractionRate",
		"detractionProfile",
		"detractionRuleCode",
		"status",
		"reconciledAt",
	];

	const lines = [headers.join(",")];
	for (const item of items) {
		const row = headers.map((header) => escapeCsvCell(item[header]));
		lines.push(row.join(","));
	}

	return `\uFEFF${lines.join("\n")}`;
}

/**
 * buildAuditQueryFingerprint operation.
 *
 * @param input - Input for input.
 * @returns Result of buildAuditQueryFingerprint.
 * @example
 * ```ts
 * const result = buildAuditQueryFingerprint({} as AuditQueryFingerprintInput);
 * console.log(result);
 * ```
 */
export function buildAuditQueryFingerprint(
	input: AuditQueryFingerprintInput,
): string {
	const payload = {
		economicGroupId: input.economicGroupId,
		detractionProfile: input.detractionProfile ?? null,
		detractionRuleCode: input.detractionRuleCode ?? null,
		dateFrom: input.dateFrom ?? null,
		dateTo: input.dateTo ?? null,
		limit: input.limit ?? null,
		offset: input.offset ?? null,
		sortBy: input.sortBy ?? "createdAt",
		sortDir: input.sortDir ?? "desc",
	};

	return sha256Utf8(JSON.stringify(payload));
}

/**
 * parseAuditDateRange operation.
 *
 * @param input - Input for input.
 * @returns Result of parseAuditDateRange.
 * @throws Error when parseAuditDateRange cannot complete successfully.
 * @example
 * ```ts
 * const result = parseAuditDateRange({});
 * console.log(result);
 * ```
 */
export function parseAuditDateRange(input: {
	dateFrom?: string;
	dateTo?: string;
}): {
	dateFrom?: Date;
	dateTo?: Date;
} {
	const dateFrom = input.dateFrom
		? parsePeruCivilDate(input.dateFrom, "start")
		: undefined;
	const dateTo = input.dateTo
		? parsePeruCivilDate(input.dateTo, "end")
		: undefined;

	if (dateFrom && dateTo && dateFrom.getTime() > dateTo.getTime()) {
		throw new Error(
			"Invalid date range: dateFrom must be before or equal to dateTo",
		);
	}

	return { dateFrom, dateTo };
}

/**
 * sha256Utf8 operation.
 *
 * @param value - Input for value.
 * @returns Result of sha256Utf8.
 * @example
 * ```ts
 * const result = sha256Utf8("");
 * console.log(result);
 * ```
 */
export function sha256Utf8(value: string): string {
	return createHash("sha256").update(value, "utf8").digest("hex");
}

/**
 * sha256Json operation.
 *
 * @param value - Input for value.
 * @returns Result of sha256Json.
 * @example
 * ```ts
 * const result = sha256Json(undefined);
 * console.log(result);
 * ```
 */
export function sha256Json(value: unknown): string {
	return sha256Utf8(JSON.stringify(value));
}

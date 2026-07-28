import { and, eq } from "@drenyra/persistence/query";
import type { accountingPeriods } from "@drenyra/persistence/schema";

/**
 * Fiscal period database query dependency.
 * Abstracts the DB call so unit tests can inject a mock.
 */
export type FiscalPeriodDbQuery = (input: {
	companyId: string;
	year: number;
	month: number;
}) => Promise<{ id: string }[]>;

/**
 * Default production implementation: query accountingPeriods table.
 */
async function queryAccountingPeriods(input: {
	companyId: string;
	year: number;
	month: number;
}): Promise<{ id: string }[]> {
	const { db, schema } = await import("../../../lib/db");
	return db
		.select({ id: schema.accountingPeriods.id })
		.from(schema.accountingPeriods)
		.where(
			and(
				eq(schema.accountingPeriods.companyId, input.companyId),
				eq(schema.accountingPeriods.year, input.year),
				eq(schema.accountingPeriods.month, input.month),
			),
		)
		.limit(1);
}

/**
 * Error thrown when a fiscal period is not valid for a given company.
 * @example
 * ```ts
 * throw new FiscalPeriodValidationError("FISCAL_PERIOD_INVALID", companyId, period);
 * ```
 */
export class FiscalPeriodValidationError extends Error {
	readonly code: "FISCAL_PERIOD_INVALID";
	readonly companyId: string;
	readonly period: string;

	constructor(
		code: "FISCAL_PERIOD_INVALID",
		companyId: string,
		period: string,
	) {
		super(`Fiscal period "${period}" is not valid for company ${companyId}`);
		this.name = "FiscalPeriodValidationError";
		this.code = code;
		this.companyId = companyId;
		this.period = period;
	}
}

/**
 * Parse a "YYYY-MM" period string into year and month integers.
 */
function parsePeriod(period: string): { year: number; month: number } {
	const [yearText, monthText] = period.split("-");
	const year = Number(yearText);
	const month = Number(monthText);

	if (
		!Number.isInteger(year) ||
		!Number.isInteger(month) ||
		month < 1 ||
		month > 12
	) {
		throw new FiscalPeriodValidationError(
			"FISCAL_PERIOD_INVALID",
			"",
			period,
		);
	}

	return { year, month };
}

export interface ResolveFiscalPeriodIdDeps {
	queryDb?: FiscalPeriodDbQuery;
}

/**
 * Resolve the fiscal period ID from a company's fiscal calendar.
 *
 * Queries `accounting_periods` by company and period (YYYY-MM),
 * returning the period UUID when present. Throws `FiscalPeriodValidationError`
 * when the period is not found in the company's fiscal calendar.
 *
 * @param companyId - Authenticated company identifier.
 * @param period - Period in "YYYY-MM" format.
 * @param deps - Optional DB query dependency injection for tests.
 * @returns The fiscal period UUID from the database.
 * @throws FiscalPeriodValidationError when period is not valid for the company.
 * @example
 * ```ts
 * const fiscalPeriodId = await resolveFiscalPeriodId("cmp-123", "2026-03");
 * ```
 */
export async function resolveFiscalPeriodId(
	companyId: string,
	period: string,
	deps: ResolveFiscalPeriodIdDeps = {},
): Promise<string> {
	const queryDb = deps.queryDb ?? queryAccountingPeriods;
	const { year, month } = parsePeriod(period);

	const rows = await queryDb({ companyId, year, month });

	if (!rows[0]) {
		throw new FiscalPeriodValidationError(
			"FISCAL_PERIOD_INVALID",
			companyId,
			period,
		);
	}

	return rows[0].id;
}

/**
 * Accounting Schema — Validation Tests
 *
 * Verifies that the accounting Drizzle schema compiles correctly
 * and all expected tables are exported from the schema barrel.
 */

import { describe, expect, it } from "vitest";
import {
	accountingPeriods,
	cpeLog,
	detractions,
	exchangeRates,
	journalEntries,
	journalEntryLines,
	pcgeAccounts,
} from "../schema/index";

// Helper to get all column names from a Drizzle table
function getColumnNames(table: Record<string, unknown>): string[] {
	return Object.keys(table).filter(
		(key) =>
			key !== "Symbol(drizzle:Name)" &&
			key !== "Symbol(drizzle:OriginalName)" &&
			key !== "Symbol(drizzle:Schema)" &&
			key !== "Symbol(drizzle:Columns)" &&
			key !== "Symbol(drizzle:ExtraConfigColumns)" &&
			key !== "enableRLS",
	);
}

describe("Accounting Schema", () => {
	it("should export pcgeAccounts table", () => {
		expect(pcgeAccounts).toBeDefined();
		const columns = getColumnNames(pcgeAccounts as Record<string, unknown>);
		expect(columns).toContain("code");
		expect(columns).toContain("level");
		expect(columns).toContain("type");
	});

	it("should export accountingPeriods table", () => {
		expect(accountingPeriods).toBeDefined();
		const columns = getColumnNames(
			accountingPeriods as Record<string, unknown>,
		);
		expect(columns).toContain("year");
		expect(columns).toContain("month");
		expect(columns).toContain("status");
	});

	it("should export exchangeRates table", () => {
		expect(exchangeRates).toBeDefined();
		const columns = getColumnNames(exchangeRates as Record<string, unknown>);
		expect(columns).toContain("currencyFrom");
		expect(columns).toContain("currencyTo");
		expect(columns).toContain("buyRate");
	});

	it("should export cpeLog table", () => {
		expect(cpeLog).toBeDefined();
		const columns = getColumnNames(cpeLog as Record<string, unknown>);
		expect(columns).toContain("sunatStatus");
		expect(columns).toContain("sunatTicket");
	});

	it("should export detractions table", () => {
		expect(detractions).toBeDefined();
		const columns = getColumnNames(detractions as Record<string, unknown>);
		expect(columns).toContain("spotCode");
		expect(columns).toContain("amountCents");
	});

	it("should export journalEntries table", () => {
		expect(journalEntries).toBeDefined();
		const columns = getColumnNames(journalEntries as Record<string, unknown>);
		expect(columns).toContain("entryNumber");
		expect(columns).toContain("periodKey");
		expect(columns).toContain("gloss");
	});

	it("should export journalEntryLines table", () => {
		expect(journalEntryLines).toBeDefined();
		const columns = getColumnNames(
			journalEntryLines as Record<string, unknown>,
		);
		expect(columns).toContain("debitCents");
		expect(columns).toContain("creditCents");
	});

	it("should have all 7 accounting tables with expected shape", () => {
		const tables = [
			{
				name: "pcgeAccounts",
				table: pcgeAccounts,
				expectedCols: ["code", "companyId", "type", "isActive"],
			},
			{
				name: "accountingPeriods",
				table: accountingPeriods,
				expectedCols: ["year", "month", "status"],
			},
			{
				name: "exchangeRates",
				table: exchangeRates,
				expectedCols: ["currencyFrom", "currencyTo", "buyRate"],
			},
			{
				name: "cpeLog",
				table: cpeLog,
				expectedCols: ["sunatStatus", "hashValue", "cdrData"],
			},
			{
				name: "detractions",
				table: detractions,
				expectedCols: ["spotCode", "amountCents", "status"],
			},
			{
				name: "journalEntries",
				table: journalEntries,
				expectedCols: ["entryNumber", "periodKey", "gloss"],
			},
			{
				name: "journalEntryLines",
				table: journalEntryLines,
				expectedCols: ["debitCents", "creditCents", "accountCode"],
			},
		];

		expect(tables).toHaveLength(7);

		for (const { name, table, expectedCols } of tables) {
			expect(table, `${name} should be defined`).toBeDefined();
			const columns = getColumnNames(table as Record<string, unknown>);
			for (const col of expectedCols) {
				expect(columns, `${name} should have column '${col}'`).toContain(col);
			}
		}
	});

	it("should have company FK in pcgeAccounts", () => {
		const columns = getColumnNames(pcgeAccounts as Record<string, unknown>);
		expect(columns).toContain("companyId");
		expect(columns).toContain("parentId");
	});

	it("should have SUNAT tracking fields in cpeLog", () => {
		const columns = getColumnNames(cpeLog as Record<string, unknown>);
		expect(columns).toContain("sunatStatus");
		expect(columns).toContain("sunatTicket");
		expect(columns).toContain("cdrData");
		expect(columns).toContain("hashValue");
		expect(columns).toContain("hashAlgorithm");
	});

	it("should have exchange rate fields", () => {
		const columns = getColumnNames(exchangeRates as Record<string, unknown>);
		expect(columns).toContain("buyRate");
		expect(columns).toContain("sellRate");
		expect(columns).toContain("sunatReference");
	});
});

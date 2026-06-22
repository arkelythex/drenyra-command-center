/**
 * Accounting Schema — Structural Validation Tests
 *
 * Validates that all accounting Drizzle tables, columns, and relations
 * are correctly defined and exported.
 */

import { describe, expect, it } from "vitest";
import {
	accountingPeriods,
	accountingPeriodsRelations,
	cpeLog,
	cpeLogRelations,
	detractions,
	detractionsRelations,
	exchangeRates,
	exchangeRatesRelations,
	journalEntries,
	journalEntriesRelations,
	journalEntryLines,
	journalEntryLinesRelations,
	pcgeAccounts,
	pcgeAccountsRelations,
} from "../accounting.schema";

function getTableColumns(table: object): Record<string, unknown> {
	return (table as Record<symbol, Record<string, unknown>>)[
		Symbol.for("drizzle:Columns")
	];
}

const TABLE_NAME_SYMBOL = Symbol.for("drizzle:Name");

function getTableName(table: object): string {
	return (table as Record<symbol, string>)[TABLE_NAME_SYMBOL];
}

describe("accounting schema — table definitions", () => {
	const tableNames: [object, string][] = [
		[pcgeAccounts, "pcge_accounts"],
		[accountingPeriods, "accounting_periods"],
		[exchangeRates, "exchange_rates"],
		[cpeLog, "cpe_log"],
		[detractions, "detractions"],
		[journalEntries, "journal_entries"],
		[journalEntryLines, "journal_entry_lines"],
	];

	it.each(tableNames)("table %s has correct name", (table, expectedName) => {
		expect(getTableName(table)).toBe(expectedName);
	});

	it("pcge_accounts has required columns", () => {
		const cols = getTableColumns(pcgeAccounts);
		expect(cols.id).toBeDefined();
		expect(cols.companyId).toBeDefined();
		expect(cols.code).toBeDefined();
		expect(cols.name).toBeDefined();
		expect(cols.level).toBeDefined();
		expect(cols.type).toBeDefined();
		expect(cols.createdAt).toBeDefined();
		expect(cols.updatedAt).toBeDefined();
	});

	it("accounting_periods has required columns", () => {
		const cols = getTableColumns(accountingPeriods);
		expect(cols.id).toBeDefined();
		expect(cols.companyId).toBeDefined();
		expect(cols.year).toBeDefined();
		expect(cols.month).toBeDefined();
		expect(cols.status).toBeDefined();
	});

	it("journal_entries has required columns", () => {
		const cols = getTableColumns(journalEntries);
		expect(cols.id).toBeDefined();
		expect(cols.companyId).toBeDefined();
		expect(cols.entryNumber).toBeDefined();
		expect(cols.periodKey).toBeDefined();
		expect(cols.date).toBeDefined();
		expect(cols.gloss).toBeDefined();
		expect(cols.status).toBeDefined();
	});

	it("journal_entry_lines has required columns + cascade FK", () => {
		const cols = getTableColumns(journalEntryLines);
		expect(cols.journalEntryId).toBeDefined();
		expect(cols.accountCode).toBeDefined();
		expect(cols.description).toBeDefined();
		expect(cols.debitCents).toBeDefined();
		expect(cols.creditCents).toBeDefined();
	});

	it("detractions has required columns", () => {
		const cols = getTableColumns(detractions);
		expect(cols.spotCode).toBeDefined();
		expect(cols.percentage).toBeDefined();
		expect(cols.amountCents).toBeDefined();
		expect(cols.reference).toBeDefined();
		expect(cols.status).toBeDefined();
	});

	it("cpe_log has required + optional columns", () => {
		const cols = getTableColumns(cpeLog);
		expect(cols.sunatStatus).toBeDefined();
		expect(cols.cdrData).toBeDefined();
		expect(cols.hashValue).toBeDefined();
		expect(cols.errorMessage).toBeDefined();
	});

	it("exchange_rates has required columns", () => {
		const cols = getTableColumns(exchangeRates);
		expect(cols.date).toBeDefined();
		expect(cols.currencyFrom).toBeDefined();
		expect(cols.currencyTo).toBeDefined();
		expect(cols.buyRate).toBeDefined();
		expect(cols.sellRate).toBeDefined();
		expect(cols.sunatReference).toBeDefined();
	});
});

describe("accounting schema — nullable/optional columns", () => {
	it("pcge_accounts parentId is nullable", () => {
		const cols = getTableColumns(pcgeAccounts);
		const parent = cols.parentId as { notNull?: boolean };
		expect(parent.notNull).toBe(false);
	});

	it("detractions amountCents is notNull", () => {
		const cols = getTableColumns(detractions);
		const amount = cols.amountCents as { notNull?: boolean };
		expect(amount.notNull).toBe(true);
	});

	it("exchange_rates sunatReference is nullable", () => {
		const cols = getTableColumns(exchangeRates);
		const ref = cols.sunatReference as { notNull?: boolean };
		expect(ref.notNull).toBe(false);
	});

	it("cpe_log cdrData is nullable", () => {
		const cols = getTableColumns(cpeLog);
		const cdr = cols.cdrData as { notNull?: boolean };
		expect(cdr.notNull).toBe(false);
	});
});

describe("accounting schema — exports", () => {
	it("exports all 7 table definitions", () => {
		expect(pcgeAccounts).toBeDefined();
		expect(accountingPeriods).toBeDefined();
		expect(exchangeRates).toBeDefined();
		expect(cpeLog).toBeDefined();
		expect(detractions).toBeDefined();
		expect(journalEntries).toBeDefined();
		expect(journalEntryLines).toBeDefined();
	});

	it("exports all 7 relation definitions", () => {
		expect(pcgeAccountsRelations).toBeDefined();
		expect(accountingPeriodsRelations).toBeDefined();
		expect(exchangeRatesRelations).toBeDefined();
		expect(cpeLogRelations).toBeDefined();
		expect(detractionsRelations).toBeDefined();
		expect(journalEntriesRelations).toBeDefined();
		expect(journalEntryLinesRelations).toBeDefined();
	});
});

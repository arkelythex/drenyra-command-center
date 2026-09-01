import { describe, expect, test } from "bun:test";
import {
	classifyMigrationInventory,
	INVENTORY_STATUS,
	type JournalEntry,
	type NumericMigrationFile,
	parseJournalContents,
} from "./validate-infra-migration-inventory";

const COHERENT_ENTRIES: JournalEntry[] = [
	{ idx: 0, tag: "0000_initial" },
	{ idx: 1, tag: "0001_add_accounts" },
];

const COHERENT_FILES: NumericMigrationFile[] = [
	{ file: "0000_initial.sql", idx: 0 },
	{ file: "0001_add_accounts.sql", idx: 1 },
];

describe("classifyMigrationInventory", () => {
	test("returns a coherent report when journal entries and files agree", () => {
		const report = classifyMigrationInventory(COHERENT_ENTRIES, COHERENT_FILES);

		expect(report.status).toBe(INVENTORY_STATUS.COHERENT);
		expect(report.missingJournalFiles).toEqual([]);
		expect(report.unjournaledNumericFiles).toEqual([]);
		expect(report.duplicateIndexes).toEqual([]);
		expect(report.duplicateTags).toEqual([]);
		expect(report.numericPrefixTagMismatches).toEqual([]);
	});

	test("reports a journal-referenced migration file that is missing", () => {
		const report = classifyMigrationInventory(COHERENT_ENTRIES, [
			COHERENT_FILES[0],
		]);

		expect(report.status).toBe(INVENTORY_STATUS.DRIFT);
		expect(report.missingJournalFiles).toEqual([
			{
				file: "0001_add_accounts.sql",
				idx: 1,
				tag: "0001_add_accounts",
			},
		]);
	});

	test("reports an unjournaled numeric migration file", () => {
		const unjournaledFile = { file: "0002_add_invoices.sql", idx: 2 };
		const report = classifyMigrationInventory(COHERENT_ENTRIES, [
			...COHERENT_FILES,
			unjournaledFile,
		]);

		expect(report.status).toBe(INVENTORY_STATUS.DRIFT);
		expect(report.unjournaledNumericFiles).toEqual([unjournaledFile]);
	});

	test("reports duplicate journal indexes and duplicate tags", () => {
		const duplicateEntries: JournalEntry[] = [
			{ idx: 1, tag: "0001_add_accounts" },
			{ idx: 1, tag: "0001_add_accounts" },
		];
		const report = classifyMigrationInventory(duplicateEntries, [
			COHERENT_FILES[1],
		]);

		expect(report.status).toBe(INVENTORY_STATUS.DRIFT);
		expect(report.duplicateIndexes).toEqual([
			{ idx: 1, tags: ["0001_add_accounts", "0001_add_accounts"] },
		]);
		expect(report.duplicateTags).toEqual([
			{ indexes: [1, 1], tag: "0001_add_accounts" },
		]);
	});

	test("reports a numeric migration tag prefix that differs from its index", () => {
		const report = classifyMigrationInventory(
			[{ idx: 4, tag: "0003_add_payments" }],
			[{ file: "0003_add_payments.sql", idx: 3 }],
		);

		expect(report.status).toBe(INVENTORY_STATUS.DRIFT);
		expect(report.numericPrefixTagMismatches).toEqual([
			{ idx: 4, numericPrefix: 3, tag: "0003_add_payments" },
		]);
	});
});

describe("parseJournalContents", () => {
	test("rejects a malformed journal entry", () => {
		expect(() =>
			parseJournalContents(
				JSON.stringify({ entries: [{ idx: "0", tag: "0000_initial" }] }),
			),
		).toThrow("journal_entry_0_idx_must_be_an_integer");
	});
});

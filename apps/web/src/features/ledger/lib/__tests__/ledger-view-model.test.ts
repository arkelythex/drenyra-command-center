import { describe, expect, it } from "vitest";
import { LEDGER_ALL_ACCOUNTS_ID } from "../ledger-constants";
import {
	buildLedgerSidebarAccounts,
	filterTransactionsByCategoryName,
	getCalendarMonthBounds,
	mapChartRowsToSidebarAccounts,
	mapGeneralLedgerRowsToTransactions,
	toLedgerPeriodQueryKeys,
} from "../ledger-view-model";

describe("getCalendarMonthBounds", () => {
	it("returns first and last instant of the calendar month (local)", () => {
		const ref = new Date(2026, 3, 15);
		const { start, end } = getCalendarMonthBounds(ref);
		expect(start.getFullYear()).toBe(2026);
		expect(start.getMonth()).toBe(3);
		expect(start.getDate()).toBe(1);
		expect(end.getMonth()).toBe(3);
		expect(end.getDate()).toBe(30);
	});
});

describe("toLedgerPeriodQueryKeys", () => {
	it("uses stable YYYY-MM-DD keys for react-query", () => {
		const start = new Date("2026-01-05T12:00:00.000Z");
		const end = new Date("2026-01-31T23:59:59.999Z");
		expect(toLedgerPeriodQueryKeys(start, end)).toEqual({
			startKey: "2026-01-05",
			endKey: "2026-01-31",
		});
	});
});

describe("mapChartRowsToSidebarAccounts", () => {
	it("maps valid rows and skips invalid entries", () => {
		const rows = [
			{ code: "7010", name: "Ventas", activity: 2 },
			{ code: "bad" },
			null,
		];
		expect(mapChartRowsToSidebarAccounts(rows)).toEqual([
			{
				id: "7010",
				code: "7010",
				name: "Ventas",
				type: "ACCOUNT",
				activity: 2,
			},
		]);
	});
});

describe("mapGeneralLedgerRowsToTransactions", () => {
	it("maps API rows to display transactions", () => {
		const rows = [
			{
				id: "t1",
				date: "2026-01-10T00:00:00.000Z",
				voucher: "V-1",
				glosa: "Test",
				cuenta: "Ventas",
				debe: 0,
				haber: 100,
				doc: "F001-1",
				bancarizado: false,
			},
		];
		const out = mapGeneralLedgerRowsToTransactions(rows);
		expect(out).toHaveLength(1);
		expect(out[0]?.cuenta).toBe("Ventas");
		expect(out[0]?.date).toMatch(/^\d{2}\/\d{2}$/);
	});
});

describe("filterTransactionsByCategoryName", () => {
	it("returns all when category is null", () => {
		const txs = [
			{
				id: "1",
				date: "",
				voucher: "",
				glosa: "",
				cuenta: "A",
				debe: 0,
				haber: 0,
				doc: "",
			},
			{
				id: "2",
				date: "",
				voucher: "",
				glosa: "",
				cuenta: "B",
				debe: 0,
				haber: 0,
				doc: "",
			},
		];
		expect(filterTransactionsByCategoryName(txs, null)).toHaveLength(2);
	});

	it("filters by category name", () => {
		const txs = [
			{
				id: "1",
				cuenta: "X",
				date: "",
				voucher: "",
				glosa: "",
				debe: 0,
				haber: 0,
				doc: "",
			},
			{
				id: "2",
				cuenta: "Y",
				date: "",
				voucher: "",
				glosa: "",
				debe: 0,
				haber: 0,
				doc: "",
			},
		];
		expect(filterTransactionsByCategoryName(txs, "X")).toHaveLength(1);
	});
});

describe("buildLedgerSidebarAccounts", () => {
	it("prepends the virtual all-accounts row", () => {
		const base = mapChartRowsToSidebarAccounts([
			{ code: "7010", name: "Ventas", activity: 3 },
		]);
		const sidebar = buildLedgerSidebarAccounts(base);
		expect(sidebar[0]?.id).toBe(LEDGER_ALL_ACCOUNTS_ID);
		expect(sidebar).toHaveLength(2);
	});
});

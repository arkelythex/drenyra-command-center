import { bills, businessPartners, invoices } from "@drenyra/persistence/schema";
import { describe, expect, it } from "vitest";
import { getGeneralLedger } from "../../application/queries/get-general-ledger";

/** Records the query the use case builds and returns canned rows per table. */
function fakeDb(rowsByTable: Map<unknown, unknown[]>) {
	const log: Array<{
		table: unknown;
		fields: Record<string, unknown>;
		joins: unknown[];
	}> = [];
	const db = {
		select(fields: Record<string, unknown>) {
			const q = { table: undefined as unknown, fields, joins: [] as unknown[] };
			const chain: Record<string, unknown> = {
				from(table: unknown) {
					q.table = table;
					log.push(q);
					return chain;
				},
				leftJoin(table: unknown) {
					q.joins.push(table);
					return chain;
				},
				innerJoin(table: unknown) {
					q.joins.push(table);
					return chain;
				},
				where: () => chain,
				orderBy: () => Promise.resolve(rowsByTable.get(q.table) ?? []),
			};
			return chain;
		},
	};
	return { db: db as never, log };
}

const START = new Date("2026-06-01T00:00:00Z");
const END = new Date("2026-06-30T23:59:59Z");

describe("getGeneralLedger (reports)", () => {
	const rows = new Map<unknown, unknown[]>([
		[
			invoices,
			[
				{
					id: "i1",
					date: new Date("2026-06-10T00:00:00Z"),
					number: "F001-1",
					amount: "118.00",
					status: "ISSUED",
					customerName: "ACME SAC",
				},
			],
		],
		[
			bills,
			[
				{
					id: "b1",
					date: new Date("2026-06-12T00:00:00Z"),
					number: "B001-9",
					amount: "59.00",
					status: "ISSUED",
					supplierName: "PROVEEDOR SRL",
				},
			],
		],
	]);

	it("never selects an undefined column (the schema has no customerName/supplierName)", async () => {
		const { db, log } = fakeDb(rows);
		await getGeneralLedger("c1", START, END, undefined, db);
		for (const q of log) {
			for (const [name, column] of Object.entries(q.fields)) {
				expect(column, `select field "${name}" is undefined`).toBeDefined();
			}
		}
	});

	it("takes the customer and supplier names from the joined business partner (legal name)", async () => {
		const { db, log } = fakeDb(rows);
		await getGeneralLedger("c1", START, END, undefined, db);
		const invoiceQuery = log.find((q) => q.table === invoices);
		const billQuery = log.find((q) => q.table === bills);
		expect(invoiceQuery?.joins).toContain(businessPartners);
		expect(billQuery?.joins).toContain(businessPartners);
		expect(invoiceQuery?.fields.customerName).toBe(businessPartners.legalName);
		expect(billQuery?.fields.supplierName).toBe(businessPartners.legalName);
	});

	it("keeps the entry layout: sales credit, purchases debit, running balance", async () => {
		const { db } = fakeDb(rows);
		const report = await getGeneralLedger("c1", START, END, undefined, db);
		expect(report.entries).toEqual([
			{
				date: "2026-06-10",
				voucherNo: "INV-F001-1",
				accountCode: "701",
				description: "FACTURA F001-1 - ACME SAC",
				debit: "0.00",
				credit: "118.00",
				balance: "118.00",
			},
			{
				date: "2026-06-12",
				voucherNo: "BILL-B001-9",
				accountCode: "601",
				description: "COMPRA B001-9 - PROVEEDOR SRL",
				debit: "59.00",
				credit: "0.00",
				balance: "59.00",
			},
		]);
	});

	it("skips purchases when filtering by a non-expense account", async () => {
		const { db, log } = fakeDb(rows);
		await getGeneralLedger("c1", START, END, "701", db);
		expect(log.some((q) => q.table === bills)).toBe(false);
	});
});

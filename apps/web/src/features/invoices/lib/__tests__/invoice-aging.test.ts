import { describe, expect, it } from "vitest";
import { buildAging } from "../invoice-aging";

const inv = (
	id: string,
	name: string,
	dueDate: string,
	amount: number,
	status: "draft" | "sent" | "overdue" | "paid" = "sent",
	currency: "PEN" | "USD" = "PEN",
) => ({
	id,
	customer: { name, initials: "X" },
	dueDate,
	amount,
	status,
	currency,
	invoiceNumber: id,
});

const TODAY = new Date("2026-10-26T15:00:00.000Z");

describe("buildAging", () => {
	it("buckets unpaid invoices by days past due", () => {
		const { rows, totals } = buildAging(
			[
				inv("a", "Andina", "2026-11-05T00:00:00.000Z", 100), // not due
				inv("b", "Andina", "2026-10-26T00:00:00.000Z", 10), // due today = current
				inv("c", "Andina", "2026-10-10T00:00:00.000Z", 200), // 16 days
				inv("d", "Andina", "2026-09-10T00:00:00.000Z", 300), // 46 days
				inv("e", "Andina", "2026-07-01T00:00:00.000Z", 400), // 117 days
			],
			TODAY,
		);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			customer: "Andina",
			current: 110,
			d1to30: 200,
			d31to60: 300,
			d61plus: 400,
			total: 1010,
		});
		expect(totals).toEqual({
			current: 110,
			d1to30: 200,
			d31to60: 300,
			d61plus: 400,
			total: 1010,
		});
	});

	it("ignores drafts and paid invoices", () => {
		const { rows } = buildAging(
			[
				inv("a", "Andina", "2026-10-01T00:00:00.000Z", 100, "draft"),
				inv("b", "Andina", "2026-10-01T00:00:00.000Z", 100, "paid"),
			],
			TODAY,
		);
		expect(rows).toEqual([]);
	});

	it("keeps USD out of the sol totals and counts it", () => {
		const result = buildAging(
			[
				inv("a", "Andina", "2026-10-01T00:00:00.000Z", 100),
				inv("b", "Andina", "2026-10-01T00:00:00.000Z", 50, "sent", "USD"),
			],
			TODAY,
		);
		expect(result.totals.total).toBe(100);
		expect(result.excludedForeignCurrency).toBe(1);
	});

	it("orders customers by oldest debt first, then by balance", () => {
		const { rows } = buildAging(
			[
				inv("a", "Reciente", "2026-10-20T00:00:00.000Z", 9000),
				inv("b", "Atrasado", "2026-06-01T00:00:00.000Z", 10),
			],
			TODAY,
		);
		expect(rows.map((r) => r.customer)).toEqual(["Atrasado", "Reciente"]);
	});
});

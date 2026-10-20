import { describe, expect, it } from "vitest";
import {
	centsToDecimal,
	decimalToCents,
	planStatementImport,
	type StatementRow,
} from "../../application/statement-import";

const fee: StatementRow = {
	date: "2026-09-01",
	description: "COMISION MANTENIMIENTO",
	type: "DEBIT",
	amountCents: 1500,
};
const deposit: StatementRow = {
	date: "2026-09-02",
	description: "ABONO F001-123",
	reference: "F001-123",
	type: "CREDIT",
	amountCents: 118010,
};

describe("decimalToCents / centsToDecimal", () => {
	it("round-trips the numeric(19,4) column without floats", () => {
		expect(decimalToCents("1180.1000")).toBe(118010);
		expect(decimalToCents("-15.0000")).toBe(-1500);
		expect(decimalToCents("0")).toBe(0);
		expect(centsToDecimal(118010)).toBe("1180.10");
		expect(centsToDecimal(-1500)).toBe("-15.00");
		expect(centsToDecimal(5)).toBe("0.05");
	});

	it("refuses fractions of a cent", () => {
		expect(() => decimalToCents("10.0050")).toThrow(/céntimo/);
	});
});

describe("planStatementImport", () => {
	it("imports a fee as the first row of a new account, going negative", () => {
		const plan = planStatementImport(0, [], [fee, deposit]);

		expect(plan.rows.map((r) => r.balanceCents)).toEqual([-1500, 116510]);
		expect(plan.closingBalanceCents).toBe(116510);
		expect(plan.skipped).toBe(0);
	});

	it("skips rows already imported, so re-importing adds nothing", () => {
		const plan = planStatementImport(116510, [fee, deposit], [fee, deposit]);

		expect(plan.rows).toEqual([]);
		expect(plan.skipped).toBe(2);
		expect(plan.closingBalanceCents).toBe(116510);
	});

	it("keeps genuinely repeated movements (two equal fees, one already stored)", () => {
		const plan = planStatementImport(-1500, [fee], [fee, fee]);

		expect(plan.rows).toHaveLength(1);
		expect(plan.skipped).toBe(1);
		expect(plan.closingBalanceCents).toBe(-3000);
	});

	it("treats a different reference as a different movement", () => {
		const plan = planStatementImport(
			0,
			[deposit],
			[{ ...deposit, reference: "F001-124" }],
		);

		expect(plan.rows).toHaveLength(1);
	});

	it("rejects amounts that are not positive whole cents", () => {
		expect(() =>
			planStatementImport(0, [], [{ ...fee, amountCents: 10.5 }]),
		).toThrow(/céntimos/);
		expect(() =>
			planStatementImport(0, [], [{ ...fee, amountCents: 0 }]),
		).toThrow(/céntimos/);
	});
});

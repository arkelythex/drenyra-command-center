import { describe, expect, it } from "vitest";
import {
	bankAmountToCents,
	type OpenDocument,
	rankMatches,
} from "../bank-matching";

describe("bankAmountToCents", () => {
	it("reads the DB decimal (scale 4) exactly, signed by direction", () => {
		expect(bankAmountToCents("450.5000", "DEBIT")).toBe(-45050);
		expect(bankAmountToCents("15000.0000", "CREDIT")).toBe(1500000);
		expect(bankAmountToCents("-320.1", "DEBIT")).toBe(-32010);
		expect(bankAmountToCents("0.29", "CREDIT")).toBe(29);
	});

	it("rejects sub-cent amounts and garbage instead of rounding", () => {
		expect(() => bankAmountToCents("10.0050", "CREDIT")).toThrow(/céntimo/);
		expect(() => bankAmountToCents("abc", "CREDIT")).toThrow(/monto/);
		expect(() => bankAmountToCents("1e3", "CREDIT")).toThrow(/monto/);
	});
});

const invoice = (overrides: Partial<OpenDocument> = {}): OpenDocument => ({
	kind: "INVOICE",
	id: "inv-1",
	number: "F001-1234",
	partnerName: "ENTERPRISE CORP",
	issueDate: "2025-01-10",
	dueDate: "2025-01-14",
	openCents: 1500000,
	...overrides,
});

const credit = {
	id: "tx-1",
	description: "TRANSFERENCIA RECIBIDA - ENTERPRISE",
	reference: "F001-1234",
	transactionDate: "2025-01-14",
	amountCents: 1500000,
};

describe("rankMatches", () => {
	it("proposes the open invoice with the same amount and its number in the reference", () => {
		const [best] = rankMatches(credit, [invoice()]);
		expect(best).toMatchObject({ documentId: "inv-1", kind: "INVOICE" });
		expect(best?.score).toBe(100);
		expect(best?.reasons).toEqual([
			"Monto exacto: S/ 15000.00",
			"La referencia menciona F001-1234",
			"Fecha a 0 días del vencimiento",
		]);
	});

	it("only pairs inflows with invoices and outflows with bills", () => {
		const bill = invoice({ kind: "BILL", id: "bill-1" });
		expect(rankMatches(credit, [bill])).toEqual([]);
		const debit = { ...credit, amountCents: -1500000 };
		expect(rankMatches(debit, [invoice()])).toEqual([]);
		expect(rankMatches(debit, [bill])[0]?.documentId).toBe("bill-1");
	});

	it("never proposes a document whose open amount differs", () => {
		expect(rankMatches(credit, [invoice({ openCents: 1499999 })])).toEqual([]);
	});

	it("finds the number in the description, ignoring zeros and separators", () => {
		const tx = {
			...credit,
			reference: null,
			description: "PAGO FACT F001 00001234 ENTERPRISE",
		};
		const [best] = rankMatches(tx, [invoice()]);
		expect(best?.reasons).toContain("La referencia menciona F001-1234");
	});

	it("ranks by score, then by date closeness, and caps the list", () => {
		const docs = [
			invoice({
				id: "far",
				number: "F001-9",
				issueDate: "2025-03-01",
				dueDate: "2025-03-01",
			}),
			invoice({ id: "near", number: "F001-8", dueDate: "2025-01-15" }),
			invoice(),
			...Array.from({ length: 6 }, (_, i) =>
				invoice({
					id: `x${i}`,
					number: `F009-${i}`,
					issueDate: "2025-02-20",
					dueDate: "2025-02-20",
				}),
			),
		];
		const ranked = rankMatches(credit, docs);
		expect(ranked).toHaveLength(5);
		expect(ranked.map((m) => m.documentId).slice(0, 2)).toEqual([
			"inv-1",
			"near",
		]);
		expect(ranked[1]?.score).toBe(70);
		expect(ranked.at(-1)?.score).toBe(60);
	});
});

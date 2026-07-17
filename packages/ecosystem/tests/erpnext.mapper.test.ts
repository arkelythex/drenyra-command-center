import { describe, expect, it } from "vitest";
import {
	mapPurchaseInvoiceToJournalEntry,
	mapSalesInvoiceToJournalEntry,
} from "../src/adapters/erpnext/erpnext.mapper";
import { PCGE_TO_ERPNext_SAMPLE } from "../src/adapters/erpnext/erpnext.types";

describe("ERPNext Mapper", () => {
	const fiscalEvent = {
		companyRuc: "20123456789",
		companyName: "Drenyra SAC",
		invoiceId: "inv-001",
		invoiceSeries: "F001",
		invoiceNumber: "00000001",
		issueDate: "2026-06-01",
		currency: "PEN",
		totalCents: 118000, // 1,180.00
		igvCents: 18000, // 180.00
		subtotalCents: 100000, // 1,000.00
		customerRuc: "20876543210",
		customerName: "Cliente ABC",
	};

	const purchaseEvent = {
		...fiscalEvent,
		supplierRuc: "20876543210",
		supplierName: "Proveedor XYZ",
		customerName: undefined,
		customerRuc: undefined,
	};

	it("maps sales invoice to journal entry", () => {
		const entry = mapSalesInvoiceToJournalEntry(
			fiscalEvent,
			PCGE_TO_ERPNext_SAMPLE,
		);

		expect(entry.postingDate).toBe("2026-06-01");
		expect(entry.company).toBe("Drenyra SAC");
		expect(entry.accounts).toHaveLength(3);

		// Debit: Customer receivable
		expect(entry.accounts[0].debitInAccountCurrency).toBe(1180);
		expect(entry.accounts[0].creditInAccountCurrency).toBe(0);
		expect(entry.accounts[0].partyType).toBe("Customer");

		// Credit: Sales
		expect(entry.accounts[1].creditInAccountCurrency).toBe(1000);
		expect(entry.accounts[1].debitInAccountCurrency).toBe(0);

		// Credit: IGV payable
		expect(entry.accounts[2].creditInAccountCurrency).toBe(180);
		expect(entry.accounts[2].debitInAccountCurrency).toBe(0);
	});

	it("maps purchase invoice to journal entry", () => {
		const entry = mapPurchaseInvoiceToJournalEntry(
			purchaseEvent,
			PCGE_TO_ERPNext_SAMPLE,
		);

		expect(entry.postingDate).toBe("2026-06-01");
		expect(entry.company).toBe("Drenyra SAC");
		expect(entry.accounts).toHaveLength(3);

		// Debit: Purchases
		expect(entry.accounts[0].debitInAccountCurrency).toBe(1000);
		expect(entry.accounts[0].creditInAccountCurrency).toBe(0);

		// Debit: IGV credit
		expect(entry.accounts[1].debitInAccountCurrency).toBe(180);

		// Credit: Supplier payable
		expect(entry.accounts[2].creditInAccountCurrency).toBe(1180);
		expect(entry.accounts[2].partyType).toBe("Supplier");
	});

	it("uses custom PCGE mapping when provided", () => {
		const customMapping = {
			"12": "Custom Receivables",
			"70": "Custom Sales",
		};
		const entry = mapSalesInvoiceToJournalEntry(fiscalEvent, customMapping);

		expect(entry.accounts[0].account).toBe("Custom Receivables");
		expect(entry.accounts[1].account).toBe("Custom Sales");
	});

	it("includes invoice reference in remarks", () => {
		const entry = mapSalesInvoiceToJournalEntry(fiscalEvent);
		expect(entry.billNo).toBe("F001-00000001");
		expect(entry.userRemark).toContain("F001-00000001");
	});
});

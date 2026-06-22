/**
 * Invoice Entity Tests
 * Unit tests for Invoice domain logic
 */

import { Money } from "@arkelythex/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { Invoice, type InvoiceItem } from "../../domain/invoice.entity";

describe("Invoice Entity", () => {
	let sampleItem: InvoiceItem;

	beforeEach(() => {
		sampleItem = {
			id: "item_1",
			description: "Servicio de consultoría",
			quantity: 1,
			unitPrice: Money.fromAmount(100.0, "PEN"),
			taxType: "GRAVADO",
			igvRate: 18.0,
			subtotal: Money.fromAmount(84.75, "PEN"),
			igvAmount: Money.fromAmount(15.25, "PEN"),
			totalAmount: Money.fromAmount(100.0, "PEN"),
		};
	});

	describe("Invoice.create()", () => {
		it("should create an invoice in DRAFT status", () => {
			const invoice = Invoice.create({
				id: "inv_test_1",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 1,
				invoiceNumber: "F001-00000001",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(invoice.status).toBe("DRAFT");
			expect(invoice.invoiceNumber).toBe("F001-00000001");
			expect(invoice.totalAmount.toString()).toBe("100.00");
		});

		it("should calculate totals correctly from multiple items", () => {
			const item2: InvoiceItem = {
				id: "item_2",
				description: "Producto adicional",
				quantity: 2,
				unitPrice: Money.fromAmount(50.0, "PEN"),
				taxType: "GRAVADO",
				igvRate: 18.0,
				subtotal: Money.fromAmount(84.75, "PEN"),
				igvAmount: Money.fromAmount(15.25, "PEN"),
				totalAmount: Money.fromAmount(100.0, "PEN"),
			};

			const invoice = Invoice.create({
				id: "inv_test_2",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 2,
				invoiceNumber: "F001-00000002",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem, item2],
			});

			expect(invoice.totalAmount.toString()).toBe("200.00"); // 100 + 100
			expect(invoice.balanceDue.toString()).toBe("200.00"); // Initially unpaid
		});

		it("should set balanceDue equal to totalAmount initially", () => {
			const invoice = Invoice.create({
				id: "inv_test_3",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 3,
				invoiceNumber: "F001-00000003",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(invoice.balanceDue.toString()).toBe(
				invoice.totalAmount.toString(),
			);
			expect(invoice.balanceDue.toString()).toBe("100.00");
		});
	});

	describe("canEdit()", () => {
		it("should return true for DRAFT invoices", () => {
			const invoice = Invoice.create({
				id: "inv_test_4",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 4,
				invoiceNumber: "F001-00000004",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(invoice.canEdit()).toBe(true);
		});

		it("should return false for SENT invoices", () => {
			const invoice = Invoice.create({
				id: "inv_test_5",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 5,
				invoiceNumber: "F001-00000005",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const sentInvoice = invoice.markAsSent(
				"https://sunat.gob.pe/cdr/F001-00000005.xml",
				"TKT-2026-001",
			);

			expect(sentInvoice.canEdit()).toBe(false);
			expect(sentInvoice.status).toBe("SENT");
		});
	});

	describe("isOverdue()", () => {
		it("should return true if SENT and past due date", () => {
			const pastDueDate = new Date("2025-01-01"); // In the past
			const invoice = Invoice.create({
				id: "inv_test_6",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 6,
				invoiceNumber: "F001-00000006",
				issueDate: new Date("2024-12-01"),
				dueDate: pastDueDate,
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const sentInvoice = invoice.markAsSent("cdr-url", "ticket");

			expect(sentInvoice.isOverdue()).toBe(true);
		});

		it("should return false if DRAFT (even if past due date)", () => {
			const pastDueDate = new Date("2025-01-01");
			const invoice = Invoice.create({
				id: "inv_test_7",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 7,
				invoiceNumber: "F001-00000007",
				issueDate: new Date("2024-12-01"),
				dueDate: pastDueDate,
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(invoice.isOverdue()).toBe(false); // Still DRAFT
		});

		it("should return false if SENT but not yet past due date", () => {
			const futureDueDate = new Date("2027-12-31"); // In the future
			const invoice = Invoice.create({
				id: "inv_test_8",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 8,
				invoiceNumber: "F001-00000008",
				issueDate: new Date("2026-01-01"),
				dueDate: futureDueDate,
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const sentInvoice = invoice.markAsSent("cdr-url", "ticket");

			expect(sentInvoice.isOverdue()).toBe(false);
		});
	});

	describe("applyPayment()", () => {
		it("should reduce balanceDue by payment amount", () => {
			const invoice = Invoice.create({
				id: "inv_test_9",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 9,
				invoiceNumber: "F001-00000009",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem], // 100.00 total
			});

			const payment = Money.fromAmount(50.0, "PEN");
			const paidInvoice = invoice.applyPayment(payment);

			expect(paidInvoice.balanceDue.toString()).toBe("50.00");
			expect(paidInvoice.status).toBe("DRAFT"); // Still not fully paid
		});

		it("should mark invoice as PAID when fully paid", () => {
			const invoice = Invoice.create({
				id: "inv_test_10",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 10,
				invoiceNumber: "F001-00000010",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem], // 100.00 total
			});

			const payment = Money.fromAmount(100.0, "PEN");
			const paidInvoice = invoice.applyPayment(payment);

			expect(paidInvoice.balanceDue.toString()).toBe("0.00");
			expect(paidInvoice.status).toBe("PAID");
		});

		it("should return new immutable instance (no mutation)", () => {
			const invoice = Invoice.create({
				id: "inv_test_11",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 11,
				invoiceNumber: "F001-00000011",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const payment = Money.fromAmount(50.0, "PEN");
			const paidInvoice = invoice.applyPayment(payment);

			// Original should be unchanged
			expect(invoice.balanceDue.toString()).toBe("100.00");
			expect(invoice.status).toBe("DRAFT");

			// New instance should have changes
			expect(paidInvoice.balanceDue.toString()).toBe("50.00");
			expect(paidInvoice.id).toBe(invoice.id); // Same ID
		});
	});

	describe("markAsSent()", () => {
		it("should update status to SENT and store SUNAT artifacts", () => {
			const invoice = Invoice.create({
				id: "inv_test_12",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 12,
				invoiceNumber: "F001-00000012",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const cdrUrl = "https://sunat.gob.pe/cdr/F001-00000012.xml";
			const ticket = "TKT-2026-000456";
			const sentInvoice = invoice.markAsSent(cdrUrl, ticket);

			expect(sentInvoice.status).toBe("SENT");
			expect(sentInvoice.sunatCdr).toBe(cdrUrl);
			expect(sentInvoice.sunatTicket).toBe(ticket);
		});

		it("should return new immutable instance", () => {
			const invoice = Invoice.create({
				id: "inv_test_13",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 13,
				invoiceNumber: "F001-00000013",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const sentInvoice = invoice.markAsSent("cdr-url", "ticket");

			// Original unchanged
			expect(invoice.status).toBe("DRAFT");
			expect(invoice.sunatCdr).toBeUndefined();

			// New instance updated
			expect(sentInvoice.status).toBe("SENT");
			expect(sentInvoice.sunatCdr).toBe("cdr-url");
		});
	});

	describe("isFullyPaid()", () => {
		it("should return true when balanceDue is zero", () => {
			const invoice = Invoice.create({
				id: "inv_test_14",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 14,
				invoiceNumber: "F001-00000014",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const paidInvoice = invoice.applyPayment(Money.fromAmount(100.0, "PEN"));

			expect(paidInvoice.isFullyPaid()).toBe(true);
		});

		it("should return false when balance remains", () => {
			const invoice = Invoice.create({
				id: "inv_test_15",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 15,
				invoiceNumber: "F001-00000015",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const partiallyPaid = invoice.applyPayment(Money.fromAmount(50.0, "PEN"));

			expect(partiallyPaid.isFullyPaid()).toBe(false);
		});
	});

	describe("getRemainingBalance()", () => {
		it("should return the current balanceDue", () => {
			const invoice = Invoice.create({
				id: "inv_test_16",
				companyId: "cmp_123",
				customerId: "cus_456",
				series: "F001",
				correlative: 16,
				invoiceNumber: "F001-00000016",
				issueDate: new Date("2026-01-15"),
				dueDate: new Date("2026-02-15"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const partiallyPaid = invoice.applyPayment(Money.fromAmount(30.0, "PEN"));
			const balance = partiallyPaid.getRemainingBalance();

			expect(balance.toString()).toBe("70.00");
		});
	});
});

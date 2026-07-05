/**
 * Bill Entity Tests
 * Unit tests for Bill domain logic
 */

import { Money } from "@drenyra/domain";
import { beforeEach, describe, expect, it } from "vitest";
import { Bill, type BillItem } from "../../domain/bill.entity";

describe("Bill Entity", () => {
	let sampleItem: BillItem;

	beforeEach(() => {
		const unitPrice = Money.fromAmount(100.0, "PEN");
		sampleItem = {
			id: "item_1",
			description: "Servicio de consultoría",
			quantity: 1,
			unitPrice,
			total: unitPrice.multiply(1),
		};
	});

	describe("Bill.create()", () => {
		it("creates a bill in DRAFT status", () => {
			const bill = Bill.create({
				id: "bill_1",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0001",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(bill.status).toBe("DRAFT");
			expect(bill.totalAmount.toString()).toBe("118.00"); // 100 + 18% IGV
			expect(bill.balanceDue.toString()).toBe("118.00");
		});

		it("calculates totals correctly for multiple items", () => {
			const unitPrice2 = Money.fromAmount(50.0, "PEN");
			const item2: BillItem = {
				id: "item_2",
				description: "Producto adicional",
				quantity: 2,
				unitPrice: unitPrice2,
				total: unitPrice2.multiply(2),
			};

			const bill = Bill.create({
				id: "bill_2",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0002",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem, item2], // 100 + 100 = 200
			});

			expect(bill.subtotal.toString()).toBe("200.00");
			expect(bill.igvAmount.toString()).toBe("36.00");
			expect(bill.totalAmount.toString()).toBe("236.00");
			expect(bill.balanceDue.toString()).toBe("236.00");
		});

		it("rounds IGV using cents pattern", () => {
			const unitPrice = Money.fromAmount(10.01, "PEN");
			const item: BillItem = {
				id: "item_round",
				description: "Item con decimales",
				quantity: 1,
				unitPrice,
				total: unitPrice.multiply(1),
			};

			const bill = Bill.create({
				id: "bill_round",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0003",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [item], // subtotal 10.01
			});

			expect(bill.subtotal.toString()).toBe("10.01");
			expect(bill.igvAmount.toString()).toBe("1.80");
			expect(bill.totalAmount.toString()).toBe("11.81");
		});
	});

	describe("canEdit()", () => {
		it("returns true for DRAFT bills", () => {
			const bill = Bill.create({
				id: "bill_edit_1",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0100",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(bill.canEdit()).toBe(true);
		});

		it("returns false after marking as SENT", () => {
			const bill = Bill.create({
				id: "bill_edit_2",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0101",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const sent = bill.markAsSent();
			expect(sent.status).toBe("SENT");
			expect(sent.canEdit()).toBe(false);
		});
	});

	describe("isOverdue()", () => {
		it("returns true if SENT and past due date", () => {
			const bill = Bill.create({
				id: "bill_overdue_1",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0200",
				issueDate: new Date("2025-01-01"),
				dueDate: new Date("2026-01-01"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			}).markAsSent();

			expect(bill.isOverdue()).toBe(true);
		});

		it("returns false if DRAFT even if past due date", () => {
			const bill = Bill.create({
				id: "bill_overdue_2",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0201",
				issueDate: new Date("2025-01-01"),
				dueDate: new Date("2026-01-01"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(bill.status).toBe("DRAFT");
			expect(bill.isOverdue()).toBe(false);
		});

		it("returns false if PAID even if past due date", () => {
			const bill = Bill.create({
				id: "bill_overdue_3",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0202",
				issueDate: new Date("2025-01-01"),
				dueDate: new Date("2026-01-01"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			}).markAsPaid();

			expect(bill.status).toBe("PAID");
			expect(bill.isOverdue()).toBe(false);
		});
	});

	describe("applyPayment()", () => {
		it("reduces balanceDue by payment amount", () => {
			const bill = Bill.create({
				id: "bill_pay_1",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0300",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem], // total 118.00
			});

			const payment = Money.fromAmount(50.0, "PEN");
			const updated = bill.applyPayment(payment);

			expect(updated.balanceDue.toString()).toBe("68.00");
			expect(updated.status).toBe("DRAFT");
		});

		it("marks as PAID when fully paid", () => {
			const bill = Bill.create({
				id: "bill_pay_2",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0301",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem], // total 118.00
			});

			const payment = Money.fromAmount(118.0, "PEN");
			const updated = bill.applyPayment(payment);

			expect(updated.balanceDue.toString()).toBe("0.00");
			expect(updated.status).toBe("PAID");
		});

		it("returns a new immutable instance (no mutation)", () => {
			const bill = Bill.create({
				id: "bill_pay_3",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0302",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const updated = bill.applyPayment(Money.fromAmount(1.0, "PEN"));

			expect(updated).not.toBe(bill);
			expect(bill.balanceDue.toString()).toBe("118.00");
			expect(updated.balanceDue.toString()).toBe("117.00");
		});

		it("throws if payment exceeds remaining balance", () => {
			const bill = Bill.create({
				id: "bill_pay_4",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0303",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(() => bill.applyPayment(Money.fromAmount(999, "PEN"))).toThrow(
				/exceeds remaining balance/i,
			);
		});

		it("throws on currency mismatch", () => {
			const bill = Bill.create({
				id: "bill_pay_5",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0304",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(() => bill.applyPayment(Money.fromAmount(1, "USD"))).toThrow(
				/different currencies/i,
			);
		});
	});

	describe("markAsPaid()", () => {
		it("sets status to PAID and balanceDue to zero", () => {
			const bill = Bill.create({
				id: "bill_paid_1",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0400",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const paid = bill.markAsPaid();
			expect(paid.status).toBe("PAID");
			expect(paid.balanceDue.toString()).toBe("0.00");
		});

		it("returns a new immutable instance (no mutation)", () => {
			const bill = Bill.create({
				id: "bill_paid_2",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0401",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			const paid = bill.markAsPaid();
			expect(paid).not.toBe(bill);
			expect(bill.status).toBe("DRAFT");
			expect(paid.status).toBe("PAID");
		});
	});

	describe("Edge cases", () => {
		it("throws if created with empty items", () => {
			expect(() =>
				Bill.create({
					id: "bill_edge_1",
					companyId: "cmp_1",
					vendorId: "ven_1",
					billNumber: "B001-0500",
					issueDate: new Date("2026-02-01"),
					dueDate: new Date("2026-02-10"),
					currency: "PEN",
					exchangeRate: 1,
					items: [],
				}),
			).toThrow(/at least one item/i);
		});

		it("throws if dueDate is before issueDate", () => {
			expect(() =>
				Bill.create({
					id: "bill_edge_2",
					companyId: "cmp_1",
					vendorId: "ven_1",
					billNumber: "B001-0501",
					issueDate: new Date("2026-02-10"),
					dueDate: new Date("2026-02-01"),
					currency: "PEN",
					exchangeRate: 1,
					items: [sampleItem],
				}),
			).toThrow(/Due date must be after issue date/i);
		});

		it("throws on negative payment amount", () => {
			const bill = Bill.create({
				id: "bill_edge_3",
				companyId: "cmp_1",
				vendorId: "ven_1",
				billNumber: "B001-0502",
				issueDate: new Date("2026-02-01"),
				dueDate: new Date("2026-02-10"),
				currency: "PEN",
				exchangeRate: 1,
				items: [sampleItem],
			});

			expect(() => bill.applyPayment(Money.fromAmount(-1, "PEN"))).toThrow(
				/negative/i,
			);
		});
	});
});

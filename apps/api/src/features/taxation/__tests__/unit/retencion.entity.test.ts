import { Money } from "@drenyra/domain/value-objects/Money";
import { describe, expect, it } from "vitest";
import { Retencion } from "../../domain/entities/retencion.entity";
import { RetentionApplied } from "../../domain/events/retention-applied.event";
import { RetentionCancelled } from "../../domain/events/retention-cancelled.event";
import { RetentionDeclared } from "../../domain/events/retention-declared.event";
import { RetentionPaid } from "../../domain/events/retention-paid.event";

describe("Retencion", () => {
	const baseAmount = Money.fromAmount(1000, "PEN");
	const appliedAt = new Date("2026-03-20T15:00:00.000Z");

	it("creates a pending retention from a bill and emits RetentionApplied", () => {
		const [retencion, event] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			appliedAt,
		});

		expect(retencion.status).toBe("PENDING");
		expect(retencion.retentionAmount.getCents()).toBe(3000);
		expect(retencion.declarationPeriod).toBe("2026-03");
		expect(retencion.sunatDueDate.toISOString()).toBe(
			"2026-04-15T00:00:00.000Z",
		);
		expect(event).toBeInstanceOf(RetentionApplied);
		expect(event.eventName).toBe("taxation.retention.applied");
		expect(event.toJSON()).toMatchObject({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmountCents: 100000,
			retentionAmountCents: 3000,
			declarationPeriod: "2026-03",
			currency: "PEN",
		});
	});

	it("rejects base amounts at or below the SUNAT threshold", () => {
		expect(() =>
			Retencion.createFromBill({
				companyId: "cmp-1",
				billId: "bill-1",
				supplierRuc: "20100070970",
				baseAmount: Money.fromAmount(700, "PEN"),
				appliedAt,
			}),
		).toThrow("Retention only applies to PEN amounts above S/ 700");
	});

	it("rejects non-PEN retentions", () => {
		expect(() =>
			Retencion.createFromBill({
				companyId: "cmp-1",
				billId: "bill-1",
				supplierRuc: "20100070970",
				baseAmount: Money.fromAmount(1000, "USD"),
				appliedAt,
			}),
		).toThrow("Retention only applies to PEN amounts");
	});

	it("declares a pending retention immutably", () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			appliedAt,
		});

		const declaredAt = new Date("2026-04-10T12:00:00.000Z");
		const [declared, event] = retencion.declare("PDT626-2026-03", declaredAt);

		expect(retencion.status).toBe("PENDING");
		expect(declared.status).toBe("DECLARED");
		expect(declared.pdtReference).toBe("PDT626-2026-03");
		expect(declared.declaredAt).toEqual(declaredAt);
		expect(event).toBeInstanceOf(RetentionDeclared);
		expect(event.toJSON()).toMatchObject({
			declarationPeriod: "2026-03",
			pdtReference: "PDT626-2026-03",
			retentionAmountCents: 3000,
		});
	});

	it("does not allow payment before declaration", () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			appliedAt,
		});

		expect(() => retencion.markPaid("tx-1")).toThrow(
			"Only declared retentions can be marked as paid",
		);
	});

	it("marks a declared retention as paid immutably", () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			appliedAt,
		});
		const [declared] = retencion.declare(
			"PDT626-2026-03",
			new Date("2026-04-10T12:00:00.000Z"),
		);
		const paidAt = new Date("2026-04-15T16:00:00.000Z");

		const [paid, event] = declared.markPaid("tx-123", paidAt);

		expect(declared.status).toBe("DECLARED");
		expect(paid.status).toBe("PAID");
		expect(paid.paidAt).toEqual(paidAt);
		expect(event).toBeInstanceOf(RetentionPaid);
		expect(event.toJSON()).toMatchObject({
			bankTransactionId: "tx-123",
			retentionAmountCents: 3000,
		});
	});

	it("allows cancellation before payment and emits RetentionCancelled", () => {
		const [retencion] = Retencion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			appliedAt,
		});
		const cancelledAt = new Date("2026-03-25T12:00:00.000Z");

		const [cancelled, event] = retencion.cancel("Factura anulada", cancelledAt);

		expect(cancelled.status).toBe("CANCELLED");
		expect(cancelled.cancelledAt).toEqual(cancelledAt);
		expect(cancelled.cancellationReason).toBe("Factura anulada");
		expect(event).toBeInstanceOf(RetentionCancelled);
		expect(event.toJSON()).toMatchObject({
			reason: "Factura anulada",
		});
	});

	it("reconstitutes a declared retention with valid persistence state", () => {
		const retencion = Retencion.reconstitute({
			id: "ret-1",
			companyId: "cmp-1",
			billId: "bill-1",
			supplierRuc: "20100070970",
			baseAmount,
			retentionAmount: Money.fromAmount(30, "PEN"),
			status: "DECLARED",
			declarationPeriod: "2026-03",
			sunatDueDate: new Date("2026-04-15T00:00:00.000Z"),
			pdtReference: "PDT626-2026-03",
			createdAt: appliedAt,
			declaredAt: new Date("2026-04-10T12:00:00.000Z"),
		});

		expect(retencion.status).toBe("DECLARED");
		expect(retencion.retentionAmount.toString()).toBe("30.00");
	});
});

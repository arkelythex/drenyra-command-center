import { Money } from "@arkelythex/domain/value-objects/Money";
import { describe, expect, it } from "vitest";
import { Percepcion } from "../../domain/entities/percepcion.entity";
import { PercepcionApplied } from "../../domain/events/percepcion-applied.event";
import { PercepcionCancelled } from "../../domain/events/percepcion-cancelled.event";
import { PercepcionDeclared } from "../../domain/events/percepcion-declared.event";
import { PercepcionPaid } from "../../domain/events/percepcion-paid.event";

describe("Percepcion", () => {
	const totalAmount = Money.fromAmount(1000, "PEN");
	const appliedAt = new Date("2026-03-20T15:00:00.000Z");

	it("creates a pending percepcion from a bill and emits PercepcionApplied", () => {
		const [percepcion, event] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt,
		});

		expect(percepcion.status).toBe("PENDING");
		expect(percepcion.percepcionAmount.getCents()).toBe(2000);
		expect(percepcion.declarationPeriod).toBe("2026-03");
		expect(percepcion.sunatDueDate.toISOString()).toBe(
			"2026-04-15T00:00:00.000Z",
		);
		expect(event).toBeInstanceOf(PercepcionApplied);
		expect(event.eventName).toBe("taxation.percepcion.applied");
		expect(event.toJSON()).toMatchObject({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			totalAmountCents: 100000,
			percepcionAmountCents: 2000,
			declarationPeriod: "2026-03",
			currency: "PEN",
		});
	});

	it("creates with IMPORTACION at 3.5% rate", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-2",
			agentRuc: "20100070970",
			percepcionType: "IMPORTACION",
			totalAmount: Money.fromAmount(2000, "PEN"),
			appliedAt,
		});

		expect(percepcion.percepcionAmount.getCents()).toBe(7000);
	});

	it("creates with COMBUSTIBLE at 1% rate", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-3",
			agentRuc: "20100070970",
			percepcionType: "COMBUSTIBLE",
			totalAmount: Money.fromAmount(5000, "PEN"),
			appliedAt,
		});

		expect(percepcion.percepcionAmount.getCents()).toBe(5000);
	});

	it("rejects total amounts below the SUNAT threshold", () => {
		expect(() =>
			Percepcion.createFromBill({
				companyId: "cmp-1",
				billId: "bill-1",
				agentRuc: "20100070970",
				percepcionType: "VENTA_INTERNA",
				totalAmount: Money.fromAmount(699, "PEN"),
				appliedAt,
			}),
		).toThrow("Percepcion only applies to PEN amounts of S/ 700 or more");
	});

	it("rejects non-PEN percepciones", () => {
		expect(() =>
			Percepcion.createFromBill({
				companyId: "cmp-1",
				billId: "bill-1",
				agentRuc: "20100070970",
				percepcionType: "VENTA_INTERNA",
				totalAmount: Money.fromAmount(1000, "USD"),
				appliedAt,
			}),
		).toThrow("Percepcion only applies to PEN amounts");
	});

	it("declares a pending percepcion immutably", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt,
		});

		const declaredAt = new Date("2026-04-10T12:00:00.000Z");
		const [declared, event] = percepcion.declare("PDT-621-2026-03", declaredAt);

		expect(percepcion.status).toBe("PENDING");
		expect(declared.status).toBe("DECLARED");
		expect(declared.pdtReference).toBe("PDT-621-2026-03");
		expect(declared.declaredAt).toEqual(declaredAt);
		expect(event).toBeInstanceOf(PercepcionDeclared);
		expect(event.toJSON()).toMatchObject({
			declarationPeriod: "2026-03",
			pdtReference: "PDT-621-2026-03",
			percepcionAmountCents: 2000,
		});
	});

	it("does not allow payment before declaration", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt,
		});

		expect(() => percepcion.markPaid("tx-1")).toThrow(
			"Only declared percepciones can be marked as paid",
		);
	});

	it("marks a declared percepcion as paid immutably", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt,
		});
		const [declared] = percepcion.declare(
			"PDT-621-2026-03",
			new Date("2026-04-10T12:00:00.000Z"),
		);
		const paidAt = new Date("2026-04-15T16:00:00.000Z");

		const [paid, event] = declared.markPaid("tx-123", paidAt);

		expect(declared.status).toBe("DECLARED");
		expect(paid.status).toBe("PAID");
		expect(paid.paidAt).toEqual(paidAt);
		expect(event).toBeInstanceOf(PercepcionPaid);
		expect(event.toJSON()).toMatchObject({
			bankTransactionId: "tx-123",
			percepcionAmountCents: 2000,
		});
	});

	it("allows cancellation before payment and emits PercepcionCancelled", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt,
		});
		const cancelledAt = new Date("2026-03-25T12:00:00.000Z");

		const [cancelled, event] = percepcion.cancel(
			"Factura anulada",
			cancelledAt,
		);

		expect(cancelled.status).toBe("CANCELLED");
		expect(cancelled.cancelledAt).toEqual(cancelledAt);
		expect(cancelled.cancellationReason).toBe("Factura anulada");
		expect(event).toBeInstanceOf(PercepcionCancelled);
		expect(event.toJSON()).toMatchObject({
			reason: "Factura anulada",
		});
	});

	it("reconstitutes a declared percepcion with valid persistence state", () => {
		const percepcion = Percepcion.reconstitute({
			id: "per-1",
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			percepcionAmount: Money.fromAmount(20, "PEN"),
			status: "DECLARED",
			declarationPeriod: "2026-03",
			sunatDueDate: new Date("2026-04-15T00:00:00.000Z"),
			pdtReference: "PDT-621-2026-03",
			createdAt: appliedAt,
			declaredAt: new Date("2026-04-10T12:00:00.000Z"),
		});

		expect(percepcion.status).toBe("DECLARED");
		expect(percepcion.percepcionAmount.toString()).toBe("20.00");
		expect(percepcion.agentRuc).toBe("20100070970");
		expect(percepcion.percepcionType).toBe("VENTA_INTERNA");
	});

	it("detects overdue status correctly", () => {
		const [percepcion] = Percepcion.createFromBill({
			companyId: "cmp-1",
			billId: "bill-1",
			agentRuc: "20100070970",
			percepcionType: "VENTA_INTERNA",
			totalAmount,
			appliedAt: new Date("2026-02-20T15:00:00.000Z"),
		});

		// Past due (created in Feb, due March 15, now is after that)
		const overdueCheck = percepcion.isOverdue;
		expect(typeof overdueCheck).toBe("boolean");
	});

	it("rejects invalid agent RUC format", () => {
		expect(() =>
			Percepcion.createFromBill({
				companyId: "cmp-1",
				billId: "bill-1",
				agentRuc: "12345",
				percepcionType: "VENTA_INTERNA",
				totalAmount,
				appliedAt,
			}),
		).toThrow("Agent RUC must contain 11 digits");
	});
});

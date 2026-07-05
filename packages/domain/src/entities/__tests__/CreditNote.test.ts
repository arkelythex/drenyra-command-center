/**
 * CreditNote Entity Tests.
 *
 * @description Tests the CreditNote domain entity covering creation,
 * validation, state transitions, and business rules.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";
import {
	CreditNote,
	type CreditNoteProps,
	type CreditNoteType,
} from "../CreditNote";

function validProps(overrides: Partial<CreditNoteProps> = {}): CreditNoteProps {
	const baseAmount = Money.fromAmount(1000, "PEN");
	const igvAmount = Money.fromAmount(180, "PEN");
	const totalAmount = baseAmount.add(igvAmount);
	const today = new Date();
	today.setHours(today.getHours() - 1);

	return {
		id: "cn_test_001",
		referenceInvoiceId: "inv_test_001",
		creditNoteType: "ANULACION",
		reason: "Anulación por error del cliente",
		series: DocumentSeries.create("FC01"),
		number: 1,
		totalAmount,
		baseAmount,
		igvAmount,
		currency: "PEN",
		status: "DRAFT",
		issueDate: today,
		createdAt: today,
		updatedAt: today,
		...overrides,
	};
}

describe("CreditNote", () => {
	describe("creation", () => {
		it("should create a credit note with valid props", () => {
			const cn = CreditNote.create(validProps());
			expect(cn).toBeInstanceOf(CreditNote);
			expect(cn.id).toBe("cn_test_001");
			expect(cn.status).toBe("DRAFT");
			expect(cn.creditNoteType).toBe("ANULACION");
		});

		it("should reject invalid series (not FC01/BC01)", () => {
			const props = validProps({ series: DocumentSeries.create("F001") });
			expect(() => CreditNote.create(props)).toThrow(
				/Serie inválida para nota de crédito/,
			);
		});

		it("should reject series BC01 as valid for boleta credit notes", () => {
			const props = validProps({ series: DocumentSeries.create("BC01") });
			const cn = CreditNote.create(props);
			expect(cn.series.isCreditNote()).toBe(true);
		});

		it("should reject mismatched total (base + IGV)", () => {
			const props = validProps({
				totalAmount: Money.fromAmount(999, "PEN"),
			});
			expect(() => CreditNote.create(props)).toThrow(
				/debe ser igual a base \+ IGV/,
			);
		});

		it("should reject amount exceeding referenced invoice total", () => {
			const baseAmount = Money.fromCents(150000, "PEN");
			const igvAmount = Money.fromCents(27000, "PEN");
			const props = validProps({
				referenceInvoiceTotal: 100000, // S/ 1,000.00 in cents
				baseAmount,
				igvAmount,
				totalAmount: baseAmount.add(igvAmount), // exceeds reference
			});
			expect(() => CreditNote.create(props)).toThrow(
				/no puede exceder el total/,
			);
		});

		it("should allow amount within referenced invoice total", () => {
			const props = validProps({
				referenceInvoiceTotal: 200000,
				baseAmount: Money.fromAmount(500, "PEN"),
				igvAmount: Money.fromAmount(90, "PEN"),
				totalAmount: Money.fromAmount(590, "PEN"),
			});
			const cn = CreditNote.create(props);
			expect(cn.totalAmount.getAmount()).toBe(590);
		});

		it("should reject future issue date", () => {
			const future = new Date();
			future.setDate(future.getDate() + 5);
			expect(() =>
				CreditNote.create(validProps({ issueDate: future })),
			).toThrow(/La fecha de emisión no puede ser futura/);
		});

		it("should reject non-positive number", () => {
			expect(() => CreditNote.create(validProps({ number: 0 }))).toThrow(
				/debe ser positivo/,
			);
		});

		it("should reject empty reason", () => {
			expect(() => CreditNote.create(validProps({ reason: "" }))).toThrow(
				/debe tener una razón/,
			);
		});

		it("should reject whitespace-only reason", () => {
			expect(() => CreditNote.create(validProps({ reason: "   " }))).toThrow(
				/debe tener una razón/,
			);
		});

		it("should freeze the instance (immutability)", () => {
			const cn = CreditNote.create(validProps());
			expect(Object.isFrozen(cn)).toBe(true);
		});
	});

	describe("fromPrimitives", () => {
		it("should reconstruct from primitive data", () => {
			const today = new Date();
			const cn = CreditNote.fromPrimitives({
				id: "cn_test_002",
				referenceInvoiceId: "inv_test_002",
				creditNoteType: "DEVOLUCION",
				reason: "Devolución de mercadería",
				series: "FC01",
				number: 2,
				totalAmount: 118000,
				baseAmount: 100000,
				igvAmount: 18000,
				currency: "PEN",
				status: "DRAFT",
				issueDate: today,
				createdAt: today,
				updatedAt: today,
			});
			expect(cn.id).toBe("cn_test_002");
			expect(cn.creditNoteType).toBe("DEVOLUCION");
			expect(cn.getFullNumber()).toBe("FC01-00000002");
		});

		it("should handle string dates", () => {
			const cn = CreditNote.fromPrimitives({
				id: "cn_test_003",
				referenceInvoiceId: "inv_test_003",
				creditNoteType: "DESCUENTO",
				reason: "Descuento comercial",
				series: "BC01",
				number: 1,
				totalAmount: 59000,
				baseAmount: 50000,
				igvAmount: 9000,
				currency: "PEN",
				status: "SENT",
				issueDate: "2026-06-01T00:00:00Z",
				createdAt: "2026-06-01T00:00:00Z",
			});
			expect(cn.status).toBe("SENT");
			expect(cn.series.isCreditNote()).toBe(true);
		});
	});

	describe("state transitions", () => {
		it("should transition DRAFT → SENT", () => {
			const cn = CreditNote.create(validProps());
			const sent = cn.markAsSent("ACEPTADO");
			expect(sent.status).toBe("SENT");
			expect(sent.sunatResponseCode).toBe("ACEPTADO");
			expect(sent.sentToSunatAt).toBeInstanceOf(Date);
			expect(sent.updatedAt).not.toBe(cn.updatedAt);
		});

		it("should reject send from non-DRAFT status", () => {
			const cn = CreditNote.create(validProps({ status: "SENT" }));
			expect(() => cn.markAsSent("OK")).toThrow(/Solo se pueden enviar/);
		});

		it("should transition SENT → ACCEPTED", () => {
			const cn = CreditNote.create(validProps({ status: "SENT" }));
			const accepted = cn.markAsAccepted();
			expect(accepted.status).toBe("ACCEPTED");
		});

		it("should reject accept from non-SENT status", () => {
			const cn = CreditNote.create(validProps({ status: "DRAFT" }));
			expect(() => cn.markAsAccepted()).toThrow(/Solo se pueden aceptar/);
		});

		it("should transition SENT → REJECTED", () => {
			const cn = CreditNote.create(validProps({ status: "SENT" }));
			const rejected = cn.markAsRejected("RUC inválido");
			expect(rejected.status).toBe("REJECTED");
			expect(rejected.reason).toBe("RUC inválido");
		});

		it("should preserve original instance after transition (immutability)", () => {
			const cn = CreditNote.create(validProps());
			cn.markAsSent("OK");
			expect(cn.status).toBe("DRAFT");
		});
	});

	describe("business queries", () => {
		it("should detect full cancellation (ANULACION)", () => {
			const cn = CreditNote.create(validProps({ creditNoteType: "ANULACION" }));
			expect(cn.isFullCancellation()).toBe(true);
		});

		it("should detect non-cancellation types", () => {
			const cn = CreditNote.create(validProps({ creditNoteType: "DESCUENTO" }));
			expect(cn.isFullCancellation()).toBe(false);
		});

		it("canBeModified should be true only in DRAFT", () => {
			const draft = CreditNote.create(validProps());
			const sent = CreditNote.create(validProps({ status: "SENT" }));
			expect(draft.canBeModified()).toBe(true);
			expect(sent.canBeModified()).toBe(false);
		});

		it("equals should compare by ID", () => {
			const a = CreditNote.create(validProps({ id: "cn_1" }));
			const b = CreditNote.create(validProps({ id: "cn_1" }));
			const c = CreditNote.create(validProps({ id: "cn_2" }));
			expect(a.equals(b)).toBe(true);
			expect(a.equals(c)).toBe(false);
			expect(a.equals(null)).toBe(false);
		});

		it("should format full number with 8-digit padding", () => {
			const cn = CreditNote.create(
				validProps({ series: DocumentSeries.create("FC01"), number: 42 }),
			);
			expect(cn.getFullNumber()).toBe("FC01-00000042");
		});
	});

	describe("serialization", () => {
		it("should produce JSON with all fields", () => {
			const cn = CreditNote.create(validProps());
			const json = cn.toJSON();
			expect(json.id).toBe("cn_test_001");
			expect(json.series).toBe("FC01");
			expect(json.creditNoteType).toBe("ANULACION");
			expect(json.status).toBe("DRAFT");
			expect(json.totalAmount).toBeDefined();
			expect(json.issueDate).toBeDefined();
		});
	});
});

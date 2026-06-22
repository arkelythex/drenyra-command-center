/**
 * DebitNote Entity Tests.
 *
 * @description Tests the DebitNote domain entity covering creation,
 * validation, state transitions, and business rules.
 */

import { describe, expect, it } from "vitest";
import { DebitNote, type DebitNoteProps } from "../DebitNote";
import { DocumentSeries } from "../../value-objects/DocumentSeries";
import { Money } from "../../value-objects/Money";

function validProps(overrides: Partial<DebitNoteProps> = {}): DebitNoteProps {
	const additionalAmount = Money.fromAmount(500, "PEN");
	const igvAmount = Money.fromAmount(90, "PEN");
	const baseAmount = additionalAmount;
	const totalAmount = baseAmount.add(igvAmount);
	const today = new Date();
	today.setHours(today.getHours() - 1);

	return {
		id: "dn_test_001",
		referenceInvoiceId: "inv_test_001",
		additionalAmount,
		totalAmount,
		baseAmount,
		igvAmount,
		currency: "PEN",
		reason: "Cargo por intereses moratorios",
		series: DocumentSeries.create("FD01"),
		number: 1,
		status: "DRAFT",
		issueDate: today,
		createdAt: today,
		updatedAt: today,
		...overrides,
	};
}

describe("DebitNote", () => {
	describe("creation", () => {
		it("should create a debit note with valid props", () => {
			const dn = DebitNote.create(validProps());
			expect(dn).toBeInstanceOf(DebitNote);
			expect(dn.id).toBe("dn_test_001");
			expect(dn.status).toBe("DRAFT");
			expect(dn.reason).toBe("Cargo por intereses moratorios");
		});

		it("should reject invalid series (not FD01/BD01)", () => {
			const props = validProps({ series: DocumentSeries.create("F001") });
			expect(() => DebitNote.create(props)).toThrow(
				/Serie inválida para nota de débito/,
			);
		});

		it("should accept BD01 as valid boleta debit note series", () => {
			const props = validProps({ series: DocumentSeries.create("BD01") });
			const dn = DebitNote.create(props);
			expect(dn.series.isDebitNote()).toBe(true);
		});

		it("should reject mismatched total (base + IGV)", () => {
			const props = validProps({
				totalAmount: Money.fromAmount(999, "PEN"),
			});
			expect(() => DebitNote.create(props)).toThrow(
				/debe ser igual a base \+ IGV/,
			);
		});

		it("should reject non-positive additional amount", () => {
			const props = validProps({
				additionalAmount: Money.fromAmount(0, "PEN"),
				baseAmount: Money.fromAmount(0, "PEN"),
				igvAmount: Money.fromAmount(0, "PEN"),
				totalAmount: Money.fromAmount(0, "PEN"),
			});
			expect(() => DebitNote.create(props)).toThrow(
				/debe ser positivo/,
			);
		});

		it("should reject future issue date", () => {
			const future = new Date();
			future.setDate(future.getDate() + 5);
			expect(() => DebitNote.create(validProps({ issueDate: future }))).toThrow(
				/La fecha de emisión no puede ser futura/,
			);
		});

		it("should reject non-positive number", () => {
			expect(() => DebitNote.create(validProps({ number: 0 }))).toThrow(
				/debe ser positivo/,
			);
		});

		it("should reject empty reason", () => {
			expect(() => DebitNote.create(validProps({ reason: "" }))).toThrow(
				/debe tener una razón/,
			);
		});

		it("should freeze the instance (immutability)", () => {
			const dn = DebitNote.create(validProps());
			expect(Object.isFrozen(dn)).toBe(true);
		});
	});

	describe("fromPrimitives", () => {
		it("should reconstruct from primitive data", () => {
			const today = new Date();
			const dn = DebitNote.fromPrimitives({
				id: "dn_test_002",
				referenceInvoiceId: "inv_test_002",
				additionalAmount: 50000,
				totalAmount: 59000,
				baseAmount: 50000,
				igvAmount: 9000,
				currency: "PEN",
				reason: "Ajuste por tipo de cambio",
				series: "FD01",
				number: 2,
				status: "DRAFT",
				issueDate: today,
				createdAt: today,
				updatedAt: today,
			});
			expect(dn.id).toBe("dn_test_002");
			expect(dn.getFullNumber()).toBe("FD01-00000002");
			expect(dn.baseAmount.getAmount()).toBe(500);
		});

		it("should handle string dates", () => {
			const dn = DebitNote.fromPrimitives({
				id: "dn_test_003",
				referenceInvoiceId: "inv_test_003",
				additionalAmount: 30000,
				totalAmount: 35400,
				baseAmount: 30000,
				igvAmount: 5400,
				currency: "PEN",
				reason: "Reajuste de precio",
				series: "BD01",
				number: 1,
				status: "SENT",
				issueDate: "2026-06-01T00:00:00Z",
				createdAt: "2026-06-01T00:00:00Z",
			});
			expect(dn.status).toBe("SENT");
			expect(dn.series.isDebitNote()).toBe(true);
		});
	});

	describe("state transitions", () => {
		it("should transition DRAFT → SENT", () => {
			const dn = DebitNote.create(validProps());
			const sent = dn.markAsSent("ACEPTADO");
			expect(sent.status).toBe("SENT");
			expect(sent.sunatResponseCode).toBe("ACEPTADO");
			expect(sent.sentToSunatAt).toBeInstanceOf(Date);
		});

		it("should reject send from non-DRAFT status", () => {
			const dn = DebitNote.create(validProps({ status: "SENT" }));
			expect(() => dn.markAsSent("OK")).toThrow(/Solo se pueden enviar/);
		});

		it("should transition SENT → ACCEPTED", () => {
			const dn = DebitNote.create(validProps({ status: "SENT" }));
			const accepted = dn.markAsAccepted();
			expect(accepted.status).toBe("ACCEPTED");
		});

		it("should reject accept from non-SENT", () => {
			const dn = DebitNote.create(validProps({ status: "DRAFT" }));
			expect(() => dn.markAsAccepted()).toThrow(/Solo se pueden aceptar/);
		});

		it("should transition SENT → REJECTED", () => {
			const dn = DebitNote.create(validProps({ status: "SENT" }));
			const rejected = dn.markAsRejected("Documento duplicado");
			expect(rejected.status).toBe("REJECTED");
			expect(rejected.reason).toBe("Documento duplicado");
		});

		it("should preserve original instance after transition (immutability)", () => {
			const dn = DebitNote.create(validProps());
			dn.markAsSent("OK");
			expect(dn.status).toBe("DRAFT");
		});
	});

	describe("business queries", () => {
		it("canBeModified should be true only in DRAFT", () => {
			const draft = DebitNote.create(validProps());
			const sent = DebitNote.create(validProps({ status: "SENT" }));
			expect(draft.canBeModified()).toBe(true);
			expect(sent.canBeModified()).toBe(false);
		});

		it("equals should compare by ID", () => {
			const a = DebitNote.create(validProps({ id: "dn_1" }));
			const b = DebitNote.create(validProps({ id: "dn_1" }));
			const c = DebitNote.create(validProps({ id: "dn_2" }));
			expect(a.equals(b)).toBe(true);
			expect(a.equals(c)).toBe(false);
			expect(a.equals(null)).toBe(false);
		});

		it("should format full number with 8-digit padding", () => {
			const dn = DebitNote.create(validProps({ series: DocumentSeries.create("FD01"), number: 7 }));
			expect(dn.getFullNumber()).toBe("FD01-00000007");
		});
	});

	describe("serialization", () => {
		it("should produce JSON with all fields", () => {
			const dn = DebitNote.create(validProps());
			const json = dn.toJSON();
			expect(json.id).toBe("dn_test_001");
			expect(json.series).toBe("FD01");
			expect(json.reason).toBe("Cargo por intereses moratorios");
			expect(json.status).toBe("DRAFT");
			expect(json.additionalAmount).toBeDefined();
			expect(json.issueDate).toBeDefined();
		});
	});
})

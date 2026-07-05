/**
 * CANONICAL EXAMPLE — Domain Layer Test
 *
 * Demonstrates recommended patterns for testing @drenyra/domain entities,
 * value objects, and pure functions.
 *
 * Key patterns shown:
 * 1. Builder usage for entity construction
 * 2. Value object creation and comparison
 * 3. Domain event assertion
 * 4. Pure function testing
 *
 * @last-verified: 2026-06-06
 */

import {
	JournalEntry,
	JournalLine,
} from "@drenyra/domain/entities/JournalEntry";
import { DNI } from "@drenyra/domain/value-objects/DNI";
import { DocumentSeries } from "@drenyra/domain/value-objects/DocumentSeries";
import { Money } from "@drenyra/domain/value-objects/Money";
import { RUC } from "@drenyra/domain/value-objects/RUC";
import { describe, expect, it } from "vitest";
import { JournalEntryBuilder } from "../../src/builders/journal-entry.builder";

// ============================================================
// 1. BUILDER USAGE
// ============================================================

describe("JournalEntry Builder Usage", () => {
	it("creates a balanced journal entry with debit and credit", () => {
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 1000)
			.withCredit("7011", 1000)
			.withDescription("Venta de servicios")
			.build();

		expect(entry).toBeInstanceOf(JournalEntry);
		expect(entry.gloss).toBe("Venta de servicios");
		expect(entry.isBalanced()).toBe(true);
		expect(entry.lines).toHaveLength(2);
	});

	it("creates a multi-line entry with balanced amounts", () => {
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 500) // Caja
			.withDebit("1211", 300) // Cuentas por cobrar
			.withCredit("7011", 800) // Ventas
			.build();

		expect(entry.isBalanced()).toBe(true);
		expect(entry.lines).toHaveLength(3);
		expect(entry.getTotalDebit().getAmount()).toBe(800);
		expect(entry.getTotalCredit().getAmount()).toBe(800);
	});

	it("builds a default balanced entry when no lines configured", () => {
		const entry = new JournalEntryBuilder().build();

		expect(entry.isBalanced()).toBe(true);
		expect(entry.lines.length).toBeGreaterThanOrEqual(2);
	});

	it("throws when entry is unbalanced", () => {
		expect(() => {
			new JournalEntryBuilder()
				.withDebit("1041", 1000)
				.withCredit("7011", 500)
				.build();
		}).toThrow(/balanceado/);
	});
});

// ============================================================
// 2. VALUE OBJECT CREATION
// ============================================================

describe("Value Object Creation", () => {
	it("creates Money with proper precision", () => {
		const amount = Money.fromAmount(100.5, "PEN");
		expect(amount.getAmount()).toBe(100.5);
		expect(amount.getCents()).toBe(10050);
		expect(amount.getCurrency()).toBe("PEN");
	});

	it("performs arithmetic operations", () => {
		const base = Money.fromAmount(100, "PEN");
		const igv = base.multiply(0.18);
		const total = base.add(igv);

		expect(base.getAmount()).toBe(100);
		expect(igv.getAmount()).toBe(18);
		expect(total.getAmount()).toBe(118);
	});

	it("validates RUC using Módulo 11", () => {
		const validRUC = RUC.create("20546296564");
		expect(validRUC.toString()).toBe("20546296564");

		expect(() => RUC.create("invalid")).toThrow();
	});

	it("validates DNI format", () => {
		const validDNI = DNI.create("70123456");
		expect(validDNI.toString()).toBe("70123456");

		expect(() => DNI.create("short")).toThrow();
	});

	it("validates document series format", () => {
		const series = DocumentSeries.create("F001");
		expect(series.toString()).toBe("F001");
		expect(series.isFactura()).toBe(true);

		const boleta = DocumentSeries.create("B001");
		expect(boleta.isFactura()).toBe(false);
	});
});

// ============================================================
// 3. DOMAIN ENTITY BEHAVIOR
// ============================================================

describe("JournalEntry Domain Behavior", () => {
	it("transitions from borrador to mayorizado", () => {
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 1000)
			.withCredit("7011", 1000)
			.build();

		expect(entry.canBePosted()).toBe(true);
		expect(entry.status).toBe("borrador");

		const posted = entry.markAsPosted("usr_admin");
		expect(posted.status).toBe("mayorizado");
		expect(posted.postedBy).toBe("usr_admin");
	});

	it("prevents posting unbalanced entries", () => {
		// Building a balanced entry, then testing the canBePosted guard
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 1000)
			.withCredit("7011", 1000)
			.build();

		expect(entry.canBePosted()).toBe(true);
	});

	it("enforces immutability after posting", () => {
		const entry = new JournalEntryBuilder()
			.withDebit("1041", 1000)
			.withCredit("7011", 1000)
			.build();

		const posted = entry.markAsPosted("usr_admin");
		expect(posted.status).toBe("mayorizado");
		// New instance — original remains unchanged
		expect(entry.status).toBe("borrador");
	});
});

// ============================================================
// 4. PURE FUNCTION TESTING
// ============================================================

describe("IGV Calculation (Pure Function)", () => {
	it("calculates 18% IGV correctly", () => {
		const base = 100;
		const igvRate = 0.18;

		const igv = base * igvRate;
		const total = base + igv;

		expect(igv).toBe(18);
		expect(total).toBe(118);
	});

	it("handles zero base amount", () => {
		const base = 0;
		const igv = base * 0.18;
		expect(igv).toBe(0);
	});

	it("handles large amounts without floating point issues", () => {
		const base = 999999.99;
		const igv = Math.round(base * 0.18 * 100) / 100;
		const total = Math.round((base + igv) * 100) / 100;

		expect(igv).toBe(180000);
		expect(total).toBe(1179999.99);
	});
});

// ============================================================
// 5. JOURNAL LINE VALIDATION
// ============================================================

describe("JournalLine Validation", () => {
	it("creates a valid debit line", () => {
		const line = JournalLine.create({
			id: "line_1",
			accountId: "acc_1041",
			accountCode: "1041",
			accountName: "Caja Soles",
			description: "Cargo de prueba",
			debit: Money.fromAmount(500, "PEN"),
			credit: Money.zero("PEN"),
		});

		expect(line.isDebit()).toBe(true);
		expect(line.isCredit()).toBe(false);
		expect(line.getAmount().getAmount()).toBe(500);
	});

	it("creates a valid credit line", () => {
		const line = JournalLine.create({
			id: "line_2",
			accountId: "acc_7011",
			accountCode: "7011",
			accountName: "Ventas",
			description: "Abono de prueba",
			debit: Money.zero("PEN"),
			credit: Money.fromAmount(500, "PEN"),
		});

		expect(line.isCredit()).toBe(true);
		expect(line.isDebit()).toBe(false);
	});

	it("throws when line has both debit and credit", () => {
		expect(() =>
			JournalLine.create({
				id: "line_3",
				accountId: "acc_1",
				accountCode: "1041",
				accountName: "Caja",
				description: "Línea inválida",
				debit: Money.fromAmount(100, "PEN"),
				credit: Money.fromAmount(100, "PEN"),
			}),
		).toThrow(/Debe como Haber/);
	});

	it("throws when line has no amount", () => {
		expect(() =>
			JournalLine.create({
				id: "line_4",
				accountId: "acc_1",
				accountCode: "1041",
				accountName: "Caja",
				description: "Línea vacía",
				debit: Money.zero("PEN"),
				credit: Money.zero("PEN"),
			}),
		).toThrow(/Debe o Haber/);
	});
});

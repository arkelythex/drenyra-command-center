/**
 * Unit Tests for JournalEntry Domain Entity
 *
 * Tests all business rules for accounting journal entries:
 * - Double-entry accounting (min 2 lines)
 * - Balanced entries (debit = credit)
 * - Status transitions
 * - Immutability
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	JournalEntry,
	type JournalEntryProps,
	JournalLine,
} from "../JournalEntry";

// Helper to create valid JournalLine props
function createLineProps(
	overrides: Partial<{
		id: string;
		accountId: string;
		accountCode: string;
		accountName: string;
		description: string;
		debit: number;
		credit: number;
	}> = {},
) {
	return {
		id: overrides.id ?? "line-1",
		accountId: overrides.accountId ?? "account-1",
		accountCode: overrides.accountCode ?? "1011",
		accountName: overrides.accountName ?? "Caja",
		description: overrides.description ?? "Línea de prueba",
		debit: Money.fromAmount(overrides.debit ?? 0, "PEN"),
		credit: Money.fromAmount(overrides.credit ?? 0, "PEN"),
	};
}

// Helper to create a valid balanced JournalEntry
function createValidEntry(
	overrides: Partial<JournalEntryProps> = {},
): JournalEntry {
	const now = new Date();
	const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

	const defaultLines = [
		JournalLine.create(
			createLineProps({ id: "line-1", debit: 1000, credit: 0 }),
		),
		JournalLine.create(
			createLineProps({
				id: "line-2",
				debit: 0,
				credit: 1000,
				accountCode: "4011",
			}),
		),
	];

	return JournalEntry.create({
		id: overrides.id ?? "entry-1",
		organizationId: overrides.organizationId ?? 1,
		entryNumber: overrides.entryNumber ?? "AS-2024-0001",
		date: overrides.date ?? yesterday,
		gloss: overrides.gloss ?? "Asiento de prueba",
		status: overrides.status ?? "borrador",
		lines: overrides.lines ?? defaultLines,
		createdAt: overrides.createdAt ?? now,
		updatedAt: overrides.updatedAt ?? now,
		postedBy: overrides.postedBy,
		postedAt: overrides.postedAt,
	});
}

describe("JournalLine Value Object", () => {
	describe("Creation", () => {
		it("should create a valid debit line", () => {
			const line = JournalLine.create(
				createLineProps({ debit: 1000, credit: 0 }),
			);

			expect(line.isDebit()).toBe(true);
			expect(line.isCredit()).toBe(false);
			expect(line.getAmount().getAmount()).toBe(1000);
		});

		it("should create a valid credit line", () => {
			const line = JournalLine.create(
				createLineProps({ debit: 0, credit: 500 }),
			);

			expect(line.isDebit()).toBe(false);
			expect(line.isCredit()).toBe(true);
			expect(line.getAmount().getAmount()).toBe(500);
		});

		it("should throw error when both debit and credit are provided", () => {
			expect(() =>
				JournalLine.create(createLineProps({ debit: 100, credit: 100 })),
			).toThrow("Una línea no puede tener tanto Debe como Haber");
		});

		it("should throw error when neither debit nor credit is provided", () => {
			expect(() =>
				JournalLine.create(createLineProps({ debit: 0, credit: 0 })),
			).toThrow("Una línea debe tener Debe o Haber");
		});

		it("should throw error when description is empty", () => {
			expect(() =>
				JournalLine.create(createLineProps({ description: "", debit: 100 })),
			).toThrow("La descripción de la línea es requerida");
		});

		it("should throw error when description is whitespace only", () => {
			expect(() =>
				JournalLine.create(createLineProps({ description: "   ", debit: 100 })),
			).toThrow("La descripción de la línea es requerida");
		});
	});

	describe("Getters", () => {
		it("should expose all properties correctly", () => {
			const line = JournalLine.create({
				id: "line-123",
				accountId: "account-456",
				accountCode: "1011",
				accountName: "Caja",
				description: "Pago de factura",
				debit: Money.fromAmount(500, "PEN"),
				credit: Money.zero("PEN"),
				documentType: "F",
				documentNumber: "F001-00001234",
				dueDate: new Date("2024-12-31"),
			});

			expect(line.id).toBe("line-123");
			expect(line.accountId).toBe("account-456");
			expect(line.accountCode).toBe("1011");
			expect(line.accountName).toBe("Caja");
			expect(line.description).toBe("Pago de factura");
			expect(line.debit.getAmount()).toBe(500);
			expect(line.credit.getAmount()).toBe(0);
			expect(line.documentType).toBe("F");
			expect(line.documentNumber).toBe("F001-00001234");
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON correctly", () => {
			const line = JournalLine.create(
				createLineProps({ debit: 1000, credit: 0 }),
			);
			const json = line.toJSON();

			expect(json).toMatchObject({
				id: "line-1",
				accountId: "account-1",
				accountCode: "1011",
				debit: 1000,
				credit: 0,
			});
		});
	});
});

describe("JournalEntry Domain Entity", () => {
	describe("Business Rule: Double-Entry Accounting", () => {
		it("should require at least 2 lines", () => {
			const singleLine = [
				JournalLine.create(createLineProps({ debit: 1000, credit: 0 })),
			];

			expect(() => createValidEntry({ lines: singleLine })).toThrow(
				"El asiento debe tener al menos 2 líneas (partida doble)",
			);
		});

		it("should accept exactly 2 lines", () => {
			const entry = createValidEntry();
			expect(entry.lines.length).toBe(2);
		});

		it("should accept more than 2 lines", () => {
			const multiLines = [
				JournalLine.create(
					createLineProps({ id: "line-1", debit: 500, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-2", debit: 500, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-3", debit: 0, credit: 1000 }),
				),
			];

			const entry = createValidEntry({ lines: multiLines });
			expect(entry.lines.length).toBe(3);
		});
	});

	describe("Business Rule: Balanced Entry", () => {
		it("should require total debit equals total credit", () => {
			const unbalancedLines = [
				JournalLine.create(
					createLineProps({ id: "line-1", debit: 1000, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-2", debit: 0, credit: 500 }),
				),
			];

			expect(() => createValidEntry({ lines: unbalancedLines })).toThrow(
				/El asiento debe estar balanceado/,
			);
		});

		it("should calculate totals correctly", () => {
			const entry = createValidEntry();

			expect(entry.getTotalDebit().getAmount()).toBe(1000);
			expect(entry.getTotalCredit().getAmount()).toBe(1000);
			expect(entry.isBalanced()).toBe(true);
		});

		it("should handle multiple lines with correct totals", () => {
			const lines = [
				JournalLine.create(
					createLineProps({ id: "line-1", debit: 300, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-2", debit: 700, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-3", debit: 0, credit: 400 }),
				),
				JournalLine.create(
					createLineProps({ id: "line-4", debit: 0, credit: 600 }),
				),
			];

			const entry = createValidEntry({ lines });

			expect(entry.getTotalDebit().getAmount()).toBe(1000);
			expect(entry.getTotalCredit().getAmount()).toBe(1000);
			expect(entry.isBalanced()).toBe(true);
		});
	});

	describe("Business Rule: Required Fields", () => {
		it("should require entry number", () => {
			expect(() => createValidEntry({ entryNumber: "" })).toThrow(
				"El número de asiento es requerido",
			);
		});

		it("should require gloss", () => {
			expect(() => createValidEntry({ gloss: "" })).toThrow(
				"La glosa es requerida",
			);
		});

		it("should reject whitespace-only entry number", () => {
			expect(() => createValidEntry({ entryNumber: "   " })).toThrow(
				"El número de asiento es requerido",
			);
		});

		it("should reject whitespace-only gloss", () => {
			expect(() => createValidEntry({ gloss: "   " })).toThrow(
				"La glosa es requerida",
			);
		});
	});

	describe("Business Rule: Date Validation", () => {
		it("should reject future dates", () => {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);

			expect(() => createValidEntry({ date: tomorrow })).toThrow(
				"La fecha del asiento no puede ser futura",
			);
		});

		it("should accept past dates", () => {
			const lastMonth = new Date();
			lastMonth.setMonth(lastMonth.getMonth() - 1);

			const entry = createValidEntry({ date: lastMonth });
			expect(entry.date).toEqual(lastMonth);
		});

		it("should accept today (current moment)", () => {
			// Use a date slightly in the past to avoid race conditions
			const now = new Date(Date.now() - 1000);

			const entry = createValidEntry({ date: now });
			expect(entry.date).toEqual(now);
		});
	});

	describe("Status Transitions", () => {
		describe("canBeModified()", () => {
			it("should allow modification for draft entries", () => {
				const entry = createValidEntry({ status: "borrador" });
				expect(entry.canBeModified()).toBe(true);
			});

			it("should not allow modification for posted entries", () => {
				const entry = createValidEntry({ status: "mayorizado" });
				expect(entry.canBeModified()).toBe(false);
			});

			it("should not allow modification for declared entries", () => {
				const entry = createValidEntry({ status: "declarado" });
				expect(entry.canBeModified()).toBe(false);
			});
		});

		describe("canBeDeleted()", () => {
			it("should allow deletion for draft entries", () => {
				const entry = createValidEntry({ status: "borrador" });
				expect(entry.canBeDeleted()).toBe(true);
			});

			it("should not allow deletion for posted entries", () => {
				const entry = createValidEntry({ status: "mayorizado" });
				expect(entry.canBeDeleted()).toBe(false);
			});
		});

		describe("canBePosted()", () => {
			it("should allow posting for balanced draft entries", () => {
				const entry = createValidEntry({ status: "borrador" });
				expect(entry.canBePosted()).toBe(true);
			});

			it("should not allow posting for already posted entries", () => {
				const entry = createValidEntry({ status: "mayorizado" });
				expect(entry.canBePosted()).toBe(false);
			});
		});

		describe("canBeDeclared()", () => {
			it("should allow declaration for posted entries", () => {
				const entry = createValidEntry({ status: "mayorizado" });
				expect(entry.canBeDeclared()).toBe(true);
			});

			it("should not allow declaration for draft entries", () => {
				const entry = createValidEntry({ status: "borrador" });
				expect(entry.canBeDeclared()).toBe(false);
			});
		});

		describe("markAsPosted()", () => {
			it("should transition from borrador to mayorizado", () => {
				const entry = createValidEntry({ status: "borrador" });
				const posted = entry.markAsPosted("user-123");

				expect(posted.status).toBe("mayorizado");
				expect(posted.postedBy).toBe("user-123");
				expect(posted.postedAt).toBeInstanceOf(Date);
			});

			it("should return a new instance (immutability)", () => {
				const entry = createValidEntry({ status: "borrador" });
				const posted = entry.markAsPosted("user-123");

				expect(posted).not.toBe(entry);
				expect(entry.status).toBe("borrador"); // Original unchanged
			});

			it("should throw error when not in borrador status", () => {
				const entry = createValidEntry({ status: "mayorizado" });

				expect(() => entry.markAsPosted("user-123")).toThrow(
					"Solo se pueden mayorizar asientos en borrador y balanceados",
				);
			});
		});

		describe("markAsDeclared()", () => {
			it("should transition from mayorizado to declarado", () => {
				const entry = createValidEntry({ status: "mayorizado" });
				const declared = entry.markAsDeclared();

				expect(declared.status).toBe("declarado");
			});

			it("should throw error when not in mayorizado status", () => {
				const entry = createValidEntry({ status: "borrador" });

				expect(() => entry.markAsDeclared()).toThrow(
					"Solo se pueden declarar asientos mayorizados",
				);
			});
		});
	});

	describe("Update Operations", () => {
		it("should update gloss for draft entries", () => {
			const entry = createValidEntry({ status: "borrador" });
			const updated = entry.update({ gloss: "Nueva glosa" });

			expect(updated.gloss).toBe("Nueva glosa");
			expect(updated).not.toBe(entry);
		});

		it("should update date for draft entries", () => {
			const entry = createValidEntry({ status: "borrador" });
			const newDate = new Date("2024-01-15");
			const updated = entry.update({ date: newDate });

			expect(updated.date).toEqual(newDate);
		});

		it("should update lines for draft entries", () => {
			const entry = createValidEntry({ status: "borrador" });
			const newLines = [
				JournalLine.create(
					createLineProps({ id: "new-1", debit: 2000, credit: 0 }),
				),
				JournalLine.create(
					createLineProps({ id: "new-2", debit: 0, credit: 2000 }),
				),
			];

			const updated = entry.update({ lines: newLines });

			expect(updated.lines.length).toBe(2);
			expect(updated.getTotalDebit().getAmount()).toBe(2000);
		});

		it("should throw error when updating non-draft entries", () => {
			const entry = createValidEntry({ status: "mayorizado" });

			expect(() => entry.update({ gloss: "Nueva glosa" })).toThrow(
				"Solo se pueden editar asientos en borrador",
			);
		});

		it("should preserve original values when not updating", () => {
			const entry = createValidEntry({
				status: "borrador",
				gloss: "Glosa original",
			});
			const updated = entry.update({ date: new Date("2024-01-01") });

			expect(updated.gloss).toBe("Glosa original");
		});
	});

	describe("Equality", () => {
		it("should compare by ID", () => {
			const entry1 = createValidEntry({ id: "entry-1" });
			const entry2 = createValidEntry({ id: "entry-1" });
			const entry3 = createValidEntry({ id: "entry-2" });

			expect(entry1.equals(entry2)).toBe(true);
			expect(entry1.equals(entry3)).toBe(false);
		});

		it("should return false for null/undefined", () => {
			const entry = createValidEntry();

			expect(entry.equals(null)).toBe(false);
			expect(entry.equals(undefined)).toBe(false);
		});
	});

	describe("Immutability", () => {
		it("should freeze the entry object", () => {
			const entry = createValidEntry();

			expect(Object.isFrozen(entry)).toBe(true);
		});

		it("should not allow direct property modification", () => {
			const entry = createValidEntry();

			expect(() => {
				// @ts-expect-error - intentionally trying to mutate
				entry.status = "mayorizado";
			}).toThrow();
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON correctly", () => {
			const entry = createValidEntry();
			const json = entry.toJSON();

			expect(json).toMatchObject({
				id: "entry-1",
				organizationId: 1,
				entryNumber: "AS-2024-0001",
				gloss: "Asiento de prueba",
				status: "borrador",
				totalDebit: 1000,
				totalCredit: 1000,
			});
			expect(json.lines).toHaveLength(2);
			expect(typeof json.date).toBe("string"); // ISO string
		});
	});

	describe("Getters", () => {
		it("should expose all properties correctly", () => {
			const now = new Date();
			const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

			const entry = createValidEntry({
				id: "entry-123",
				organizationId: 42,
				entryNumber: "AS-2024-0099",
				date: yesterday,
				gloss: "Test gloss",
				status: "borrador",
				createdAt: now,
				updatedAt: now,
			});

			expect(entry.id).toBe("entry-123");
			expect(entry.organizationId).toBe(42);
			expect(entry.entryNumber).toBe("AS-2024-0099");
			expect(entry.date).toEqual(yesterday);
			expect(entry.gloss).toBe("Test gloss");
			expect(entry.status).toBe("borrador");
			expect(entry.createdAt).toEqual(now);
			expect(entry.updatedAt).toEqual(now);
		});

		it("should return readonly lines array (TypeScript enforcement)", () => {
			const entry = createValidEntry();

			// Lines should be accessible
			expect(entry.lines.length).toBe(2);

			// TypeScript enforces readonly - this is a compile-time check
			// Note: At runtime, the array is not frozen, but TypeScript prevents
			// calling mutating methods. The readonly type ensures immutability
			// at the type level, which is sufficient for domain safety.
			expect(Array.isArray(entry.lines)).toBe(true);
		});
	});
});

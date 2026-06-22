/**
 * BankAccount Entity Tests
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	BankAccount,
	type BankAccountType,
	type Currency,
} from "../BankAccount";

describe("BankAccount Entity", () => {
	const createValidAccount = (
		overrides: Partial<{
			bankName: string;
			accountNumber: string;
			accountType: BankAccountType;
			currency: Currency;
			initialBalance: number;
			cci: string;
			swiftCode: string;
		}> = {},
	): BankAccount => {
		return BankAccount.createNew({
			organizationId: 1,
			bankName: overrides.bankName ?? "BCP",
			accountNumber: overrides.accountNumber ?? "193-12345678-0-12",
			accountType: overrides.accountType ?? "CORRIENTE",
			currency: overrides.currency ?? "PEN",
			initialBalance: overrides.initialBalance ?? 1000,
			cci: overrides.cci,
			swiftCode: overrides.swiftCode,
		});
	};

	describe("Creation", () => {
		it("should create a bank account with valid data", () => {
			const account = createValidAccount();

			expect(account.bankName).toBe("BCP");
			expect(account.accountNumber).toBe("193-12345678-0-12");
			expect(account.accountType).toBe("CORRIENTE");
			expect(account.currency).toBe("PEN");
			expect(account.currentBalance.getAmount()).toBe(1000);
			expect(account.isActive).toBe(true);
		});

		it("should default to zero balance when not specified", () => {
			const account = BankAccount.createNew({
				organizationId: 1,
				bankName: "BBVA",
				accountNumber: "0011-1234567890",
				accountType: "AHORROS",
				currency: "USD",
			});

			expect(account.currentBalance.getAmount()).toBe(0);
			expect(account.initialBalance.getAmount()).toBe(0);
		});

		it("should throw error if bank name is empty", () => {
			expect(() => createValidAccount({ bankName: "" })).toThrow(
				"El nombre del banco es requerido",
			);
		});

		it("should throw error if account number is empty", () => {
			expect(() => createValidAccount({ accountNumber: "   " })).toThrow(
				"El número de cuenta es requerido",
			);
		});

		it("should validate CCI format (20 digits)", () => {
			// Valid CCI
			const account = createValidAccount({ cci: "00219300123456780012" });
			expect(account.cci).toBe("00219300123456780012");

			// Invalid CCI - too short
			expect(() => createValidAccount({ cci: "1234567890" })).toThrow(
				"El CCI debe tener 20 dígitos",
			);

			// Invalid CCI - has letters
			expect(() => createValidAccount({ cci: "0021930012345678001A" })).toThrow(
				"El CCI debe tener 20 dígitos",
			);
		});

		it("should validate SWIFT code format", () => {
			// Valid 8-char SWIFT
			const account1 = createValidAccount({ swiftCode: "BCPLPEPL" });
			expect(account1.swiftCode).toBe("BCPLPEPL");

			// Valid 11-char SWIFT
			const account2 = createValidAccount({ swiftCode: "BCPLPEPLXXX" });
			expect(account2.swiftCode).toBe("BCPLPEPLXXX");

			// Invalid SWIFT
			expect(() => createValidAccount({ swiftCode: "INVALID" })).toThrow(
				"El código SWIFT tiene un formato inválido",
			);
		});

		it("should enforce PEN currency for DETRACCIONES accounts", () => {
			const pen = createValidAccount({
				accountType: "DETRACCIONES",
				currency: "PEN",
			});
			expect(pen.accountType).toBe("DETRACCIONES");

			expect(() =>
				createValidAccount({
					accountType: "DETRACCIONES",
					currency: "USD",
				}),
			).toThrow("Las cuentas de detracciones deben ser en Soles (PEN)");
		});
	});

	describe("Deposit", () => {
		it("should increase balance on deposit", () => {
			const account = createValidAccount({ initialBalance: 1000 });
			const deposit = Money.fromAmount(500, "PEN");

			const updated = account.deposit(deposit);

			expect(updated.currentBalance.getAmount()).toBe(1500);
			expect(updated.initialBalance.getAmount()).toBe(1000); // Initial unchanged
		});

		it("should reject non-positive deposit", () => {
			const account = createValidAccount();
			const zero = Money.zero("PEN");

			expect(() => account.deposit(zero)).toThrow(
				"El monto del depósito debe ser positivo",
			);
		});

		it("should reject deposit in wrong currency", () => {
			const account = createValidAccount({ currency: "PEN" });
			const usd = Money.fromAmount(100, "USD");

			expect(() => account.deposit(usd)).toThrow("El depósito debe ser en PEN");
		});
	});

	describe("Withdrawal", () => {
		it("should decrease balance on withdrawal", () => {
			const account = createValidAccount({ initialBalance: 1000 });
			const withdrawal = Money.fromAmount(300, "PEN");

			const updated = account.withdraw(withdrawal);

			expect(updated.currentBalance.getAmount()).toBe(700);
		});

		it("should reject withdrawal exceeding balance", () => {
			const account = createValidAccount({ initialBalance: 500 });
			const withdrawal = Money.fromAmount(600, "PEN");

			expect(() => account.withdraw(withdrawal)).toThrow(
				"Saldo insuficiente para realizar el retiro",
			);
		});

		it("should reject non-positive withdrawal", () => {
			const account = createValidAccount({ initialBalance: 1000 });
			const zero = Money.zero("PEN");

			expect(() => account.withdraw(zero)).toThrow(
				"El monto del retiro debe ser positivo",
			);
		});

		it("should reject withdrawal in wrong currency", () => {
			const account = createValidAccount({
				currency: "PEN",
				initialBalance: 1000,
			});
			const usd = Money.fromAmount(100, "USD");

			expect(() => account.withdraw(usd)).toThrow("El retiro debe ser en PEN");
		});
	});

	describe("Status", () => {
		it("should deactivate an active account", () => {
			const account = createValidAccount();
			expect(account.isActive).toBe(true);

			const deactivated = account.deactivate();
			expect(deactivated.isActive).toBe(false);
		});

		it("should throw when deactivating an already inactive account", () => {
			const account = createValidAccount();
			const inactive = account.deactivate();

			expect(() => inactive.deactivate()).toThrow("La cuenta ya está inactiva");
		});

		it("should reactivate an inactive account", () => {
			const account = createValidAccount();
			const inactive = account.deactivate();
			const reactivated = inactive.reactivate();

			expect(reactivated.isActive).toBe(true);
		});

		it("should throw when reactivating an already active account", () => {
			const account = createValidAccount();

			expect(() => account.reactivate()).toThrow("La cuenta ya está activa");
		});
	});

	describe("Update", () => {
		it("should update account details", () => {
			const account = createValidAccount();

			const updated = account.update({
				bankName: "Interbank",
				notes: "Cuenta principal",
			});

			expect(updated.bankName).toBe("Interbank");
			expect(updated.notes).toBe("Cuenta principal");
			expect(updated.accountNumber).toBe(account.accountNumber); // Unchanged
		});

		it("should remove accountingAccountId when set to null", () => {
			const account = BankAccount.createNew({
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "123-456",
				accountType: "CORRIENTE",
				currency: "PEN",
				accountingAccountId: "1011",
			});

			expect(account.accountingAccountId).toBe("1011");

			const updated = account.update({ accountingAccountId: null });
			expect(updated.accountingAccountId).toBeUndefined();
		});
	});

	describe("Utility Methods", () => {
		it("should identify detracciones account", () => {
			const normal = createValidAccount({ accountType: "CORRIENTE" });
			const detracciones = createValidAccount({ accountType: "DETRACCIONES" });

			expect(normal.isDetracciones()).toBe(false);
			expect(detracciones.isDetracciones()).toBe(true);
		});

		it("should serialize to JSON", () => {
			const account = createValidAccount({
				bankName: "BCP",
				initialBalance: 500,
			});

			const json = account.toJSON();

			expect(json.bankName).toBe("BCP");
			expect(json.currentBalance).toEqual({
				amount: 500,
				cents: 50000,
				currency: "PEN",
			});
			expect(typeof json.createdAt).toBe("string");
		});

		it("should check equality by ID", () => {
			const account1 = BankAccount.create({
				id: 1,
				organizationId: 1,
				bankName: "BCP",
				accountNumber: "123",
				accountType: "CORRIENTE",
				currency: "PEN",
				initialBalance: Money.fromAmount(0, "PEN"),
				currentBalance: Money.fromAmount(0, "PEN"),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			const account2 = BankAccount.create({
				id: 1,
				organizationId: 1,
				bankName: "Different Name",
				accountNumber: "456",
				accountType: "AHORROS",
				currency: "PEN",
				initialBalance: Money.fromAmount(0, "PEN"),
				currentBalance: Money.fromAmount(0, "PEN"),
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			});

			expect(account1.equals(account2)).toBe(true); // Same ID
			expect(account1.equals(null)).toBe(false);
		});
	});
});

/**
 * Account Entity Unit Tests
 *
 * Tests for the Account domain entity following PCGE (Plan Contable General Empresarial)
 * business rules for Peruvian accounting.
 */

import { describe, expect, it } from "vitest";
import { Money } from "../../value-objects/Money";
import {
	ACCOUNT_LEVEL_NAMES,
	ACCOUNT_TYPE_CLASSES,
	Account,
	type AccountLevel,
	type AccountProps,
	type AccountType,
	type Currency,
} from "../Account";

// Test helper to create valid account props
function createValidAccountProps(
	overrides: Partial<AccountProps> = {},
): AccountProps {
	return {
		id: "acc-123",
		organizationId: 1,
		code: "10",
		name: "Efectivo y Equivalentes de Efectivo",
		description: "Cuenta principal de efectivo",
		level: "1" as AccountLevel,
		type: "Activo" as AccountType,
		parentId: undefined,
		isGroup: true,
		isActive: true,
		isSystem: true,
		currency: "PEN" as Currency,
		destination: undefined,
		balance: Money.fromAmount(0, "PEN"),
		balanceUSD: Money.fromAmount(0, "USD"),
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-01-01"),
		...overrides,
	};
}

describe("Account Entity", () => {
	describe("Creation and Validation", () => {
		it("should create a valid account", () => {
			const props = createValidAccountProps();
			const account = Account.create(props);

			expect(account.id).toBe("acc-123");
			expect(account.organizationId).toBe(1);
			expect(account.code).toBe("10");
			expect(account.name).toBe("Efectivo y Equivalentes de Efectivo");
			expect(account.level).toBe("1");
			expect(account.type).toBe("Activo");
			expect(account.isGroup).toBe(true);
			expect(account.isSystem).toBe(true);
			expect(account.currency).toBe("PEN");
		});

		it("should throw error when code is empty", () => {
			const props = createValidAccountProps({ code: "" });

			expect(() => Account.create(props)).toThrow(
				"El código de cuenta es requerido",
			);
		});

		it("should throw error when code contains whitespace only", () => {
			const props = createValidAccountProps({ code: "   " });

			expect(() => Account.create(props)).toThrow(
				"El código de cuenta es requerido",
			);
		});

		it("should throw error when code is non-numeric", () => {
			const props = createValidAccountProps({ code: "10A" });

			expect(() => Account.create(props)).toThrow(
				"El código de cuenta debe ser numérico",
			);
		});

		it("should throw error when name is empty", () => {
			const props = createValidAccountProps({ name: "" });

			expect(() => Account.create(props)).toThrow(
				"El nombre de cuenta es requerido",
			);
		});

		it("should throw error when name contains whitespace only", () => {
			const props = createValidAccountProps({ name: "    " });

			expect(() => Account.create(props)).toThrow(
				"El nombre de cuenta es requerido",
			);
		});

		it("should throw error when balance currency is not PEN", () => {
			const props = createValidAccountProps({
				balance: Money.fromAmount(0, "USD"),
			});

			expect(() => Account.create(props)).toThrow(
				"El balance principal debe estar en PEN",
			);
		});

		it("should throw error when balanceUSD currency is not USD", () => {
			const props = createValidAccountProps({
				balanceUSD: Money.fromAmount(0, "PEN"),
			});

			expect(() => Account.create(props)).toThrow(
				"El balance USD debe estar en dólares",
			);
		});
	});

	describe("PCGE Code Length Rules", () => {
		it("should accept level 1 account with 2-digit code", () => {
			const props = createValidAccountProps({
				code: "10",
				level: "1",
				type: "Activo",
			});

			const account = Account.create(props);
			expect(account.code).toBe("10");
		});

		it("should accept level 2 account with 3-digit code", () => {
			const props = createValidAccountProps({
				code: "101",
				level: "2",
				type: "Activo",
			});

			const account = Account.create(props);
			expect(account.code).toBe("101");
		});

		it("should accept level 3 account with 4-digit code", () => {
			const props = createValidAccountProps({
				code: "1011",
				level: "3",
				type: "Activo",
			});

			const account = Account.create(props);
			expect(account.code).toBe("1011");
		});

		it("should accept level 4 account with 5-digit code", () => {
			const props = createValidAccountProps({
				code: "10111",
				level: "4",
				type: "Activo",
			});

			const account = Account.create(props);
			expect(account.code).toBe("10111");
		});

		it("should accept level 5 account with 6-digit code", () => {
			const props = createValidAccountProps({
				code: "101111",
				level: "5",
				type: "Activo",
			});

			const account = Account.create(props);
			expect(account.code).toBe("101111");
		});

		it("should throw error for level 1 with wrong code length", () => {
			const props = createValidAccountProps({
				code: "101", // Should be 2 digits for level 1
				level: "1",
				type: "Activo",
			});

			expect(() => Account.create(props)).toThrow(
				"El código de nivel Rubro debe tener 2 dígitos",
			);
		});

		it("should throw error for level 2 with wrong code length", () => {
			const props = createValidAccountProps({
				code: "10", // Should be 3 digits for level 2
				level: "2",
				type: "Activo",
			});

			expect(() => Account.create(props)).toThrow(
				"El código de nivel Cuenta debe tener 3 dígitos",
			);
		});
	});

	describe("PCGE Type and Code Matching", () => {
		it("should accept Activo type for codes starting with 1", () => {
			const account = Account.create(
				createValidAccountProps({ code: "10", level: "1", type: "Activo" }),
			);
			expect(account.type).toBe("Activo");
		});

		it("should accept Activo type for codes starting with 2", () => {
			const account = Account.create(
				createValidAccountProps({ code: "20", level: "1", type: "Activo" }),
			);
			expect(account.type).toBe("Activo");
		});

		it("should accept Activo type for codes starting with 3", () => {
			const account = Account.create(
				createValidAccountProps({ code: "30", level: "1", type: "Activo" }),
			);
			expect(account.type).toBe("Activo");
		});

		it("should accept Pasivo type for codes starting with 4", () => {
			const account = Account.create(
				createValidAccountProps({ code: "40", level: "1", type: "Pasivo" }),
			);
			expect(account.type).toBe("Pasivo");
		});

		it("should accept Patrimonio type for codes starting with 5", () => {
			const account = Account.create(
				createValidAccountProps({ code: "50", level: "1", type: "Patrimonio" }),
			);
			expect(account.type).toBe("Patrimonio");
		});

		it("should accept Gasto type for codes starting with 6", () => {
			const account = Account.create(
				createValidAccountProps({ code: "60", level: "1", type: "Gasto" }),
			);
			expect(account.type).toBe("Gasto");
		});

		it("should accept Ingreso type for codes starting with 7", () => {
			const account = Account.create(
				createValidAccountProps({ code: "70", level: "1", type: "Ingreso" }),
			);
			expect(account.type).toBe("Ingreso");
		});

		it("should accept Saldo type for codes starting with 8", () => {
			const account = Account.create(
				createValidAccountProps({ code: "80", level: "1", type: "Saldo" }),
			);
			expect(account.type).toBe("Saldo");
		});

		it("should accept Costo type for codes starting with 9", () => {
			const account = Account.create(
				createValidAccountProps({ code: "90", level: "1", type: "Costo" }),
			);
			expect(account.type).toBe("Costo");
		});

		it("should throw error when type does not match code", () => {
			const props = createValidAccountProps({
				code: "10",
				level: "1",
				type: "Pasivo", // Should be Activo for code starting with 1
			});

			expect(() => Account.create(props)).toThrow(
				'El tipo "Pasivo" no es válido para códigos que empiezan con 1',
			);
		});

		it("should throw error for Gasto type with wrong code", () => {
			const props = createValidAccountProps({
				code: "10",
				level: "1",
				type: "Gasto", // Gasto is for codes starting with 6
			});

			expect(() => Account.create(props)).toThrow(
				'El tipo "Gasto" no es válido para códigos que empiezan con 1',
			);
		});
	});

	describe("Business Rules Methods", () => {
		describe("canBeDeleted", () => {
			it("should return false for system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);
				expect(account.canBeDeleted()).toBe(false);
			});

			it("should return true for non-system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: false }),
				);
				expect(account.canBeDeleted()).toBe(true);
			});
		});

		describe("canModifyCoreFields", () => {
			it("should return false for system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);
				expect(account.canModifyCoreFields()).toBe(false);
			});

			it("should return true for non-system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: false }),
				);
				expect(account.canModifyCoreFields()).toBe(true);
			});
		});

		describe("canHaveChildren", () => {
			it("should return true for group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: true }),
				);
				expect(account.canHaveChildren()).toBe(true);
			});

			it("should return false for non-group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: false }),
				);
				expect(account.canHaveChildren()).toBe(false);
			});
		});

		describe("canHaveTransactions", () => {
			it("should return false for group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: true }),
				);
				expect(account.canHaveTransactions()).toBe(false);
			});

			it("should return true for non-group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: false }),
				);
				expect(account.canHaveTransactions()).toBe(true);
			});
		});

		describe("isMovementAccount", () => {
			it("should return false for group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: true }),
				);
				expect(account.isMovementAccount()).toBe(false);
			});

			it("should return true for non-group accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isGroup: false }),
				);
				expect(account.isMovementAccount()).toBe(true);
			});
		});

		describe("isDebitNature", () => {
			it("should return true for Activo accounts", () => {
				const account = Account.create(
					createValidAccountProps({ type: "Activo" }),
				);
				expect(account.isDebitNature()).toBe(true);
			});

			it("should return true for Gasto accounts", () => {
				const account = Account.create(
					createValidAccountProps({ code: "60", level: "1", type: "Gasto" }),
				);
				expect(account.isDebitNature()).toBe(true);
			});

			it("should return true for Costo accounts", () => {
				const account = Account.create(
					createValidAccountProps({ code: "90", level: "1", type: "Costo" }),
				);
				expect(account.isDebitNature()).toBe(true);
			});

			it("should return false for Pasivo accounts", () => {
				const account = Account.create(
					createValidAccountProps({ code: "40", level: "1", type: "Pasivo" }),
				);
				expect(account.isDebitNature()).toBe(false);
			});
		});

		describe("isCreditNature", () => {
			it("should return true for Pasivo accounts", () => {
				const account = Account.create(
					createValidAccountProps({ code: "40", level: "1", type: "Pasivo" }),
				);
				expect(account.isCreditNature()).toBe(true);
			});

			it("should return true for Patrimonio accounts", () => {
				const account = Account.create(
					createValidAccountProps({
						code: "50",
						level: "1",
						type: "Patrimonio",
					}),
				);
				expect(account.isCreditNature()).toBe(true);
			});

			it("should return true for Ingreso accounts", () => {
				const account = Account.create(
					createValidAccountProps({ code: "70", level: "1", type: "Ingreso" }),
				);
				expect(account.isCreditNature()).toBe(true);
			});

			it("should return false for Activo accounts", () => {
				const account = Account.create(
					createValidAccountProps({ type: "Activo" }),
				);
				expect(account.isCreditNature()).toBe(false);
			});
		});

		describe("isAncestorOf", () => {
			it("should return true when code is prefix of child code", () => {
				const account = Account.create(
					createValidAccountProps({ code: "10", level: "1" }),
				);
				expect(account.isAncestorOf("101")).toBe(true);
				expect(account.isAncestorOf("1011")).toBe(true);
			});

			it("should return false when code is not prefix", () => {
				const account = Account.create(
					createValidAccountProps({ code: "10", level: "1" }),
				);
				expect(account.isAncestorOf("20")).toBe(false);
				expect(account.isAncestorOf("201")).toBe(false);
			});

			it("should return false for same code", () => {
				const account = Account.create(
					createValidAccountProps({ code: "10", level: "1" }),
				);
				expect(account.isAncestorOf("10")).toBe(false);
			});
		});

		describe("getLevelName", () => {
			it("should return correct level names", () => {
				const levels: AccountLevel[] = ["1", "2", "3", "4", "5"];
				const expectedNames = [
					"Rubro",
					"Cuenta",
					"Sub-Cuenta",
					"Divisionaria",
					"Sub-Divisionaria",
				];

				levels.forEach((level, index) => {
					const codeLength = index + 2; // Level 1 = 2 digits, etc.
					const code = "1".padEnd(codeLength, "0");
					const account = Account.create(
						createValidAccountProps({ code, level, type: "Activo" }),
					);
					expect(account.getLevelName()).toBe(expectedNames[index]);
				});
			});
		});
	});

	describe("Status Management", () => {
		describe("deactivate", () => {
			it("should deactivate an active account", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: true, isSystem: false }),
				);

				const deactivated = account.deactivate();

				expect(deactivated.isActive).toBe(false);
				expect(deactivated.updatedAt).toBeInstanceOf(Date);
			});

			it("should throw error when already inactive", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: false, isSystem: false }),
				);

				expect(() => account.deactivate()).toThrow(
					"La cuenta ya está inactiva",
				);
			});
		});

		describe("activate", () => {
			it("should activate an inactive account", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: false, isSystem: false }),
				);

				const activated = account.activate();

				expect(activated.isActive).toBe(true);
				expect(activated.updatedAt).toBeInstanceOf(Date);
			});

			it("should throw error when already active", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: true, isSystem: false }),
				);

				expect(() => account.activate()).toThrow("La cuenta ya está activa");
			});
		});

		describe("toggleStatus", () => {
			it("should toggle active to inactive", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: true, isSystem: false }),
				);

				const toggled = account.toggleStatus();

				expect(toggled.isActive).toBe(false);
			});

			it("should toggle inactive to active", () => {
				const account = Account.create(
					createValidAccountProps({ isActive: false, isSystem: false }),
				);

				const toggled = account.toggleStatus();

				expect(toggled.isActive).toBe(true);
			});
		});
	});

	describe("Update Operations", () => {
		describe("update", () => {
			it("should update allowed fields for non-system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: false }),
				);

				const updated = account.update({
					name: "Nuevo Nombre",
					description: "Nueva descripción",
					destination: "Nueva destino",
				});

				expect(updated.name).toBe("Nuevo Nombre");
				expect(updated.description).toBe("Nueva descripción");
				expect(updated.destination).toBe("Nueva destino");
			});

			it("should allow updating name and description for system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);

				const updated = account.update({
					name: "Nombre Actualizado",
					description: "Descripción actualizada",
				});

				expect(updated.name).toBe("Nombre Actualizado");
				expect(updated.description).toBe("Descripción actualizada");
			});

			it("should throw error when modifying code of system account", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);

				expect(() => account.update({ code: "20" })).toThrow(
					"No se pueden modificar los campos code de una cuenta del sistema",
				);
			});

			it("should throw error when modifying type of system account", () => {
				const account = Account.create(
					createValidAccountProps({
						isSystem: true,
						code: "40",
						level: "1",
						type: "Pasivo",
					}),
				);

				expect(() => account.update({ type: "Activo" })).toThrow(
					"No se pueden modificar los campos type de una cuenta del sistema",
				);
			});

			it("should throw error when modifying level of system account", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);

				expect(() => account.update({ level: "2" })).toThrow(
					"No se pueden modificar los campos level de una cuenta del sistema",
				);
			});

			it("should throw error when modifying isGroup of system account", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);

				expect(() => account.update({ isGroup: false })).toThrow(
					"No se pueden modificar los campos isGroup de una cuenta del sistema",
				);
			});

			it("should throw error when modifying currency of system account", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: true }),
				);

				expect(() => account.update({ currency: "USD" })).toThrow(
					"No se pueden modificar los campos currency de una cuenta del sistema",
				);
			});

			it("should allow modifying code for non-system accounts", () => {
				const account = Account.create(
					createValidAccountProps({ isSystem: false }),
				);

				const updated = account.update({ code: "20" });

				expect(updated.code).toBe("20");
			});

			it("should update updatedAt timestamp", () => {
				const originalDate = new Date("2024-01-01");
				const account = Account.create(
					createValidAccountProps({ updatedAt: originalDate, isSystem: false }),
				);

				const updated = account.update({ name: "New Name" });

				expect(updated.updatedAt.getTime()).toBeGreaterThan(
					originalDate.getTime(),
				);
			});
		});

		describe("updateBalance", () => {
			it("should update balance in PEN", () => {
				const account = Account.create(createValidAccountProps());
				const newBalance = Money.fromAmount(1000, "PEN");

				const updated = account.updateBalance(newBalance);

				expect(updated.balance.getAmount()).toBe(1000);
			});

			it("should update both balances", () => {
				const account = Account.create(createValidAccountProps());
				const newBalance = Money.fromAmount(1000, "PEN");
				const newBalanceUSD = Money.fromAmount(250, "USD");

				const updated = account.updateBalance(newBalance, newBalanceUSD);

				expect(updated.balance.getAmount()).toBe(1000);
				expect(updated.balanceUSD?.getAmount()).toBe(250);
			});

			it("should throw error when balance is not in PEN", () => {
				const account = Account.create(createValidAccountProps());
				const invalidBalance = Money.fromAmount(1000, "USD");

				expect(() => account.updateBalance(invalidBalance)).toThrow(
					"El balance principal debe estar en PEN",
				);
			});

			it("should throw error when balanceUSD is not in USD", () => {
				const account = Account.create(createValidAccountProps());
				const newBalance = Money.fromAmount(1000, "PEN");
				const invalidBalanceUSD = Money.fromAmount(250, "PEN");

				expect(() =>
					account.updateBalance(newBalance, invalidBalanceUSD),
				).toThrow("El balance USD debe estar en dólares");
			});
		});
	});

	describe("Equality", () => {
		it("should return true for accounts with same ID", () => {
			const account1 = Account.create(
				createValidAccountProps({ id: "same-id" }),
			);
			const account2 = Account.create(
				createValidAccountProps({ id: "same-id" }),
			);

			expect(account1.equals(account2)).toBe(true);
		});

		it("should return false for accounts with different ID", () => {
			const account1 = Account.create(createValidAccountProps({ id: "id-1" }));
			const account2 = Account.create(createValidAccountProps({ id: "id-2" }));

			expect(account1.equals(account2)).toBe(false);
		});

		it("should return false for null", () => {
			const account = Account.create(createValidAccountProps());
			expect(account.equals(null)).toBe(false);
		});

		it("should return false for undefined", () => {
			const account = Account.create(createValidAccountProps());
			expect(account.equals(undefined)).toBe(false);
		});
	});

	describe("Serialization", () => {
		it("should serialize to JSON correctly", () => {
			const account = Account.create(
				createValidAccountProps({
					id: "acc-json",
					code: "10",
					name: "Efectivo",
					balance: Money.fromAmount(1000, "PEN"),
					balanceUSD: Money.fromAmount(250, "USD"),
				}),
			);

			const json = account.toJSON();

			expect(json.id).toBe("acc-json");
			expect(json.code).toBe("10");
			expect(json.name).toBe("Efectivo");
			expect(json.balance).toBe(1000);
			expect(json.balanceUSD).toBe(250);
			expect(typeof json.createdAt).toBe("string");
			expect(typeof json.updatedAt).toBe("string");
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const account = Account.create(createValidAccountProps());

			expect(Object.isFrozen(account)).toBe(true);
		});

		it("should return new instance on update", () => {
			const original = Account.create(
				createValidAccountProps({ isSystem: false }),
			);
			const updated = original.update({ name: "New Name" });

			expect(updated).not.toBe(original);
			expect(original.name).toBe("Efectivo y Equivalentes de Efectivo");
			expect(updated.name).toBe("New Name");
		});
	});

	describe("ACCOUNT_LEVEL_NAMES Constant", () => {
		it("should have correct level names", () => {
			expect(ACCOUNT_LEVEL_NAMES["1"]).toBe("Rubro");
			expect(ACCOUNT_LEVEL_NAMES["2"]).toBe("Cuenta");
			expect(ACCOUNT_LEVEL_NAMES["3"]).toBe("Sub-Cuenta");
			expect(ACCOUNT_LEVEL_NAMES["4"]).toBe("Divisionaria");
			expect(ACCOUNT_LEVEL_NAMES["5"]).toBe("Sub-Divisionaria");
		});
	});

	describe("ACCOUNT_TYPE_CLASSES Constant", () => {
		it("should have correct type to class mapping", () => {
			expect(ACCOUNT_TYPE_CLASSES.Activo).toEqual(["1", "2", "3"]);
			expect(ACCOUNT_TYPE_CLASSES.Pasivo).toEqual(["4"]);
			expect(ACCOUNT_TYPE_CLASSES.Patrimonio).toEqual(["5"]);
			expect(ACCOUNT_TYPE_CLASSES.Gasto).toEqual(["6"]);
			expect(ACCOUNT_TYPE_CLASSES.Ingreso).toEqual(["7"]);
			expect(ACCOUNT_TYPE_CLASSES.Saldo).toEqual(["8"]);
			expect(ACCOUNT_TYPE_CLASSES.Costo).toEqual(["9"]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle account without parentId", () => {
			const account = Account.create(
				createValidAccountProps({ parentId: undefined }),
			);
			expect(account.parentId).toBeUndefined();
		});

		it("should handle account without description", () => {
			const account = Account.create(
				createValidAccountProps({ description: undefined }),
			);
			expect(account.description).toBeUndefined();
		});

		it("should handle account without destination", () => {
			const account = Account.create(
				createValidAccountProps({ destination: undefined }),
			);
			expect(account.destination).toBeUndefined();
		});

		it("should handle account without balanceUSD", () => {
			const account = Account.create(
				createValidAccountProps({ balanceUSD: undefined }),
			);
			expect(account.balanceUSD).toBeUndefined();
		});

		it("should handle zero balance", () => {
			const account = Account.create(
				createValidAccountProps({ balance: Money.fromAmount(0, "PEN") }),
			);
			expect(account.balance.getAmount()).toBe(0);
		});

		it("should handle large balance amounts", () => {
			const largeBalance = Money.fromAmount(999999999.99, "PEN");
			const account = Account.create(
				createValidAccountProps({ balance: largeBalance }),
			);
			expect(account.balance.getAmount()).toBe(999999999.99);
		});
	});
});

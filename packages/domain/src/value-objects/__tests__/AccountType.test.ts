/**
 * Unit Tests for AccountType Value Object
 */

import { describe, expect, it } from "vitest";
import {
	AccountType,
	ACCOUNT_TYPES,
	assertBankAccountType,
	BankAccountType,
	BANK_ACCOUNT_TYPES,
	isBankAccountType,
} from "../AccountType";

describe("BankAccountType", () => {
	it("BANK_ACCOUNT_TYPES should contain all valid account types", () => {
		expect(BANK_ACCOUNT_TYPES).toEqual(["CHECKING", "SAVINGS", "CREDIT"]);
	});

	it("BANK_ACCOUNT_TYPES should have length 3", () => {
		expect(BANK_ACCOUNT_TYPES).toHaveLength(3);
	});

	it("BANK_ACCOUNT_TYPES should contain only valid account types (runtime guard)", () => {
		const isValidBankType = (v: string): v is BankAccountType =>
			BANK_ACCOUNT_TYPES.includes(v as BankAccountType);

		for (const t of BANK_ACCOUNT_TYPES) {
			expect(isValidBankType(t)).toBe(true);
		}
		expect(isValidBankType("INVALID")).toBe(false);
		expect(isValidBankType("")).toBe(false);
	});
});

describe("AccountType backwards compatibility", () => {
	it("AccountType should be assignable to BankAccountType", () => {
		const accountType: AccountType = "CHECKING";
		const bankType: BankAccountType = accountType;
		expect(bankType).toBe("CHECKING");
	});

	it("ACCOUNT_TYPES should equal BANK_ACCOUNT_TYPES", () => {
		expect(ACCOUNT_TYPES).toBe(BANK_ACCOUNT_TYPES);
	});

	it("should allow SAVINGS assignment", () => {
		const type: BankAccountType = "SAVINGS";
		expect(type).toBe("SAVINGS");
	});

	it("should allow CREDIT assignment", () => {
		const type: BankAccountType = "CREDIT";
		expect(type).toBe("CREDIT");
	});

	it("should reject invalid account types at type level", () => {
		// Use a function to test runtime behavior
		const isValidType = (value: string): value is BankAccountType => {
			return BANK_ACCOUNT_TYPES.includes(value as BankAccountType);
		};
		expect(isValidType("CHECKING")).toBe(true);
		expect(isValidType("SAVINGS")).toBe(true);
		expect(isValidType("CREDIT")).toBe(true);
		expect(isValidType("INVALID")).toBe(false);
		expect(isValidType("")).toBe(false);
		expect(isValidType("checking")).toBe(false);
	});
});

describe("isBankAccountType", () => {
	it("should return true for valid types", () => {
		expect(isBankAccountType("CHECKING")).toBe(true);
		expect(isBankAccountType("SAVINGS")).toBe(true);
		expect(isBankAccountType("CREDIT")).toBe(true);
	});

	it("should return false for invalid types", () => {
		expect(isBankAccountType("INVALID")).toBe(false);
		expect(isBankAccountType("")).toBe(false);
		expect(isBankAccountType(null)).toBe(false);
		expect(isBankAccountType(undefined)).toBe(false);
		expect(isBankAccountType("checking")).toBe(false);
	});
});

describe("assertBankAccountType", () => {
	it("should return the type for valid input", () => {
		expect(assertBankAccountType("CHECKING")).toBe("CHECKING");
		expect(assertBankAccountType("SAVINGS")).toBe("SAVINGS");
	});

	it("should throw for invalid input", () => {
		expect(() => assertBankAccountType("INVALID")).toThrow(
			'Invalid BankAccountType: "INVALID"',
		);
		expect(() => assertBankAccountType("")).toThrow("Must be one of");
		expect(() => assertBankAccountType(null)).toThrow('Invalid BankAccountType: "null"');
	});
});

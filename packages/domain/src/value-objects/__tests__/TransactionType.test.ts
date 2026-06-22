/**
 * Unit Tests for TransactionType Value Objects
 */

import { describe, expect, it } from "vitest";
import {
	AccountingTransactionType,
	ACCOUNTING_TRANSACTION_TYPES,
	ACCOUNTING_TRANSACTION_TYPE_LABELS,
	BankTransactionType,
	BANK_TRANSACTION_TYPES,
	BANK_TRANSACTION_TYPE_LABELS,
	CashflowTransactionType,
	CASHFLOW_TRANSACTION_TYPES,
	CASHFLOW_TRANSACTION_TYPE_LABELS,
	isAccountingTransactionType,
	isBankTransactionType,
	isCashflowTransactionType,
} from "../TransactionType";

describe("AccountingTransactionType", () => {
	it("ACCOUNTING_TRANSACTION_TYPES should contain all 6 types", () => {
		expect(ACCOUNTING_TRANSACTION_TYPES).toEqual([
			"SALE",
			"PURCHASE",
			"PAYMENT",
			"RECEIPT",
			"ADJUSTMENT",
			"TRANSFER",
		]);
	});

	it("ACCOUNTING_TRANSACTION_TYPES should have length 6", () => {
		expect(ACCOUNTING_TRANSACTION_TYPES).toHaveLength(6);
	});

	it("ACCOUNTING_TRANSACTION_TYPE_LABELS should have all keys", () => {
		expect(Object.keys(ACCOUNTING_TRANSACTION_TYPE_LABELS).sort()).toEqual(
			ACCOUNTING_TRANSACTION_TYPES.slice().sort(),
		);
	});

	it("ACCOUNTING_TRANSACTION_TYPE_LABELS should have Spanish labels", () => {
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.SALE).toBe("Venta");
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.PURCHASE).toBe("Compra");
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.PAYMENT).toBe("Pago");
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.RECEIPT).toBe("Cobro");
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.ADJUSTMENT).toBe("Ajuste");
		expect(ACCOUNTING_TRANSACTION_TYPE_LABELS.TRANSFER).toBe("Transferencia");
	});

	it("isAccountingTransactionType should validate correctly", () => {
		expect(isAccountingTransactionType("SALE")).toBe(true);
		expect(isAccountingTransactionType("TRANSFER")).toBe(true);
		expect(isAccountingTransactionType("INVALID")).toBe(false);
		expect(isAccountingTransactionType("")).toBe(false);
		expect(isAccountingTransactionType(null)).toBe(false);
		expect(isAccountingTransactionType(undefined)).toBe(false);
		expect(isAccountingTransactionType(123)).toBe(false);
	});
});

describe("BankTransactionType", () => {
	it("BANK_TRANSACTION_TYPES should contain both types", () => {
		expect(BANK_TRANSACTION_TYPES).toEqual(["DEBIT", "CREDIT"]);
	});

	it("BANK_TRANSACTION_TYPES should have length 2", () => {
		expect(BANK_TRANSACTION_TYPES).toHaveLength(2);
	});

	it("BANK_TRANSACTION_TYPE_LABELS should have Spanish labels", () => {
		expect(BANK_TRANSACTION_TYPE_LABELS.DEBIT).toBe("Débito");
		expect(BANK_TRANSACTION_TYPE_LABELS.CREDIT).toBe("Crédito");
	});

	it("isBankTransactionType should validate correctly", () => {
		expect(isBankTransactionType("DEBIT")).toBe(true);
		expect(isBankTransactionType("CREDIT")).toBe(true);
		expect(isBankTransactionType("debit")).toBe(false);
		expect(isBankTransactionType("")).toBe(false);
		expect(isBankTransactionType(null)).toBe(false);
		expect(isBankTransactionType(undefined)).toBe(false);
	});
});

describe("CashflowTransactionType", () => {
	it("CASHFLOW_TRANSACTION_TYPES should contain both types", () => {
		expect(CASHFLOW_TRANSACTION_TYPES).toEqual(["INCOME", "EXPENSE"]);
	});

	it("CASHFLOW_TRANSACTION_TYPES should have length 2", () => {
		expect(CASHFLOW_TRANSACTION_TYPES).toHaveLength(2);
	});

	it("CASHFLOW_TRANSACTION_TYPE_LABELS should have Spanish labels", () => {
		expect(CASHFLOW_TRANSACTION_TYPE_LABELS.INCOME).toBe("Ingreso");
		expect(CASHFLOW_TRANSACTION_TYPE_LABELS.EXPENSE).toBe("Egreso");
	});

	it("isCashflowTransactionType should validate correctly", () => {
		expect(isCashflowTransactionType("INCOME")).toBe(true);
		expect(isCashflowTransactionType("EXPENSE")).toBe(true);
		expect(isCashflowTransactionType("income")).toBe(false);
		expect(isCashflowTransactionType("")).toBe(false);
		expect(isCashflowTransactionType(null)).toBe(false);
		expect(isCashflowTransactionType(undefined)).toBe(false);
	});
});

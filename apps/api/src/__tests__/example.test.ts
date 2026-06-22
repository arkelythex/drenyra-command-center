/**
 * Example Test — Demonstrates usage of shared test utilities.
 *
 * This file serves as both a working test and documentation
 * for how to use @arkelythex/test-utils in your tests.
 */
import { describe, it, expect } from "vitest";

// Builders
import {
	InvoiceBuilder,
	CompanyBuilder,
	UserBuilder,
	AccountBuilder,
	BankTransactionBuilder,
	TransactionBuilder,
} from "@arkelythex/test-utils/builders";

// Fixtures
import {
	VALID_RUCS,
	TEST_USERS,
	TEST_COMPANIES,
} from "@arkelythex/test-utils/fixtures";

// Helpers
import { money, moneyFromCents } from "@arkelythex/test-utils/helpers";

describe("Example: Shared Test Utilities", () => {
	describe("Builders", () => {
		it("should create an invoice with defaults", () => {
			const invoice = new InvoiceBuilder().build();
			expect(invoice).toBeDefined();
		});

		it("should create an invoice with custom RUC", () => {
			const invoice = new InvoiceBuilder()
				.withClientRUC(VALID_RUCS.ARKELYTHEX)
				.build();
			expect(invoice).toBeDefined();
		});

		it("should create a company with Pro tier", () => {
			const company = new CompanyBuilder().withPlan("pro").build();
			expect(company).toBeDefined();
			expect(company.plan).toBe("pro");
		});

		it("should create an admin user", () => {
			const user = new UserBuilder()
				.withEmail("admin@test.arkelythexfounders.com")
				.withRole("admin")
				.build();
			expect(user).toBeDefined();
		});

		it("should create a bank account", () => {
			const account = new AccountBuilder()
				.withCode("10411")
				.withName("Cuenta Corriente Soles")
				.withBalance(5000)
				.build();
			expect(account).toBeDefined();
		});

		it("should create a bank transaction", () => {
			const tx = new BankTransactionBuilder().withAmount(1000).build();
			expect(tx).toBeDefined();
		});

		it("should create a ledger transaction", () => {
			const tx = new TransactionBuilder()
				.withEntry("1041", "Caja Soles", 500, "debit")
				.withEntry("7011", "Ventas", 500, "credit")
				.build();
			expect(tx).toBeDefined();
		});
	});

	describe("Fixtures", () => {
		it("should provide valid RUCs", () => {
			expect(VALID_RUCS.ARKELYTHEX).toMatch(/^20\d{9}$/);
			expect(VALID_RUCS.PERSONA_NATURAL).toMatch(/^10\d{9}$/);
		});

		it("should provide test users", () => {
			expect(TEST_USERS.ADMIN).toBeDefined();
			expect(TEST_USERS.ACCOUNTANT).toBeDefined();
			expect(TEST_USERS.REGULAR_USER).toBeDefined();
		});

		it("should provide test companies", () => {
			expect(TEST_COMPANIES.ARKELYTHEX).toBeDefined();
			expect(TEST_COMPANIES.EMPRESA_TEST).toBeDefined();
			expect(TEST_COMPANIES.PROVEEDOR_DEMO).toBeDefined();
		});
	});

	describe("Helpers", () => {
		it("should create test money from amount", () => {
			const m = money(100); // S/ 100.00
			expect(m).toBeDefined();
		});

		it("should create test money from cents", () => {
			const m = moneyFromCents(10000); // S/ 100.00
			expect(m).toBeDefined();
		});
	});
});

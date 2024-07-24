/**
 * PR 4.2 — InvoiceRepository cross-tenant integration tests
 *
 * Verifies that findById(scope, invoiceId) enforces tenant isolation
 * at SQL level using the company_id column on invoices.
 *
 * Requires DATABASE_URL_TEST environment variable.
 *
 * @module h02-pr4.2-invoice-repository
 */

import { describe, expect, it } from "vitest";
import type { TenantScope } from "@drenyra/domain/scope";
import { PostgresInvoiceRepository } from "../postgres-invoice/repository";

// ============================================================
// Fixture IDs — deterministas para tenant isolation
// ============================================================

const ORG_A = "00000000-0000-4000-a000-000000000001";
const ORG_B = "00000000-0000-4000-b000-000000000001";
const C_A1 = "00000000-0000-4000-a000-000000000010";
const C_A2 = "00000000-0000-4000-a000-000000000020";
const C_B1 = "00000000-0000-4000-b000-000000000010";

const INVOICE_IN_A1 = "a0000000-0000-4000-8000-000000000001";

const scopeA1: TenantScope = { organizationId: ORG_A, companyId: C_A1 };
const scopeA2: TenantScope = { organizationId: ORG_A, companyId: C_A2 };
const scopeB1: TenantScope = { organizationId: ORG_B, companyId: C_B1 };

const repo = new PostgresInvoiceRepository();

describe("InvoiceRepository.findById — cross-tenant isolation", () => {
	it("finds an invoice in the selected company", async () => {
		const result = await repo.findById(scopeA1, INVOICE_IN_A1);
		expect(result).not.toBeNull();
		expect(result?.id).toBe(INVOICE_IN_A1);
	});

	it("returns null for another company in the same organization", async () => {
		const result = await repo.findById(scopeA2, INVOICE_IN_A1);
		expect(result).toBeNull();
	});

	it("returns null for another organization", async () => {
		const result = await repo.findById(scopeB1, INVOICE_IN_A1);
		expect(result).toBeNull();
	});

	it("returns null for an unknown invoice id", async () => {
		const result = await repo.findById(scopeA1, "nonexistent-id");
		expect(result).toBeNull();
	});

	it("does not distinguish foreign invoice from nonexistent invoice", async () => {
		const foreignResult = await repo.findById(scopeA2, INVOICE_IN_A1);
		const missingResult = await repo.findById(scopeA1, "nonexistent-id");

		expect(foreignResult).toBeNull();
		expect(missingResult).toBeNull();
	});
});

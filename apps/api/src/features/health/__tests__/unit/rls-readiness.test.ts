import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { buildRlsReadinessStatus } from "../../rls-readiness.ts";

describe("buildRlsReadinessStatus", () => {
	it("returns staged when all tenant policies exist but RLS is still disabled", () => {
		expect(
			buildRlsReadinessStatus(
				[
					{ tablename: "invoices", policyname: "invoices_tenant_guard" },
					{ tablename: "bills", policyname: "bills_tenant_guard" },
					{
						tablename: "business_partners",
						policyname: "business_partners_tenant_guard",
					},
					{
						tablename: "bank_accounts",
						policyname: "bank_accounts_tenant_guard",
					},
					{
						tablename: "bank_transactions",
						policyname: "bank_transactions_tenant_guard",
					},
				],
				[
					{ relname: "invoices", relrowsecurity: false },
					{ relname: "bills", relrowsecurity: false },
					{ relname: "business_partners", relrowsecurity: false },
					{ relname: "bank_accounts", relrowsecurity: false },
					{ relname: "bank_transactions", relrowsecurity: false },
				],
			),
		).toMatchObject({
			status: "staged",
			targetCount: 5,
			policyCount: 5,
			enabledCount: 0,
			pendingEnablement: expect.arrayContaining([
				"invoices",
				"bills",
				"business_partners",
				"bank_accounts",
				"bank_transactions",
			]),
		});
	});

	it("returns enabled when all tenant policies exist and RLS is enabled", () => {
		expect(
			buildRlsReadinessStatus(
				[
					{ tablename: "invoices", policyname: "invoices_tenant_guard" },
					{ tablename: "bills", policyname: "bills_tenant_guard" },
					{
						tablename: "business_partners",
						policyname: "business_partners_tenant_guard",
					},
					{
						tablename: "bank_accounts",
						policyname: "bank_accounts_tenant_guard",
					},
					{
						tablename: "bank_transactions",
						policyname: "bank_transactions_tenant_guard",
					},
				],
				[
					{ relname: "invoices", relrowsecurity: true },
					{ relname: "bills", relrowsecurity: true },
					{ relname: "business_partners", relrowsecurity: true },
					{ relname: "bank_accounts", relrowsecurity: true },
					{ relname: "bank_transactions", relrowsecurity: true },
				],
			),
		).toMatchObject({
			status: "enabled",
			policyCount: 5,
			enabledCount: 5,
			pendingEnablement: [],
		});
	});

	it("returns partial when some policies are still missing", () => {
		expect(
			buildRlsReadinessStatus(
				[
					{ tablename: "invoices", policyname: "invoices_tenant_guard" },
					{ tablename: "bills", policyname: "bills_tenant_guard" },
				],
				[
					{ relname: "invoices", relrowsecurity: false },
					{ relname: "bills", relrowsecurity: false },
					{ relname: "business_partners", relrowsecurity: false },
					{ relname: "bank_accounts", relrowsecurity: false },
					{ relname: "bank_transactions", relrowsecurity: false },
				],
			),
		).toMatchObject({
			status: "partial",
			policyCount: 2,
			missingPolicies: expect.arrayContaining([
				"business_partners",
				"bank_accounts",
				"bank_transactions",
			]),
		});
	});
	it("defines the tenant access helper before policies reference it", async () => {
		const sql = await readFile(
			"../../packages/infrastructure/sql/tenant_rls_baseline.sql",
			"utf8",
		);
		const helperIndex = sql.search(
			/CREATE OR REPLACE FUNCTION \w+_security\.has_tenant_access/,
		);
		const policyIndex = sql.indexOf("CREATE POLICY invoices_tenant_guard");

		expect(helperIndex).toBeGreaterThanOrEqual(0);
		expect(policyIndex).toBeGreaterThan(helperIndex);
	});
});

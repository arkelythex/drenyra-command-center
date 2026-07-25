/**
 * H02 Validation Gate — Attack Test: Drenyra Fiscal Cases
 *
 * Scenario:
 *   Tenant A creates a fiscal case.
 *   Tenant B attempts to READ, LIST, and UPDATE it.
 *
 * Expected (after fix): All cross-tenant operations return 404/NOT_FOUND
 *   indistinguishable from a non-existent resource.
 * Current (before fix): Records the actual RED behavior.
 *
 * @module h02-attack-cases
 */

import { db } from "@drenyra/persistence/client";
import { drenyraFiscalCases } from "@drenyra/persistence/schema";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const runIfDb = process.env.DATABASE_URL_TEST ? describe : describe.skip;

const TENANT_A_COMPANY = "00000000-0000-0000-0000-attacker-a001";
const TENANT_A_ORG = "org-attacker-a";
const TENANT_A_RUC = "20123456789";
const TENANT_A_PERIOD = "2026-07";

const TENANT_B_COMPANY = "00000000-0000-0000-0000-attacker-b001";
const TENANT_B_ORG = "org-attacker-b";
const TENANT_B_RUC = "20987654321";
const TENANT_B_PERIOD = "2026-07";

const CASE_ID_A = "h02-attack-case-a-0001";
const CASE_ID_B = "h02-attack-case-b-0001";

runIfDb("H02 Attack: Drenyra Fiscal Cases", () => {
	beforeAll(async () => {
		// Tenant A creates a fiscal case
		await db.insert(drenyraFiscalCases).values({
			id: CASE_ID_A,
			companyId: TENANT_A_COMPANY,
			companyRuc: TENANT_A_RUC,
			organizationId: TENANT_A_ORG,
			period: TENANT_A_PERIOD,
			countryCode: "PE",
			type: "CPE_REVIEW",
			status: "OPEN",
			title: "Tenant A — Factura F001-1",
			description: "Created by Tenant A for attack test",
			riskLevel: "LOW",
			riskScore: 10,
			autonomyLevel: "MANUAL",
			createdBy: "tenant-a-user",
			metadata: { source: "h02-attack-test" },
		});

		// Tenant B creates a DIFFERENT fiscal case
		await db.insert(drenyraFiscalCases).values({
			id: CASE_ID_B,
			companyId: TENANT_B_COMPANY,
			companyRuc: TENANT_B_RUC,
			organizationId: TENANT_B_ORG,
			period: TENANT_B_PERIOD,
			countryCode: "PE",
			type: "CPE_REVIEW",
			status: "OPEN",
			title: "Tenant B — Factura F001-1",
			description: "Created by Tenant B for attack test",
			riskLevel: "LOW",
			riskScore: 10,
			autonomyLevel: "MANUAL",
			createdBy: "tenant-b-user",
			metadata: { source: "h02-attack-test" },
		});
	});

	afterAll(async () => {
		await db.delete(drenyraFiscalCases).where(undefined as any);
	});

	// ─── READ ATTACK ───────────────────────────────────────────

	it("[RED] Tenant B can READ Tenant A's fiscal case by ID via repository (no scope filter)", async () => {
		const repo = await import(
			"@drenyra/persistence/repositories/postgres-drenyra.repository"
		);
		const instance = new repo.PostgresDrenyraRepository();

		// Attack: Tenant B calls getFiscalCaseById with Tenant A's case ID
		// but with Tenant B's scope
		const result = await instance.getFiscalCaseById(CASE_ID_A, {
			companyId: TENANT_B_COMPANY,
			companyRuc: TENANT_B_RUC,
			organizationId: TENANT_B_ORG,
			period: TENANT_B_PERIOD,
			countryCode: "PE",
		});

		// RED: Should return null (scope mismatch), but current behavior:
		if (result !== null) {
			console.log("🔴 ATTACK SUCCEEDS: Tenant B read Tenant A's fiscal case");
		}
		expect(result).toBeNull();
	});

	it("[RED] Tenant B can READ Tenant A's case via listFiscalCases with A's scope", async () => {
		const repo = await import(
			"@drenyra/persistence/repositories/postgres-drenyra.repository"
		);
		const instance = new repo.PostgresDrenyraRepository();

		// Attack: Tenant B queries listFiscalCases using Tenant A's scope
		const results = await instance.listFiscalCases({
			companyId: TENANT_A_COMPANY,
			companyRuc: TENANT_A_RUC,
			organizationId: TENANT_A_ORG,
			period: TENANT_A_PERIOD,
			countryCode: "PE",
		});

		// Attack succeeds if Tenant B can query Tenant A's scope
		const found = results.find((c) => c.id === CASE_ID_A);
		if (found) {
			console.log("🔴 ATTACK SUCCEEDS: Tenant B listed Tenant A's cases");
		}
		expect(found?.organizationId).toBe(TENANT_A_ORG);
	});

	// ─── UPDATE ATTACK ─────────────────────────────────────────

	it("[RED] Tenant B can UPDATE Tenant A's fiscal case status with A's scope", async () => {
		const repo = await import(
			"@drenyra/persistence/repositories/postgres-drenyra.repository"
		);
		const instance = new repo.PostgresDrenyraRepository();

		// Attack: Tenant B updates Tenant A's case status using A's scope
		await instance.updateFiscalCase({
			id: CASE_ID_A,
			companyId: TENANT_A_COMPANY,
			companyRuc: TENANT_A_RUC,
			organizationId: TENANT_A_ORG,
			period: TENANT_A_PERIOD,
			countryCode: "PE",
			type: "CPE_REVIEW",
			status: "CANCELLED",
			title: "Tenant A — Factura F001-1 (CANCELLED BY ATTACKER)",
			description: "Compromised by cross-tenant attack",
			riskLevel: "LOW",
			riskScore: 10,
			autonomyLevel: "MANUAL",
			createdBy: "tenant-a-user",
			metadata: {},
		});

		// Check if the update affected Tenant A's record
		const check = await instance.getFiscalCaseById(CASE_ID_A, {
			companyId: TENANT_A_COMPANY,
			companyRuc: TENANT_A_RUC,
			organizationId: TENANT_A_ORG,
			period: TENANT_A_PERIOD,
			countryCode: "PE",
		});
		if (check && check.status === "CANCELLED") {
			console.log(
				"🔴 ATTACK SUCCEEDS: Tenant B cancelled Tenant A's fiscal case",
			);
		}

		// Restore
		await db
			.update(drenyraFiscalCases)
			.set({ status: "OPEN", title: "Tenant A — Factura F001-1" })
			.where(undefined as any);
	});
});

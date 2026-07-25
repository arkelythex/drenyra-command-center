/**
 * PR 3.3 — ClientRepository cross-tenant integration tests
 *
 * Verifies that findById(scope, clientId) enforces tenant isolation
 * at SQL level using the companyId column on business_partners.
 *
 * Requires DATABASE_URL_TEST environment variable.
 *
 * @module h02-pr3.3-client-repository
 */

import type { TenantScope } from "@drenyra/domain/scope";
import { describe, expect, it } from "vitest";
import { PostgresClientRepository } from "../postgres-client.repository";

// ============================================================
// Fixture IDs — deterministas para tenant isolation
// ============================================================

const ORG_A = "00000000-0000-4000-a000-000000000001";
const ORG_B = "00000000-0000-4000-b000-000000000001";
const C_A1 = "00000000-0000-4000-a000-000000000010";
const C_A2 = "00000000-0000-4000-a000-000000000020";
const C_B1 = "00000000-0000-4000-b000-000000000010";

const CLIENT_IN_A1 = "60000000-0000-4000-8000-000000000001";

const scopeA1: TenantScope = { organizationId: ORG_A, companyId: C_A1 };
const scopeA2: TenantScope = { organizationId: ORG_A, companyId: C_A2 };
const scopeB1: TenantScope = { organizationId: ORG_B, companyId: C_B1 };

const repo = new PostgresClientRepository();

describe("ClientRepository.findById — cross-tenant isolation", () => {
	it("finds a client in the selected company", async () => {
		const result = await repo.findById(scopeA1, CLIENT_IN_A1);
		expect(result).not.toBeNull();
		expect(result?.id).toBe(CLIENT_IN_A1);
	});

	it("returns null for another company in the same organization", async () => {
		const result = await repo.findById(scopeA2, CLIENT_IN_A1);
		expect(result).toBeNull();
	});

	it("returns null for another organization", async () => {
		const result = await repo.findById(scopeB1, CLIENT_IN_A1);
		expect(result).toBeNull();
	});

	it("returns null for an unknown client id", async () => {
		const result = await repo.findById(scopeA1, "nonexistent-id");
		expect(result).toBeNull();
	});

	it("does not distinguish foreign client from nonexistent client", async () => {
		const foreignResult = await repo.findById(scopeA2, CLIENT_IN_A1);
		const missingResult = await repo.findById(scopeA1, "nonexistent-id");

		expect(foreignResult).toBeNull();
		expect(missingResult).toBeNull();
	});
});

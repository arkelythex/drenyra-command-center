/**
 * PR 4.3 — SireSubmissionRepository cross-tenant isolation tests
 *
 * Verifies that findByIdempotencyKey(scope, key) and update(scope, id, input)
 * enforce tenant isolation at SQL level using the company_id column.
 *
 * Requires DATABASE_URL_TEST environment variable.
 *
 * @module h02-pr4.3-sire-submission-repository
 */

import { describe, expect, it } from "vitest";
import type { TenantScope } from "@drenyra/domain/scope";
import { SireSubmissionRepository } from "../sire-submission.repository";

// ============================================================
// Fixture IDs — deterministas para tenant isolation
// ============================================================

const ORG_A = "00000000-0000-4000-a000-000000000001";
const ORG_B = "00000000-0000-4000-b000-000000000001";
const C_A1 = "00000000-0000-4000-a000-000000000010";
const C_A2 = "00000000-0000-4000-a000-000000000020";
const C_B1 = "00000000-0000-4000-b000-000000000010";

const IDEMPOTENCY_KEY = "sire-submission-2026-07-a1-ventas";

const scopeA1: TenantScope = { organizationId: ORG_A, companyId: C_A1 };
const scopeA2: TenantScope = { organizationId: ORG_A, companyId: C_A2 };
const scopeB1: TenantScope = { organizationId: ORG_B, companyId: C_B1 };

const repo = new SireSubmissionRepository();

describe("SireSubmissionRepository.findByIdempotencyKey — cross-tenant isolation", () => {
	it("finds a submission by idempotency key in the selected company", async () => {
		const result = await repo.findByIdempotencyKey(scopeA1, IDEMPOTENCY_KEY);
		expect(result).not.toBeNull();
		expect(result?.idempotencyKey).toBe(IDEMPOTENCY_KEY);
	});

	it("returns null for another company in the same organization", async () => {
		const result = await repo.findByIdempotencyKey(scopeA2, IDEMPOTENCY_KEY);
		expect(result).toBeNull();
	});

	it("returns null for another organization", async () => {
		const result = await repo.findByIdempotencyKey(scopeB1, IDEMPOTENCY_KEY);
		expect(result).toBeNull();
	});

	it("returns null for an unknown idempotency key", async () => {
		const result = await repo.findByIdempotencyKey(scopeA1, "unknown-key");
		expect(result).toBeNull();
	});

	it("does not distinguish foreign submission from nonexistent submission", async () => {
		const foreignResult = await repo.findByIdempotencyKey(scopeA2, IDEMPOTENCY_KEY);
		const missingResult = await repo.findByIdempotencyKey(scopeA1, "unknown-key");

		expect(foreignResult).toBeNull();
		expect(missingResult).toBeNull();
	});
});

describe("SireSubmissionRepository.update — cross-tenant isolation", () => {
	it("updates a submission in the selected company", async () => {
		const submission = await repo.findByIdempotencyKey(scopeA1, IDEMPOTENCY_KEY);
		expect(submission).not.toBeNull();

		const updated = await repo.update(scopeA1, submission!.id, {
			status: "SUBMITTED",
		});
		expect(updated).not.toBeNull();
		expect(updated?.status).toBe("SUBMITTED");
	});

	it("does not update a submission from another company", async () => {
		const submission = await repo.findByIdempotencyKey(scopeA1, IDEMPOTENCY_KEY);
		expect(submission).not.toBeNull();

		// Attempt update with wrong scope — should return undefined (0 rows matched)
		const result = await repo.update(scopeA2, submission!.id, {
			status: "REJECTED",
		});
		expect(result).toBeUndefined();
	});

	it("does not update a submission from another organization", async () => {
		const submission = await repo.findByIdempotencyKey(scopeA1, IDEMPOTENCY_KEY);
		expect(submission).not.toBeNull();

		const result = await repo.update(scopeB1, submission!.id, {
			status: "REJECTED",
		});
		expect(result).toBeUndefined();
	});
});

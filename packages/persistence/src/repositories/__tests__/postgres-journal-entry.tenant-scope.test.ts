/**
 * PostgresJournalEntryRepository — tenant scope integration tests.
 *
 * Runs against a real PostgreSQL only when DATABASE_URL_TEST is set AND equals
 * DATABASE_URL, so fixtures are never written to a non-test database.
 *
 * Verifies that findById/delete are filtered by the caller's companyId and that
 * a foreign entry is indistinguishable from a nonexistent one.
 */

import type { TenantScope } from "@drenyra/domain/scope";
import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "../../client";
import {
	companies,
	journalEntries,
	journalEntryLines,
	organizations,
	users,
} from "../../schema";
import { PostgresJournalEntryRepository } from "../postgres-journal-entry.repository";

const hasTestDb =
	Boolean(process.env.DATABASE_URL_TEST) &&
	process.env.DATABASE_URL_TEST === process.env.DATABASE_URL;

const USER_A = "f0000000-0000-0000-0000-0000000000a1";
const USER_B = "f0000000-0000-0000-0000-0000000000b1";
const COMPANY_A = "f1000000-0000-0000-0000-0000000000a1";
const COMPANY_B = "f1000000-0000-0000-0000-0000000000b1";
const ENTRY_A = "f2000000-0000-0000-0000-0000000000a1";
const RUC_A = "20900000001";
const RUC_B = "20900000002";

const scopeA: TenantScope = { organizationId: "9001", companyId: COMPANY_A };
const scopeB: TenantScope = { organizationId: "9002", companyId: COMPANY_B };

async function cleanup(): Promise<void> {
	await db
		.delete(journalEntryLines)
		.where(eq(journalEntryLines.journalEntryId, ENTRY_A));
	await db.delete(journalEntries).where(eq(journalEntries.id, ENTRY_A));
	await db
		.delete(companies)
		.where(inArray(companies.id, [COMPANY_A, COMPANY_B]));
	await db.delete(users).where(inArray(users.id, [USER_A, USER_B]));
	await db.delete(organizations).where(inArray(organizations.id, [9001, 9002]));
}

describe.skipIf(!hasTestDb)(
	"PostgresJournalEntryRepository — tenant scope",
	() => {
		const repo = new PostgresJournalEntryRepository();

		beforeAll(async () => {
			await cleanup();
			await db.insert(organizations).values([
				{ id: 9001, name: "Org A", ruc: RUC_A, slug: "org-a-9001" },
				{ id: 9002, name: "Org B", ruc: RUC_B, slug: "org-b-9002" },
			]);
			await db.insert(users).values([
				{ id: USER_A, email: "a@scope.test", password: "x", name: "A" },
				{ id: USER_B, email: "b@scope.test", password: "x", name: "B" },
			]);
			await db.insert(companies).values([
				{ id: COMPANY_A, ownerId: USER_A, ruc: RUC_A, businessName: "A SAC" },
				{ id: COMPANY_B, ownerId: USER_B, ruc: RUC_B, businessName: "B SAC" },
			]);
			await db.insert(journalEntries).values({
				id: ENTRY_A,
				companyId: COMPANY_A,
				entryNumber: "2025-90001",
				periodKey: "2025-01",
				date: new Date("2025-01-15"),
				gloss: "Fixture entry",
				status: "borrador",
			});
			await db.insert(journalEntryLines).values([
				{
					journalEntryId: ENTRY_A,
					accountCode: "10",
					description: "d",
					debitCents: 10000,
					creditCents: 0,
				},
				{
					journalEntryId: ENTRY_A,
					accountCode: "70",
					description: "c",
					debitCents: 0,
					creditCents: 10000,
				},
			]);
		});

		afterAll(async () => {
			await cleanup();
		});

		it("findById returns the entry inside its own company", async () => {
			const entry = await repo.findById(scopeA, ENTRY_A);
			expect(entry?.id).toBe(ENTRY_A);
			expect(entry?.lines).toHaveLength(2);
		});

		it("findById returns null for another company", async () => {
			expect(await repo.findById(scopeB, ENTRY_A)).toBeNull();
		});

		it("findById: foreign and nonexistent ids are indistinguishable", async () => {
			const foreign = await repo.findById(scopeB, ENTRY_A);
			const missing = await repo.findById(
				scopeA,
				"f2000000-0000-0000-0000-0000000000ff",
			);
			expect(foreign).toEqual(missing);
		});

		it("delete rejects another company's entry and keeps it intact", async () => {
			await expect(repo.delete(scopeB, ENTRY_A)).rejects.toThrow(/not found/i);

			const entry = await repo.findById(scopeA, ENTRY_A);
			expect(entry?.lines).toHaveLength(2);
		});

		it("delete removes the entry and its lines inside the owning company", async () => {
			await repo.delete(scopeA, ENTRY_A);

			expect(await repo.findById(scopeA, ENTRY_A)).toBeNull();
			const lines = await db
				.select()
				.from(journalEntryLines)
				.where(eq(journalEntryLines.journalEntryId, ENTRY_A));
			expect(lines).toHaveLength(0);
		});
	},
);

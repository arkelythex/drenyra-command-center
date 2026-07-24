/**
 * PR 1.4 — Application-layer cross-tenant validation tests.
 *
 * Verifies that the use cases reject cross-tenant account references
 * BEFORE calling the repository. These tests use mocked repositories
 * to isolate the validation logic.
 *
 * The repository-layer integration tests (in persistence/__tests__/) verify
 * that the SQL-level isolation works with real PostgreSQL.
 *
 * @module h02-pr1.4-app-validation
 */

import { describe, expect, it, type Mock, vi } from "vitest";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { UpdateJournalEntryUseCase } from "../update-journal-entry.use-case";

const scopeA1: TenantScope = { organizationId: "1", companyId: "company-a1" };

const mockAccountService = {
	getById: vi.fn(),
};

function createMockRepo(): { [K in keyof JournalEntryRepository]: Mock } {
	return {
		findById: vi.fn(),
		create: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
		findAll: vi.fn(),
		findWithFilters: vi.fn(),
		getNextEntryNumber: vi.fn(),
		count: vi.fn(),
		countByAccountId: vi.fn(),
	} as unknown as { [K in keyof JournalEntryRepository]: Mock };
}

describe("UpdateJournalEntry — cross-tenant account validation", () => {
	it("rejects update when accountService cannot find account (cross-tenant)", async () => {
		const repo = createMockRepo();
		const existingEntry = {
			id: "entry-1",
			canBeModified: () => true,
			update: vi.fn(),
		};

		repo.findById.mockResolvedValue(existingEntry);
		mockAccountService.getById.mockResolvedValue(null); // account not found = cross-tenant

		const useCase = new UpdateJournalEntryUseCase(repo, mockAccountService);

		await expect(
			useCase.execute(scopeA1, "entry-1", {
				lines: [
					{
						accountId: "550e8400-e29b-41d4-a716-446655440001",
						description: "test",
						debit: 100,
						credit: 0,
					},
					{
						accountId: "550e8400-e29b-41d4-a716-446655440002",
						description: "test2",
						debit: 0,
						credit: 100,
					},
				],
			}),
		).rejects.toThrow(/Cuenta no encontrada/i);

		expect(repo.update).not.toHaveBeenCalled();
		expect(repo.create).not.toHaveBeenCalled();
	});

	it("does not call repository when account validation fails", async () => {
		const repo = createMockRepo();
		const existingEntry = {
			id: "entry-1",
			canBeModified: () => true,
			update: vi.fn(),
		};

		repo.findById.mockResolvedValue(existingEntry);
		mockAccountService.getById.mockResolvedValueOnce(null);

		const useCase = new UpdateJournalEntryUseCase(repo, mockAccountService);

		await expect(
			useCase.execute(scopeA1, "entry-1", {
				lines: [
					{
						accountId: "550e8400-e29b-41d4-a716-446655440001",
						description: "test",
						debit: 100,
						credit: 0,
					},
					{
						accountId: "550e8400-e29b-41d4-a716-446655440002",
						description: "test2",
						debit: 0,
						credit: 100,
					},
				],
			}),
		).rejects.toThrow();

		expect(repo.update).not.toHaveBeenCalled();
		expect(repo.create).not.toHaveBeenCalled();
	});
});

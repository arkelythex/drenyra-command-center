/**
 * UpdateJournalEntryStatusUseCase — tenant isolation tests.
 *
 * The entry must be resolved inside the caller's TenantScope so an id from
 * another company can never be posted or declared.
 */

import { JournalEntry } from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import type { TenantScope } from "@drenyra/domain/scope";
import { Money } from "@drenyra/domain/value-objects/Money";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UpdateJournalEntryStatusUseCase } from "../update-journal-entry-status.use-case";

const scope: TenantScope = { organizationId: "1", companyId: "company-a1" };

function draftEntry(): JournalEntry {
	return JournalEntry.create({
		id: "entry-1",
		organizationId: "1",
		entryNumber: "2025-00001",
		date: new Date("2025-01-15"),
		description: "Venta",
		reference: "REF-1",
		gloss: "Por venta",
		status: "borrador",
		lines: [
			{
				accountId: "acc-1",
				accountCode: "10",
				accountName: "Caja",
				debit: Money.fromAmount(100, "PEN"),
				credit: Money.zero("PEN"),
				description: "d",
			},
			{
				accountId: "acc-2",
				accountCode: "70",
				accountName: "Ventas",
				debit: Money.zero("PEN"),
				credit: Money.fromAmount(100, "PEN"),
				description: "c",
			},
		],
		createdAt: new Date(),
		updatedAt: new Date(),
	});
}

describe("UpdateJournalEntryStatusUseCase — tenant isolation", () => {
	let repo: { [K in keyof JournalEntryRepository]: ReturnType<typeof vi.fn> };
	let useCase: UpdateJournalEntryStatusUseCase;

	beforeEach(() => {
		repo = {
			save: vi.fn().mockResolvedValue(undefined),
			findById: vi.fn(),
		} as unknown as typeof repo;
		useCase = new UpdateJournalEntryStatusUseCase(
			repo as unknown as JournalEntryRepository,
		);
	});

	it("looks the entry up inside the caller's tenant scope", async () => {
		repo.findById.mockResolvedValue(draftEntry());

		await useCase.execute(scope, "entry-1", "mayorizado", "user-1");

		expect(repo.findById).toHaveBeenCalledWith(scope, "entry-1");
	});

	it("does not change the status of an entry the scope cannot see", async () => {
		repo.findById.mockResolvedValue(null);

		await expect(
			useCase.execute(scope, "foreign-entry", "mayorizado", "user-1"),
		).rejects.toThrow("Asiento no encontrado");
		expect(repo.save).not.toHaveBeenCalled();
	});
});

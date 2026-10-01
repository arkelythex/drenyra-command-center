/**
 * DeleteJournalEntry — Deletes a journal entry.
 *
 * @module journal-entries/application/commands
 */

import { DeleteJournalEntryUseCase } from "@drenyra/application/use-cases/journal";
import type { TenantScope } from "@drenyra/domain/scope";
import { journalRepository } from "../_helpers";

/**
 * Deletes a journal entry by ID.
 *
 * @param scope - Tenant scope of the caller
 * @param id - The ID of the journal entry to delete
 * @throws Error if the entry cannot be deleted (e.g., already posted)
 */
export async function deleteJournalEntry(scope: TenantScope, id: string) {
	const useCase = new DeleteJournalEntryUseCase(journalRepository);
	await useCase.execute(scope, id);
}

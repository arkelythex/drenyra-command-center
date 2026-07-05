/**
 * DeleteJournalEntry — Deletes a journal entry.
 *
 * @module journal-entries/application/commands
 */

import { DeleteJournalEntryUseCase } from "@drenyra/application/use-cases/journal";
import { journalRepository } from "../_helpers";

/**
 * Deletes a journal entry by ID.
 *
 * @param id - The ID of the journal entry to delete
 * @throws Error if the entry cannot be deleted (e.g., already posted)
 */
export async function deleteJournalEntry(id: string) {
	const useCase = new DeleteJournalEntryUseCase(journalRepository);
	await useCase.execute(id);
}

/**
 * GetJournalEntry — Returns a single journal entry by ID.
 *
 * @module journal-entries/application/queries
 */

import { journalRepository } from "../_helpers";

export interface GetJournalEntryInput {
	id: string;
}

/**
 * Returns a journal entry by its ID.
 *
 * @param input - Query input with entry ID
 * @returns The journal entry as JSON, or null if not found
 */
export async function getJournalEntry(input: GetJournalEntryInput) {
	const entry = await journalRepository.findById(input.id);
	if (!entry) return null;
	return entry.toJSON();
}

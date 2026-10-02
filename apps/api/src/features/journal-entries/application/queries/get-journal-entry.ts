/**
 * GetJournalEntry — Returns a single journal entry by ID.
 *
 * @module journal-entries/application/queries
 */

import type { TenantScope } from "@drenyra/domain/scope";
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
export async function getJournalEntry(
	scope: TenantScope,
	input: GetJournalEntryInput,
) {
	const entry = await journalRepository.findById(scope, input.id);
	if (!entry) return null;
	return entry.toJSON();
}

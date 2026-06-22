/**
 * UpdateJournalEntryStatus — Updates a journal entry's status (mayorizar/declarar).
 *
 * @module journal-entries/application/commands
 */

import { UpdateJournalEntryStatusUseCase } from "@arkelythex/application/use-cases/journal";
import { journalRepository } from "../_helpers";

export type JournalEntryStatus = "mayorizado" | "declarado";

/**
 * Updates the status of a journal entry.
 *
 * @param id - The ID of the journal entry
 * @param status - The target status
 * @param actorId - The ID of the actor (default: "system")
 * @returns The updated journal entry as JSON
 * @throws Error if the status transition is invalid
 */
export async function updateJournalEntryStatus(
	id: string,
	status: JournalEntryStatus,
	actorId = "system",
) {
	const useCase = new UpdateJournalEntryStatusUseCase(journalRepository);
	const entry = await useCase.execute(id, status, actorId);
	return entry.toJSON();
}

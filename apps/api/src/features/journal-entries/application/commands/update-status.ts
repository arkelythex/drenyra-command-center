/**
 * UpdateJournalEntryStatus — Updates a journal entry's status (mayorizar/declarar).
 *
 * @module journal-entries/application/commands
 */

import { UpdateJournalEntryStatusUseCase } from "@drenyra/application/use-cases/journal";
import type { TenantScope } from "@drenyra/domain/scope";
import { journalRepository, periodRepository } from "../_helpers";

export type JournalEntryStatus = "mayorizado" | "declarado";

/**
 * Updates the status of a journal entry.
 *
 * @param scope - Tenant scope of the caller
 * @param id - The ID of the journal entry
 * @param status - The target status
 * @param actorId - The ID of the actor (default: "system")
 * @returns The updated journal entry as JSON
 * @throws Error if the status transition is invalid
 */
export async function updateJournalEntryStatus(
	scope: TenantScope,
	id: string,
	status: JournalEntryStatus,
	actorId = "system",
) {
	const useCase = new UpdateJournalEntryStatusUseCase(
		journalRepository,
		periodRepository,
	);
	const entry = await useCase.execute(scope, id, status, actorId);
	return entry.toJSON();
}

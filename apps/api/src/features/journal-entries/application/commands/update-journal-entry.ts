/**
 * UpdateJournalEntry — Updates an existing journal entry.
 *
 * @module journal-entries/application/commands
 */

import { UpdateJournalEntryUseCase } from "@arkelythex/application/use-cases/journal";
import { accountService, journalRepository } from "../_helpers";

export interface UpdateJournalEntryInput {
	date?: Date;
	gloss?: string;
	lines?: Array<{
		accountId: string;
		description: string;
		debit: number;
		credit: number;
		documentType?: string;
		documentNumber?: string;
		dueDate?: Date;
	}>;
}

/**
 * Updates an existing journal entry.
 *
 * @param id - The ID of the journal entry to update
 * @param input - The fields to update
 * @returns The updated journal entry as JSON
 * @throws Error if the entry cannot be edited (e.g., already posted)
 */
export async function updateJournalEntry(
	id: string,
	input: UpdateJournalEntryInput,
) {
	const useCase = new UpdateJournalEntryUseCase(
		journalRepository,
		accountService,
	);
	const entry = await useCase.execute(id, {
		date: input.date,
		gloss: input.gloss,
		lines: input.lines?.map((line) => ({
			accountId: line.accountId,
			description: line.description,
			debit: line.debit,
			credit: line.credit,
			documentType: line.documentType,
			documentNumber: line.documentNumber,
			dueDate: line.dueDate,
		})),
	});
	return entry.toJSON();
}

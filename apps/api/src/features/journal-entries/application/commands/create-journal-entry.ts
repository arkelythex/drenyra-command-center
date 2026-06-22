/**
 * CreateJournalEntry — Creates a new journal entry.
 *
 * @module journal-entries/application/commands
 */

import { CreateJournalEntryUseCase } from "@arkelythex/application/use-cases/journal";
import { accountService, journalRepository } from "../_helpers";

export interface CreateJournalEntryInput {
	organizationId: number;
	date: Date;
	gloss: string;
	lines: Array<{
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
 * Creates a new journal entry.
 *
 * @param input - The journal entry creation input
 * @param actorId - The ID of the actor creating the entry (default: "system")
 * @returns The created journal entry as JSON
 * @throws Error if validation fails (e.g., unbalanced entry, missing account)
 */
export async function createJournalEntry(
	input: CreateJournalEntryInput,
	actorId = "system",
) {
	const useCase = new CreateJournalEntryUseCase(
		journalRepository,
		accountService,
	);
	const entry = await useCase.execute(
		{
			organizationId: input.organizationId,
			date: input.date,
			gloss: input.gloss,
			lines: input.lines.map((line) => ({
				accountId: line.accountId,
				description: line.description,
				debit: line.debit,
				credit: line.credit,
				documentType: line.documentType,
				documentNumber: line.documentNumber,
				dueDate: line.dueDate,
			})),
		},
		actorId,
	);
	return entry.toJSON();
}

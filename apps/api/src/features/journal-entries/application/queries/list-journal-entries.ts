/**
 * ListJournalEntries — Returns journal entries with optional filters.
 *
 * @module journal-entries/application/queries
 */

import { GetJournalEntriesUseCase } from "@arkelythex/application/use-cases/journal";
import { journalRepository } from "../_helpers";

export interface ListJournalEntriesInput {
	organizationId: number;
	status?: "borrador" | "mayorizado" | "declarado" | "all";
	dateFrom?: Date;
	dateTo?: Date;
	documentNumber?: string;
}

/**
 * Lists journal entries for an organization with optional filters.
 *
 * @param input - Query input with filters
 * @returns Array of journal entries as JSON
 */
export async function listJournalEntries(input: ListJournalEntriesInput) {
	const useCase = new GetJournalEntriesUseCase(journalRepository);
	const entries = await useCase.execute({
		organizationId: input.organizationId,
		status: input.status ?? "all",
		dateFrom: input.dateFrom,
		dateTo: input.dateTo,
		documentNumber: input.documentNumber,
	});
	return entries.map((e) => e.toJSON());
}

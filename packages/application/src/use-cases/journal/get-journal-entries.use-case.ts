/**
 * Get Journal Entries Use Case
 * Retrieves journal entries with optional filters
 */

import type { JournalEntry } from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import {
	type JournalEntryFiltersDTO,
	JournalEntryFiltersSchema,
} from "../../dtos/journal/journal-entry.dto";

/**
 * GetJournalEntriesUseCase class.
 *
 * @example
 * ```ts
 * const value = new GetJournalEntriesUseCase();
 * console.log(value);
 * ```
 */
export class GetJournalEntriesUseCase {
	constructor(private readonly journalRepository: JournalEntryRepository) {}

	async execute(filters: JournalEntryFiltersDTO): Promise<JournalEntry[]> {
		// 1. Validate filters
		const validatedFilters = JournalEntryFiltersSchema.parse(filters);

		// 2. Fetch entries from repository
		const entries = await this.journalRepository.findWithFilters({
			organizationId: validatedFilters.organizationId,
			...(validatedFilters.status !== undefined &&
			validatedFilters.status !== "all"
				? { status: validatedFilters.status }
				: {}),
			...(validatedFilters.dateFrom !== undefined
				? { dateFrom: validatedFilters.dateFrom }
				: {}),
			...(validatedFilters.dateTo !== undefined
				? { dateTo: validatedFilters.dateTo }
				: {}),
			...(validatedFilters.minAmount !== undefined
				? { minAmount: validatedFilters.minAmount }
				: {}),
			...(validatedFilters.maxAmount !== undefined
				? { maxAmount: validatedFilters.maxAmount }
				: {}),
			...(validatedFilters.documentNumber !== undefined
				? { documentNumber: validatedFilters.documentNumber }
				: {}),
		});

		return entries;
	}
}

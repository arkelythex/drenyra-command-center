/**
 * Get Journal Entries Use Case
 * Retrieves journal entries with optional filters
 */

import {
	type JournalEntryFiltersDTO,
	JournalEntryFiltersSchema,
} from "../../dtos/journal/journal-entry.dto";
import type { JournalEntry } from "@arkelythex/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@arkelythex/domain/repositories/journal-entry.repository";

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
			status:
				validatedFilters.status === "all" ? undefined : validatedFilters.status,
			dateFrom: validatedFilters.dateFrom,
			dateTo: validatedFilters.dateTo,
			minAmount: validatedFilters.minAmount,
			maxAmount: validatedFilters.maxAmount,
			documentNumber: validatedFilters.documentNumber,
		});

		return entries;
	}
}

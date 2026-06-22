/**
 * Delete Journal Entry Use Case
 * Orchestrates the deletion of a journal entry
 */

import type { JournalEntryRepository } from "@arkelythex/domain/repositories/journal-entry.repository";

/**
 * DeleteJournalEntryUseCase class.
 *
 * @example
 * ```ts
 * const value = new DeleteJournalEntryUseCase();
 * console.log(value);
 * ```
 */
export class DeleteJournalEntryUseCase {
	constructor(private readonly journalRepository: JournalEntryRepository) {}

	async execute(id: string): Promise<void> {
		// 1. Find existing entry
		const entry = await this.journalRepository.findById(id);
		if (!entry) {
			throw new Error("Asiento no encontrado");
		}

		// 2. Check if can be deleted (business rule in entity)
		if (!entry.canBeDeleted()) {
			throw new Error("Solo se pueden eliminar asientos en borrador");
		}

		// 3. Delete entry
		await this.journalRepository.delete(id);
	}
}

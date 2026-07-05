/**
 * Update Journal Entry Status Use Case
 * Orchestrates status transitions (mayorizar, declarar)
 */

import type { JournalEntry } from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";

/**
 * UpdateJournalEntryStatusUseCase class.
 *
 * @example
 * ```ts
 * const value = new UpdateJournalEntryStatusUseCase();
 * console.log(value);
 * ```
 */
export class UpdateJournalEntryStatusUseCase {
	constructor(private readonly journalRepository: JournalEntryRepository) {}

	async execute(
		id: string,
		newStatus: "mayorizado" | "declarado",
		userId: string,
	): Promise<JournalEntry> {
		// 1. Find existing entry
		const entry = await this.journalRepository.findById(id);
		if (!entry) {
			throw new Error("Asiento no encontrado");
		}

		// 2. Apply status transition using domain methods
		let updatedEntry: JournalEntry;

		if (newStatus === "mayorizado") {
			if (!entry.canBePosted()) {
				throw new Error(
					"Solo se pueden mayorizar asientos en borrador y balanceados",
				);
			}
			updatedEntry = entry.markAsPosted(userId);
		} else if (newStatus === "declarado") {
			if (!entry.canBeDeclared()) {
				throw new Error("Solo se pueden declarar asientos mayorizados");
			}
			updatedEntry = entry.markAsDeclared();
		} else {
			throw new Error(`Estado inválido: ${newStatus}`);
		}

		// 3. Persist changes
		await this.journalRepository.save(updatedEntry);

		return updatedEntry;
	}
}

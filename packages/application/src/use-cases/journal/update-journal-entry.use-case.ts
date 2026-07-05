/**
 * Update Journal Entry Use Case
 * Orchestrates the update of an existing journal entry
 */

import {
	type JournalEntry,
	JournalLine,
} from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import { randomUUID } from "crypto";
import {
	type UpdateJournalEntryDTO,
	UpdateJournalEntrySchema,
} from "../../dtos/journal/journal-entry.dto";
import type { AccountService } from "./create-journal-entry.use-case";

/**
 * UpdateJournalEntryUseCase class.
 *
 * @example
 * ```ts
 * const value = new UpdateJournalEntryUseCase();
 * console.log(value);
 * ```
 */
export class UpdateJournalEntryUseCase {
	constructor(
		private readonly journalRepository: JournalEntryRepository,
		private readonly accountService: AccountService,
	) {}

	async execute(
		id: string,
		input: UpdateJournalEntryDTO,
	): Promise<JournalEntry> {
		// 1. Validate input
		const validatedInput = UpdateJournalEntrySchema.parse(input);

		// 2. Find existing entry
		const existingEntry = await this.journalRepository.findById(id);
		if (!existingEntry) {
			throw new Error("Asiento no encontrado");
		}

		// 3. Check if can be modified
		if (!existingEntry.canBeModified()) {
			throw new Error("Solo se pueden editar asientos en borrador");
		}

		// 4. Create updated lines if provided
		let updatedLines: JournalLine[] | undefined;
		if (validatedInput.lines) {
			updatedLines = await Promise.all(
				validatedInput.lines.map(async (lineDTO) => {
					const account = await this.accountService.getById(lineDTO.accountId);
					if (!account) {
						throw new Error(`Cuenta no encontrada: ${lineDTO.accountId}`);
					}

					return JournalLine.create({
						id: randomUUID(),
						accountId: lineDTO.accountId,
						accountCode: account.code,
						accountName: account.name,
						description: lineDTO.description,
						debit: Money.fromAmount(lineDTO.debit, "PEN"),
						credit: Money.fromAmount(lineDTO.credit, "PEN"),
						documentType: lineDTO.documentType,
						documentNumber: lineDTO.documentNumber,
						dueDate: lineDTO.dueDate,
					});
				}),
			);
		}

		// 5. Update entry using domain method
		const updatedEntry = existingEntry.update({
			date: validatedInput.date,
			gloss: validatedInput.gloss,
			lines: updatedLines,
		});

		// 6. Persist changes
		await this.journalRepository.save(updatedEntry);

		return updatedEntry;
	}
}

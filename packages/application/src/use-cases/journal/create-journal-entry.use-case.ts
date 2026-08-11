/**
 * Create Journal Entry Use Case
 * Orchestrates the creation of a new journal entry
 */

import { randomUUID } from "node:crypto";
import {
	JournalEntry,
	JournalLine,
} from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
import { Money } from "@drenyra/domain/value-objects/Money";
import {
	type CreateJournalEntryDTO,
	CreateJournalEntrySchema,
} from "../../dtos/journal/journal-entry.dto";

// Account service interface (to fetch account details)
/**
 * AccountService interface.
 *
 * @example
 * ```ts
 * const value: AccountService = {} as AccountService;
 * console.log(value);
 * ```
 */
export interface AccountService {
	getById(id: string): Promise<{ code: string; name: string } | null>;
}

/**
 * CreateJournalEntryUseCase class.
 *
 * @example
 * ```ts
 * const value = new CreateJournalEntryUseCase();
 * console.log(value);
 * ```
 */
export class CreateJournalEntryUseCase {
	constructor(
		private readonly journalRepository: JournalEntryRepository,
		private readonly accountService: AccountService,
	) {}

	async execute(
		input: CreateJournalEntryDTO,
		_userId: string,
	): Promise<JournalEntry> {
		// 1. Validate input
		const validatedInput = CreateJournalEntrySchema.parse(input);

		// 2. Get next entry number
		const year = validatedInput.date.getFullYear();
		const entryNumber = await this.journalRepository.getNextEntryNumber(
			validatedInput.organizationId,
			year,
		);

		// 3. Create journal lines with account details
		const lines = await Promise.all(
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
					...(lineDTO.documentType !== undefined
						? { documentType: lineDTO.documentType }
						: {}),
					...(lineDTO.documentNumber !== undefined
						? { documentNumber: lineDTO.documentNumber }
						: {}),
					...(lineDTO.dueDate !== undefined
						? { dueDate: lineDTO.dueDate }
						: {}),
				});
			}),
		);

		// 4. Create journal entry entity
		const journalEntry = JournalEntry.create({
			id: randomUUID(),
			organizationId: validatedInput.organizationId,
			entryNumber,
			date: validatedInput.date,
			gloss: validatedInput.gloss,
			status: "borrador",
			lines,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		// 5. Persist to database
		await this.journalRepository.save(journalEntry);

		return journalEntry;
	}
}

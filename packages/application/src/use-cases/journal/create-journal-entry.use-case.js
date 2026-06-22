import { randomUUID } from "crypto";
import { CreateJournalEntrySchema, } from "../../dtos/journal/journal-entry.dto";
import { JournalEntry, JournalLine, } from "@arkelythex/domain/entities/JournalEntry";
import { Money } from "@arkelythex/domain/value-objects/Money";
export class CreateJournalEntryUseCase {
    journalRepository;
    accountService;
    constructor(journalRepository, accountService) {
        this.journalRepository = journalRepository;
        this.accountService = accountService;
    }
    async execute(input, _userId) {
        const validatedInput = CreateJournalEntrySchema.parse(input);
        const year = validatedInput.date.getFullYear();
        const entryNumber = await this.journalRepository.getNextEntryNumber(validatedInput.organizationId, year);
        const lines = await Promise.all(validatedInput.lines.map(async (lineDTO) => {
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
        }));
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
        await this.journalRepository.save(journalEntry);
        return journalEntry;
    }
}
//# sourceMappingURL=create-journal-entry.use-case.js.map
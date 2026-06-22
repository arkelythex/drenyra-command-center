import { type CreateJournalEntryDTO } from "../../dtos/journal/journal-entry.dto";
import { JournalEntry } from "@arkelythex/domain/entities/JournalEntry";
import type { JournalEntryRepository } from "@arkelythex/domain/repositories/journal-entry.repository";
export interface AccountService {
    getById(id: string): Promise<{
        code: string;
        name: string;
    } | null>;
}
export declare class CreateJournalEntryUseCase {
    private readonly journalRepository;
    private readonly accountService;
    constructor(journalRepository: JournalEntryRepository, accountService: AccountService);
    execute(input: CreateJournalEntryDTO, _userId: string): Promise<JournalEntry>;
}
//# sourceMappingURL=create-journal-entry.use-case.d.ts.map
import { JournalEntry } from "@drenyra/domain/entities/JournalEntry";
import type { JournalEntryFilters, JournalEntryRepository } from "@drenyra/domain/repositories/journal-entry.repository";
export declare class PostgresJournalEntryRepository implements JournalEntryRepository {
    save(entry: JournalEntry): Promise<void>;
    findById(id: string): Promise<JournalEntry | null>;
    findAll(organizationId: number): Promise<JournalEntry[]>;
    findWithFilters(filters: JournalEntryFilters): Promise<JournalEntry[]>;
    delete(id: string): Promise<void>;
    getNextEntryNumber(organizationId: number, year: number): Promise<string>;
    count(filters?: JournalEntryFilters): Promise<number>;
    countByAccountId(accountId: string): Promise<number>;
    private buildConditions;
    private getLines;
    private mapLine;
    private mapToDomain;
}
//# sourceMappingURL=postgres-journal-entry.repository.d.ts.map
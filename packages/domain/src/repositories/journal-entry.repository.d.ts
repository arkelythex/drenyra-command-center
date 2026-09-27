import type { JournalEntry } from "../entities/JournalEntry";
export type JournalEntryStatus = "borrador" | "mayorizado" | "declarado";
export interface JournalEntryFilters {
    readonly organizationId: number;
    readonly status?: JournalEntryStatus | "all";
    readonly dateFrom?: Date;
    readonly dateTo?: Date;
    readonly minAmount?: number;
    readonly maxAmount?: number;
    readonly documentNumber?: string;
}
export interface PaginationOptions {
    readonly limit?: number;
    readonly offset?: number;
}
export interface SortOptions {
    readonly field: "date" | "entryNumber" | "createdAt";
    readonly direction: "asc" | "desc";
}
export interface JournalEntryRepository {
    save(entry: JournalEntry): Promise<void>;
    findById(id: string): Promise<JournalEntry | null>;
    findAll(organizationId: number): Promise<JournalEntry[]>;
    findWithFilters(filters: JournalEntryFilters): Promise<JournalEntry[]>;
    delete(id: string): Promise<void>;
    getNextEntryNumber(organizationId: number, year: number): Promise<string>;
    count(filters?: JournalEntryFilters): Promise<number>;
    countByAccountId(accountId: string): Promise<number>;
}
//# sourceMappingURL=journal-entry.repository.d.ts.map
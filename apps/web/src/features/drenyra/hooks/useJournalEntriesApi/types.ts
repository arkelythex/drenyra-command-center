/**
 * Types for Journal Entries API hooks
 */

import type {
	JournalEntryResponseDTO,
	JournalEntryFiltersDTO,
} from "@arkelythex/application/dtos/journal/journal-entry.dto";

export type { JournalEntryResponseDTO, JournalEntryFiltersDTO };

// ─── UI Row Types ───────────────────────────────────────────

/** Transaction row shape consumed by LedgerEditableTable */
export interface JournalTxRow {
	id: string;
	entryNumber: string;
	date: string;
	gloss: string;
	cuenta: string;
	debe: number;
	haber: number;
	status: string;
}

/** JournalEntry with status display fields for JournalPendingList */
export interface JournalPendingRow {
	id: string;
	entryNumber: string;
	date: string;
	gloss: string;
	status: "borrador" | "mayorizado" | "declarado";
	totalDebit: number;
	totalCredit: number;
	linesCount: number;
}

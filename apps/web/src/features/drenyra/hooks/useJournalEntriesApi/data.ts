/**
 * Constants and mappers for Journal Entries API hooks
 */

import type {
	JournalEntryResponseDTO,
	JournalEntryFiltersDTO,
} from "./types";
import type { JournalTxRow, JournalPendingRow } from "./types";

// ─── Query Keys ─────────────────────────────────────────────

export const journalKeys = {
	all: (companyId: string) => ["journal", companyId] as const,
	lists: (companyId: string) => [...journalKeys.all(companyId), "list"] as const,
	list: (
		companyId: string,
		filters?: Partial<JournalEntryFiltersDTO>,
	) => [...journalKeys.lists(companyId), filters] as const,
	details: (companyId: string) =>
		[...journalKeys.all(companyId), "detail"] as const,
	detail: (companyId: string, id: string) =>
		[...journalKeys.details(companyId), id] as const,
};

// ─── Mappers ────────────────────────────────────────────────

export function toTxRow(dto: JournalEntryResponseDTO): JournalTxRow {
	// Flatten first line as representative row (or combine all lines)
	const firstLine = dto.lines[0];
	return {
		id: dto.id,
		entryNumber: dto.entryNumber,
		date: dto.date,
		gloss: dto.gloss,
		cuenta: firstLine
			? `${firstLine.accountCode} - ${firstLine.accountName}`
			: "-",
		debe: dto.totalDebit,
		haber: dto.totalCredit,
		status: dto.status,
	};
}

export function toPendingRow(dto: JournalEntryResponseDTO): JournalPendingRow {
	return {
		id: dto.id,
		entryNumber: dto.entryNumber,
		date: dto.date,
		gloss: dto.gloss,
		status: dto.status,
		totalDebit: dto.totalDebit,
		totalCredit: dto.totalCredit,
		linesCount: dto.lines.length,
	};
}

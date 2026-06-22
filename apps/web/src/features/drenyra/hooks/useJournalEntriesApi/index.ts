/**
 * useJournalEntriesApi — barrel
 *
 * Re-exports the exact same public API as the original single-file module.
 */

// Public types
export type { JournalTxRow, JournalPendingRow } from "./types";

// Query keys
export { journalKeys } from "./data";

// Hooks
export {
	useJournalEntries,
	useJournalEntry,
	useCreateJournalEntry,
	useUpdateJournalEntry,
	useDeleteJournalEntry,
	useMayorizarJournalEntry,
	useDeclararJournalEntry,
	usePendingJournalEntries,
} from "./hooks";

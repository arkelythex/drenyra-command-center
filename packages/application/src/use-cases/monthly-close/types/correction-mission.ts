/**
 * CorrectionMission types — Roll-forward corrections for closed periods.
 *
 * Design §8: Compensation entries invert original entries and target
 * the current open period. The closed period stays cerrado_final.
 */

/** A single compensating line: inverted from the original line */
export interface CompensatingLine {
  accountCode: string;
  description: string;
  debitCents: number;   // original creditCents
  creditCents: number;  // original debitCents
}

/** A compensating journal entry that reverses an original entry */
export interface CompensatingEntry {
  originalEntryId: string;
  correctionOf: string;  // references journal_entries.id
  date: string;
  description: string;
  lines: CompensatingLine[];
  totalDebits: number;
  totalCredits: number;
}

/** Intent payload for a correction mission */
export interface CorrectionMissionIntent {
  originalMissionId: string;
  originalPeriod: string;
  entriesToReverse: string[];
  reason: string;
  linkedReceiptId: string;
}

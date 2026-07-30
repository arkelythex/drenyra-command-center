/**
 * JournalEntryPostingService — Posts journal entries atomically within a transaction.
 *
 * Design §7.1: Operates within a passed Drizzle transaction (tx).
 * Posts one journal_entries row + N journal_entry_lines rows.
 * Validates: debits = credits per entry.
 */
import { journalEntries, journalEntryLines } from "@drenyra/persistence/schema";
import { eq, and, sql } from "drizzle-orm";
import type { DrizzleClient } from "@drenyra/persistence";

// ─── Input types ────────────────────────────────────────────────────────────

export interface JournalEntryLineInput {
  accountCode: string;
  description: string;
  debitCents: number;
  creditCents: number;
}

export interface PostJournalEntryParams {
  companyId: string;
  entryNumber: string;
  periodKey: string;
  date: string;
  gloss: string;
  status?: string;
  lines: JournalEntryLineInput[];
}

export interface PostedJournalEntry {
  id: string;
  entryNumber: string;
  periodKey: string;
  date: string;
  gloss: string;
  status: string;
}

// ─── JournalEntryPostingService ─────────────────────────────────────────────

export class JournalEntryPostingService {
  /**
   * Posts a single journal entry with its lines within a transaction.
   *
   * @param tx - The Drizzle transaction client (PostgresTransaction-like)
   * @param params - Entry data including lines
   * @returns The created journal entry
   * @throws Error if debits != credits
   */
  async post(
    tx: DrizzleClient,
    params: PostJournalEntryParams,
  ): Promise<PostedJournalEntry> {
    // ─── Validate debits = credits ──────────────────────────────────
    const totalDebits = params.lines.reduce((s, l) => s + l.debitCents, 0);
    const totalCredits = params.lines.reduce((s, l) => s + l.creditCents, 0);

    if (totalDebits !== totalCredits) {
      throw new Error(
        `UNBALANCED_ENTRY: debits=${totalDebits}, credits=${totalCredits}`,
      );
    }

    if (params.lines.length === 0) {
      throw new Error("ENTRY_HAS_NO_LINES: Cannot post a journal entry with zero lines");
    }

    // ─── Insert journal entry ───────────────────────────────────────
    const [entry] = await tx
      .insert(journalEntries)
      .values({
        companyId: params.companyId as any,
        entryNumber: params.entryNumber,
        periodKey: params.periodKey,
        date: new Date(params.date),
        gloss: params.gloss,
        status: (params.status ?? "mayorizado") as "borrador" | "mayorizado" | "declarado",
      })
      .returning();

    if (!entry) {
      throw new Error("Failed to insert journal entry");
    }

    // ─── Insert journal entry lines ─────────────────────────────────
    for (const line of params.lines) {
      await tx.insert(journalEntryLines).values({
        journalEntryId: entry.id,
        accountCode: line.accountCode,
        description: line.description,
        debitCents: line.debitCents,
        creditCents: line.creditCents,
      });
    }

    return {
      id: entry.id,
      entryNumber: entry.entryNumber,
      periodKey: entry.periodKey,
      date: entry.date instanceof Date ? entry.date.toISOString().split("T")[0] : String(entry.date),
      gloss: entry.gloss,
      status: entry.status,
    };
  }

  /**
   * Computes the next entry number for a given company and period.
   *
   * @param tx - The Drizzle transaction or DB client
   * @param companyId - The company ID
   * @param periodKey - The fiscal period in "YYYY-MM" format
   * @returns The next entry number (MAX(entry_number) + 1 or 1 if no entries)
   */
  async nextEntryNumber(
    tx: DrizzleClient,
    companyId: string,
    periodKey: string,
  ): Promise<string> {
    const rows = await tx
      .select({ entryNumber: journalEntries.entryNumber })
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.companyId, companyId as any),
          eq(journalEntries.periodKey, periodKey),
        ),
      );

    if (rows.length === 0) {
      return "AS-001";
    }

    // Extract numeric part and find max
    let maxNum = 0;
    for (const row of rows) {
      const match = row.entryNumber.match(/AS-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    const nextNum = maxNum + 1;
    return `AS-${String(nextNum).padStart(3, "0")}`;
  }
}

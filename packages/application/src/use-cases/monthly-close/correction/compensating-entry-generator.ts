/**
 * CompensatingEntryGenerator — Generates compensating entries for corrections.
 *
 * Design §8.2: Reads original journal entries + lines,
 * inverts debits/credits, targets the CURRENT open period.
 * The closed period stays cerrado_final.
 */
import { journalEntries, journalEntryLines } from "@drenyra/persistence/schema";
import { eq } from "drizzle-orm";
import type { DrizzleClient } from "@drenyra/persistence";
import type { CompensatingEntry, CompensatingLine } from "../types/correction-mission";

export class CompensatingEntryGenerator {
  constructor(private readonly db: DrizzleClient) {}

  /**
   * Generate compensating entries for a set of original journal entry IDs.
   *
   * @param originalEntryIds - Journal entry IDs to reverse
   * @param currentOpenPeriod - The current open period in "YYYY-MM" format
   * @returns Array of compensating entries ready to post
   */
  async generate(
    originalEntryIds: string[],
    currentOpenPeriod: string,
  ): Promise<CompensatingEntry[]> {
    const entries: CompensatingEntry[] = [];

    for (const entryId of originalEntryIds) {
      // Read original journal entry
      const [original] = await this.db
        .select()
        .from(journalEntries)
        .where(eq(journalEntries.id, entryId as any))
        .limit(1);

      if (!original) continue;

      // Read original lines
      const originalLines = await this.db
        .select()
        .from(journalEntryLines)
        .where(eq(journalEntryLines.journalEntryId, entryId as any));

      // Invert: debits become credits, credits become debits
      const compensatingLines: CompensatingLine[] = originalLines.map((l) => ({
        accountCode: l.accountCode,
        description: `Corrección: ${l.description}`,
        debitCents: l.creditCents,   // INVERTED
        creditCents: l.debitCents,   // INVERTED
      }));

      const totalDebits = compensatingLines.reduce((s, l) => s + l.debitCents, 0);
      const totalCredits = compensatingLines.reduce((s, l) => s + l.creditCents, 0);

      entries.push({
        originalEntryId: entryId,
        correctionOf: entryId,
        date: this.lastDayOfMonth(currentOpenPeriod),
        description: `Corrección del cierre ${original.periodKey}: ${original.gloss}`,
        lines: compensatingLines,
        totalDebits,
        totalCredits,
      });
    }

    return entries;
  }

  private lastDayOfMonth(period: string): string {
    const [y, m] = period.split("-").map(Number);
    const lastDay = new Date(y, m, 0); // day 0 of next month = last day of current
    return lastDay.toISOString().split("T")[0];
  }
}

/**
 * JournalEntryPostingService Tests — GREEN phase
 *
 * Tests the real implementation with a simplified mock Drizzle transaction.
 * Focuses on the service contract: balance validation, entry creation, line posting.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  JournalEntryPostingService,
  type PostJournalEntryParams,
} from "../journal-entry-posting.service";

// ─── Simple Drizzle mock builder ────────────────────────────────────────────

/** Builds a mock Drizzle tx that verifies call patterns. */
function mockTx(overrides?: {
  selectResult?: any[];
}) {
  const calls: string[] = [];
  const entries: any[] = [];
  const lines: any[] = [];

  // Mock returning() creates a "row" and adds to entries
  function makeReturning(data: any) {
    return vi.fn().mockImplementation(() => {
      const id = crypto.randomUUID();
      const row = { id, ...data };
      entries.push(row);
      return Promise.resolve([row]);
    });
  }

  // Mock values() for entries (calls returning)
  function makeEntryValues(data: any) {
    calls.push("entry-insert");
    return {
      returning: makeReturning(data),
    };
  }

  // Mock values() for lines (no returning called)
  function makeLineValues(data: any) {
    calls.push("line-insert");
    lines.push({ id: crypto.randomUUID(), ...data });
    return {
      returning: vi.fn(), // available but not called by implementation
    };
  }

  let entryInserted = false;

  const tx = {
    insert: vi.fn().mockImplementation((_table: any) => ({
      values: vi.fn().mockImplementation((data: any) => {
        // First insert is the journal entry (has entryNumber)
        // Subsequent inserts are lines (have accountCode/debitCents)
        if ("entryNumber" in data) {
          return makeEntryValues(data);
        }
        if ("accountCode" in data) {
          return makeLineValues(data);
        }
        // Fallback: first insert is entry
        if (!entryInserted) {
          entryInserted = true;
          return makeEntryValues(data);
        }
        return makeLineValues(data);
      }),
    })),
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(overrides?.selectResult ?? []),
      }),
    }),
  };

  return { tx, calls, entries, lines };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("JournalEntryPostingService", () => {
  let service: JournalEntryPostingService;

  beforeEach(() => {
    service = new JournalEntryPostingService();
  });

  // ─── GREEN-1: post() inserts journal entry + lines ───────────────────

  it("should post a journal entry with lines and return the entry", async () => {
    const { tx, entries } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Cierre mensual junio 2026",
      lines: [
        { accountCode: "681", description: "Depreciación", debitCents: 50000, creditCents: 0 },
        { accountCode: "391", description: "Depreciación acumulada", debitCents: 0, creditCents: 50000 },
      ],
    };

    const result = await service.post(tx as any, params);

    expect(result).toBeDefined();
    expect(result.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.entryNumber).toBe("AS-001");
    expect(result.periodKey).toBe("2026-06");
    expect(result.status).toBe("mayorizado");
    expect(entries.length).toBe(1);
    expect(tx.insert).toHaveBeenCalledTimes(3); // 1 entry + 2 lines
  });

  // ─── GREEN-2: post() rejects unbalanced entries ──────────────────────

  it("should throw UNBALANCED_ENTRY when debits != credits", async () => {
    const { tx } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Unbalanced test",
      lines: [
        { accountCode: "681", description: "Debit only", debitCents: 50000, creditCents: 0 },
      ],
    };

    await expect(service.post(tx as any, params)).rejects.toThrow("UNBALANCED_ENTRY");
    // insert should not be called for unbalanced entries
    expect(tx.insert).not.toHaveBeenCalled();
  });

  // ─── GREEN-3: post() rejects empty lines ────────────────────────────

  it("should throw ENTRY_HAS_NO_LINES when lines array is empty", async () => {
    const { tx } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Empty entry",
      lines: [],
    };

    await expect(service.post(tx as any, params)).rejects.toThrow("ENTRY_HAS_NO_LINES");
    expect(tx.insert).not.toHaveBeenCalled();
  });

  // ─── GREEN-4: post() uses custom status when provided ────────────────

  it("should use the provided status when specified", async () => {
    const { tx } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-002",
      periodKey: "2026-07",
      date: "2026-07-31",
      gloss: "Corrección",
      status: "borrador",
      lines: [
        { accountCode: "681", description: "Corrección DB", debitCents: 10000, creditCents: 0 },
        { accountCode: "391", description: "Corrección CR", debitCents: 0, creditCents: 10000 },
      ],
    };

    const result = await service.post(tx as any, params);
    expect(result.status).toBe("borrador");
  });

  // ─── GREEN-5: nextEntryNumber() returns AS-001 for empty period ─────

  it("should return AS-001 when no entries exist for the period", async () => {
    const { tx } = mockTx();

    const result = await service.nextEntryNumber(tx as any, "c-001", "2026-06");
    expect(result).toBe("AS-001");
  });

  // ─── GREEN-6: nextEntryNumber() returns AS-00N for existing entries ─

  it("should return AS-006 when highest existing entry is AS-005", async () => {
    const existingEntries = [
      { entryNumber: "AS-001" },
      { entryNumber: "AS-005" },
      { entryNumber: "AS-003" },
    ];

    const { tx } = mockTx({ selectResult: existingEntries });

    const result = await service.nextEntryNumber(tx as any, "c-001", "2026-06");
    expect(result).toBe("AS-006");
  });

  // ─── GREEN-7: post() inserts correct number of lines ─────────────────

  it("should insert exactly the number of lines provided", async () => {
    const { tx, lines } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Multi-line entry",
      lines: [
        { accountCode: "681", description: "Gasto 1", debitCents: 30000, creditCents: 0 },
        { accountCode: "391", description: "Contra 1", debitCents: 0, creditCents: 30000 },
        { accountCode: "682", description: "Gasto 2", debitCents: 20000, creditCents: 0 },
        { accountCode: "392", description: "Contra 2", debitCents: 0, creditCents: 20000 },
      ],
    };

    await service.post(tx as any, params);

    expect(lines.length).toBe(4);
  });

  // ─── TRIANGULATE: complex compound entry balances ────────────────────

  it("should handle entries with multiple debits and credits that balance", async () => {
    const { tx } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Complex compound entry",
      lines: [
        { accountCode: "681", description: "Gasto A", debitCents: 40000, creditCents: 0 },
        { accountCode: "682", description: "Gasto B", debitCents: 35000, creditCents: 0 },
        { accountCode: "683", description: "Gasto C", debitCents: 25000, creditCents: 0 },
        { accountCode: "391", description: "Contra A", debitCents: 0, creditCents: 60000 },
        { accountCode: "392", description: "Contra B", debitCents: 0, creditCents: 40000 },
      ],
    };

    const result = await service.post(tx as any, params);
    // 100000 debits == 100000 credits
    expect(result.id).toBeDefined();
  });

  // ─── REFACTOR-1: status defaults to "mayorizado" ─────────────────────

  it("should default status to 'mayorizado' when not specified", async () => {
    const { tx } = mockTx();

    const params: PostJournalEntryParams = {
      companyId: "c-001",
      entryNumber: "AS-001",
      periodKey: "2026-06",
      date: "2026-06-30",
      gloss: "Default status test",
      lines: [
        { accountCode: "681", description: "Test", debitCents: 1000, creditCents: 0 },
        { accountCode: "391", description: "Test", debitCents: 0, creditCents: 1000 },
      ],
    };

    const result = await service.post(tx as any, params);
    expect(result.status).toBe("mayorizado");
  });
});

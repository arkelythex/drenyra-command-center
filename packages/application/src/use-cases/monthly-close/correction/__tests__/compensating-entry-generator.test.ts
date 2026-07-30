import { describe, expect, it, vi, beforeEach } from "vitest";
import { CompensatingEntryGenerator } from "../compensating-entry-generator";

function selectChain(result: any) {
  const chain = Promise.resolve(result) as any;
  chain.from = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
}

describe("CompensatingEntryGenerator", () => {
  let generator: CompensatingEntryGenerator;
  let db: any;
  let selectCalls: any[];

  beforeEach(() => {
    selectCalls = [];
    db = {
      select: vi.fn().mockImplementation(() => {
        // First call: journal_entries, second: journal_entry_lines
        const idx = selectCalls.length;
        if (idx % 2 === 0) {
          selectCalls.push("entry");
          return selectChain([{
            id: "orig-entry-001",
            periodKey: "2026-06",
            gloss: "Cierre mensual junio 2026",
          }]);
        }
        selectCalls.push("lines");
        return selectChain([
          { accountCode: "681", description: "Gasto depreciación", debitCents: 50000, creditCents: 0 },
          { accountCode: "391", description: "Depreciación acumulada", debitCents: 0, creditCents: 50000 },
        ]);
      }),
    };
    generator = new CompensatingEntryGenerator(db);
  });

  it("should invert debits and credits for each line", async () => {
    const result = await generator.generate(["orig-entry-001"], "2026-07");
    expect(result.length).toBe(1);
    expect(result[0].lines[0].debitCents).toBe(0);   // original was 50000 debit → credit
    expect(result[0].lines[0].creditCents).toBe(50000);
    expect(result[0].lines[1].debitCents).toBe(50000); // original was 50000 credit → debit
    expect(result[0].lines[1].creditCents).toBe(0);
  });

  it("should set correctionOf to the original entry ID", async () => {
    const result = await generator.generate(["orig-entry-001"], "2026-07");
    expect(result[0].correctionOf).toBe("orig-entry-001");
  });

  it("should target the current open period, not the original", async () => {
    const result = await generator.generate(["orig-entry-001"], "2026-07");
    expect(result[0].date).toBe("2026-07-31"); // last day of July
  });

  it("should include the original period in the description", async () => {
    const result = await generator.generate(["orig-entry-001"], "2026-07");
    expect(result[0].description).toContain("Corrección del cierre");
    expect(result[0].description).toContain("2026-06");
  });

  it("should handle multiple original entries", async () => {
    // Override mock for 2 entries
    let callIdx = 0;
    db.select = vi.fn().mockImplementation(() => {
      const c = callIdx++;
      if (c === 0) return selectChain([{ id: "e1", periodKey: "2026-06", gloss: "Cierre A" }]);
      if (c === 1) return selectChain([
        { accountCode: "681", description: "Gasto", debitCents: 10000, creditCents: 0 },
        { accountCode: "391", description: "Contra", debitCents: 0, creditCents: 10000 },
      ]);
      if (c === 2) return selectChain([{ id: "e2", periodKey: "2026-06", gloss: "Cierre B" }]);
      return selectChain([
        { accountCode: "682", description: "Gasto 2", debitCents: 20000, creditCents: 0 },
        { accountCode: "392", description: "Contra 2", debitCents: 0, creditCents: 20000 },
      ]);
    });
    generator = new CompensatingEntryGenerator(db);

    const result = await generator.generate(["e1", "e2"], "2026-07");
    expect(result.length).toBe(2);
    expect(result[0].correctionOf).toBe("e1");
    expect(result[1].correctionOf).toBe("e2");
  });
});

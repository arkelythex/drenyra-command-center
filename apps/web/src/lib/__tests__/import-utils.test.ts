import { describe, expect, it } from "vitest";
import {
  BANK_FORMATS,
  detectDelimiter,
  detectHeaderRow,
  findColumnIndex,
  normalizeTxType,
  parseAmountLoose,
  parseCsvLine,
  parseCSV,
  parseDateLoose,
  parseFile,
} from "../import-utils";
import type { Delimiter } from "../import-utils";

describe("detectDelimiter", () => {
  it("detects comma-delimited lines", () => {
    expect(detectDelimiter("a,b,c")).toBe(",");
  });

  it("detects semicolon-delimited lines (more semicolons than commas)", () => {
    expect(detectDelimiter("a;b;c")).toBe(";");
  });

  it("detects tab-delimited lines", () => {
    expect(detectDelimiter("a\tb\tc")).toBe("\t");
  });

  it("prefers tab even when commas and semicolons exist", () => {
    expect(detectDelimiter("a\tb,c;d")).toBe("\t");
  });

  it("defaults to comma on single-column line", () => {
    expect(detectDelimiter("abc")).toBe(",");
  });

  it("defaults to comma when counts are equal", () => {
    expect(detectDelimiter("a,b;c")).toBe(",");
  });
});

describe("parseCsvLine", () => {
  it("splits simple values", () => {
    expect(parseCsvLine("a,b,c", ",")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace from values", () => {
    expect(parseCsvLine("a , b , c", ",")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted values with commas", () => {
    expect(parseCsvLine('a,"b,c",d', ",")).toEqual(["a", "b,c", "d"]);
  });

  it("handles escaped quotes inside quoted values", () => {
    expect(parseCsvLine('a,"b""c",d', ",")).toEqual(["a", 'b"c', "d"]);
  });

  it("handles semicolon delimiter", () => {
    expect(parseCsvLine("a;b;c", ";")).toEqual(["a", "b", "c"]);
  });

  it("handles tab delimiter", () => {
    expect(parseCsvLine("a\tb\tc", "\t")).toEqual(["a", "b", "c"]);
  });

  it("returns single-item array for no delimiter matches", () => {
    expect(parseCsvLine("abc", ",")).toEqual(["abc"]);
  });

  it("preserves empty trailing values", () => {
    expect(parseCsvLine("a,b,", ",")).toEqual(["a", "b", ""]);
  });
});

describe("parseCSV", () => {
  it("parses CSV content with header and rows", () => {
    const result = parseCSV("name,email\nAlice,alice@test.com\nBob,bob@test.com");
    expect(result.data).toEqual([
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ]);
    expect(result.errors).toEqual([]);
    expect(result.metadata.rowCount).toBe(2);
  });

  it("returns empty result for empty content", () => {
    const result = parseCSV("");
    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(result.metadata.rowCount).toBe(0);
  });

  it("auto-detects semicolon delimiter", () => {
    const result = parseCSV("name;email\nAlice;alice@test.com\nBob;bob@test.com");
    expect(result.data).toEqual([
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ]);
    expect(result.metadata.detectedDelimiter).toBe(";");
  });

  it("auto-detects tab delimiter", () => {
    const result = parseCSV("name\temail\nAlice\talice@test.com\nBob\tbob@test.com");
    expect(result.data).toEqual([
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ]);
    expect(result.metadata.detectedDelimiter).toBe("\t");
  });

  it("respects explicit delimiter option", () => {
    const result = parseCSV("name;email\nAlice;alice@test.com", { delimiter: ";" });
    expect(result.data).toEqual([{ name: "Alice", email: "alice@test.com" }]);
  });

  it("prevents header detection with hasHeader=false", () => {
    const result = parseCSV("name,email\nAlice,alice@test.com", { hasHeader: false });
    expect(result.data).toEqual([]);
  });

  it("uses mapRow to transform rows", () => {
    const result = parseCSV("name,email\nAlice,alice@test.com", {
      mapRow: (cols) => {
        if (cols[0] === "Alice") return { name: cols[0], email: cols[1] };
        return null;
      },
    });
    expect(result.data).toEqual([{ name: "Alice", email: "alice@test.com" }]);
  });

  it("captures errors from mapRow", () => {
    const result = parseCSV("name,email\nAlice,alice@test.com\nBob,bob@test.com", {
      mapRow: () => {
        throw new Error("bad row");
      },
    });
    expect(result.data).toEqual([]);
    expect(result.errors.length).toBe(2);
    expect(result.errors[0].message).toBe("bad row");
  });

  it("reports parseTimeMs as a number", () => {
    const result = parseCSV("a,b\n1,2");
    expect(result.metadata.parseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("skips empty lines by default", () => {
    const result = parseCSV("name,email\nAlice,alice@test.com\n\n\nBob,bob@test.com");
    expect(result.data).toEqual([
      { name: "Alice", email: "alice@test.com" },
      { name: "Bob", email: "bob@test.com" },
    ]);
    expect(result.metadata.rowCount).toBe(2);
  });
});

describe("parseFile", () => {
  it("parses CSV files", async () => {
    const file = new File(["name,email\nAlice,alice@test.com"], "test.csv", { type: "text/csv" });
    const result = await parseFile(file);
    expect(result.data).toEqual([{ name: "Alice", email: "alice@test.com" }]);
    expect(result.metadata.rowCount).toBe(1);
  });

  it("parses TSV files", async () => {
    const file = new File(["name\temail\nAlice\talice@test.com"], "test.tsv", { type: "text/tab-separated-values" });
    const result = await parseFile(file);
    expect(result.data).toEqual([{ name: "Alice", email: "alice@test.com" }]);
  });

  it("handles TSV by extension when MIME type is absent", async () => {
    const file = new File(["a\tb"], "data.tsv");
    const result = await parseFile(file);
    expect(result.metadata).toBeDefined();
  });

  it("returns error for unsupported formats", async () => {
    const file = new File(["data"], "file.xyz");
    const result = await parseFile(file);
    expect(result.data).toEqual([]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain(".xyz");
  });

  it("handles empty CSV files", async () => {
    const file = new File([""], "empty.csv", { type: "text/csv" });
    const result = await parseFile(file);
    expect(result.data).toEqual([]);
    expect(result.errors).toEqual([]);
  });
});

describe("parseDateLoose", () => {
  it("parses ISO date strings", () => {
    const d = parseDateLoose("2025-01-15");
    expect(d?.toISOString().startsWith("2025-01-15")).toBe(true);
  });

  it("parses DD/MM/YYYY format", () => {
    const d = parseDateLoose("15/01/2025");
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });

  it("parses DD-MM-YYYY format", () => {
    const d = parseDateLoose("15-01-2025");
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(15);
  });

  it("returns null for empty string", () => {
    expect(parseDateLoose("")).toBeNull();
  });

  it("returns null for invalid date", () => {
    expect(parseDateLoose("not-a-date")).toBeNull();
  });

  it("parses date with single-digit day/month via regex fallback", () => {
    const d = parseDateLoose("13/1/2025");
    expect(d?.getFullYear()).toBe(2025);
    expect(d?.getMonth()).toBe(0);
    expect(d?.getDate()).toBe(13);
  });
});

describe("parseAmountLoose", () => {
  it("parses simple decimal numbers", () => {
    expect(parseAmountLoose("1234.56")).toBe(1234.56);
  });

  it("parses European format (comma as decimal)", () => {
    expect(parseAmountLoose("1234,56")).toBe(1234.56);
  });

  it("parses with thousand separators (US format)", () => {
    expect(parseAmountLoose("1,234.56")).toBe(1234.56);
  });

  it("parses with thousand separators (European format)", () => {
    expect(parseAmountLoose("1.234,56")).toBe(1234.56);
  });

  it("parses negative values", () => {
    expect(parseAmountLoose("-1234.56")).toBe(-1234.56);
  });

  it("returns null for empty string", () => {
    expect(parseAmountLoose("")).toBeNull();
  });

  it("returns null for non-numeric values", () => {
    expect(parseAmountLoose("abc")).toBeNull();
  });

  it("strips currency symbols and whitespace", () => {
    expect(parseAmountLoose("  S/ 1,234.56  ")).toBe(1234.56);
  });
});

describe("normalizeTxType", () => {
  it("returns CREDIT for Spanish 'ABONO'", () => {
    expect(normalizeTxType("ABONO")).toBe("CREDIT");
  });

  it("returns CREDIT for English 'CREDIT'", () => {
    expect(normalizeTxType("CREDIT")).toBe("CREDIT");
  });

  it("returns CREDIT for 'HABER'", () => {
    expect(normalizeTxType("HABER")).toBe("CREDIT");
  });

  it("returns CREDIT for 'INGRESO'", () => {
    expect(normalizeTxType("INGRESO")).toBe("CREDIT");
  });

  it("returns DEBIT for Spanish 'CARGO'", () => {
    expect(normalizeTxType("CARGO")).toBe("DEBIT");
  });

  it("returns DEBIT for English 'DEBIT'", () => {
    expect(normalizeTxType("DEBIT")).toBe("DEBIT");
  });

  it("returns DEBIT for 'DEBE'", () => {
    expect(normalizeTxType("DEBE")).toBe("DEBIT");
  });

  it("returns DEBIT for 'EGRESO'", () => {
    expect(normalizeTxType("EGRESO")).toBe("DEBIT");
  });

  it("returns null for known mapping", () => {
    expect(normalizeTxType("")).toBeNull();
  });

  it("returns null for unknown value", () => {
    expect(normalizeTxType("UNKNOWN")).toBeNull();
  });
});

describe("findColumnIndex", () => {
  it("finds exact match by first candidate", () => {
    const headers = ["date", "description", "amount"];
    expect(findColumnIndex(headers, ["date", "fecha"])).toBe(0);
  });

  it("finds match by second candidate", () => {
    const headers = ["date", "fecha", "amount"];
    expect(findColumnIndex(headers, ["day", "fecha"])).toBe(1);
  });

  it("returns -1 when no match found", () => {
    const headers = ["a", "b", "c"];
    expect(findColumnIndex(headers, ["date", "fecha"])).toBe(-1);
  });

  it("is case insensitive", () => {
    const headers = ["Date", "Description"];
    expect(findColumnIndex(headers, ["date"])).toBe(0);
  });
});

describe("detectHeaderRow", () => {
  it("returns true when headers contain known words", () => {
    expect(detectHeaderRow(["date", "amount"])).toBe(true);
  });

  it("returns true for Spanish known words", () => {
    expect(detectHeaderRow(["fecha", "monto"])).toBe(true);
  });

  it("returns false for data-like rows", () => {
    expect(detectHeaderRow(["15/01/2025", "100"])).toBe(false);
  });
});

describe("BANK_FORMATS", () => {
  it("has all expected bank formats", () => {
    expect(Object.keys(BANK_FORMATS)).toEqual([
      "BCP",
      "BBVA",
      "INTERBANK",
      "SCOTIABANK",
      "GENERIC",
    ]);
  });

  it("each format has required fields", () => {
    for (const format of Object.values(BANK_FORMATS)) {
      expect(format).toHaveProperty("name");
      expect(format).toHaveProperty("delimiter");
      expect(format).toHaveProperty("dateFormat");
      expect(format).toHaveProperty("expectedColumns");
    }
  });

  it("BCP uses comma delimiter", () => {
    expect(BANK_FORMATS.BCP.delimiter).toBe(",");
  });

  it("BBVA uses semicolon delimiter", () => {
    expect(BANK_FORMATS.BBVA.delimiter).toBe(";");
    expect(BANK_FORMATS.BBVA.expectedColumns).toContain("fecha");
  });

  it("GENERIC has auto delimiter and no expected columns", () => {
    expect(BANK_FORMATS.GENERIC.delimiter).toBe("auto");
    expect(BANK_FORMATS.GENERIC.expectedColumns).toEqual([]);
  });
});

/**
 * Detect a likely delimiter from a header/sample line.
 *
 * @param sampleLine - A line of CSV text (usually the header)
 * @returns The chosen delimiter (`,` or `;` or tab)
 *
 * @example
 * ```ts
 * detectDelimiter("a;b;c"); // ";"
 * ```
 */
export function detectDelimiter(sampleLine: string): "," | ";" | "\t" {
  const comma = (sampleLine.match(/,/g) ?? []).length;
  const semi = (sampleLine.match(/;/g) ?? []).length;
  const tab = (sampleLine.match(/\t/g) ?? []).length;

  if (semi >= comma && semi >= tab) return ";";
  if (tab >= comma && tab >= semi) return "\t";
  return ",";
}

/**
 * Parse a CSV line handling quoted values.
 *
 * @param line - Raw CSV line
 * @param delimiter - Delimiter character (`,` or `;` or tab)
 * @returns Array of columns (trimmed)
 *
 * @example
 * ```ts
 * const cols = parseCsvLine('"a,b",c', ","); // ["a,b", "c"]
 * ```
 */
export function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  result.push(current);
  return result.map((s) => s.trim());
}

/**
 * Normalize a CSV header cell to a stable matching key.
 *
 * @param input - Header string (Spanish/English)
 * @returns Normalized key (lowercase, no accents, no spaces, alnum only)
 *
 * @example
 * ```ts
 * normalizeHeader("Fecha Operación"); // "fechaoperacion"
 * ```
 */
export function normalizeHeader(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .replace(/\s/g, "");
}

/**
 * Parse common banking date formats (Perú exports).
 *
 * Supports: `YYYY-MM-DD`, `DD/MM/YYYY`, `DD-MM-YYYY`, and best-effort `Date(...)`.
 *
 * @param input - Date string
 * @returns Parsed Date or null if invalid
 *
 * @example
 * ```ts
 * parseFlexibleDate("31/01/2026")?.toISOString().slice(0, 10); // "2026-01-31"
 * ```
 */
export function parseFlexibleDate(input: string): Date | null {
  const raw = input.trim();
  if (!raw) return null;

  // YYYY-MM-DD
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    const day = Number(iso[3]);
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]);
    const month = Number(dmy[2]);
    const year = Number(dmy[3]);
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  // MM/DD/YYYY (less common; fallback)
  const mdy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mdy) {
    const month = Number(mdy[1]);
    const day = Number(mdy[2]);
    const year = Number(mdy[3]);
    const d = new Date(year, month - 1, day);
    if (!Number.isNaN(d.getTime())) return d;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parse amounts from multiple formats (thousands/decimal separators).
 *
 * Accepts values like:
 * - `118.00`
 * - `1,234.56`
 * - `1.234,56`
 * - `S/ 118,00`
 *
 * @param input - Raw amount string
 * @returns Parsed number or null if invalid
 *
 * @example
 * ```ts
 * parseFlexibleAmount("S/ 1.234,56"); // 1234.56
 * ```
 */
export function parseFlexibleAmount(input: string): number | null {
  const raw = input.trim();
  if (!raw) return null;

  // Remove currency markers and spaces
  const cleaned = raw
    .replace(/[^\d.,-]/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  let normalized = cleaned;

  // If both separators exist, last one is the decimal separator.
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      // comma decimal, dot thousands
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // dot decimal, comma thousands
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (lastComma !== -1 && lastDot === -1) {
    // comma decimal
    normalized = cleaned.replace(",", ".");
  } else {
    // dot decimal or plain integer
    normalized = cleaned;
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

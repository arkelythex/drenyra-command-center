import type { ImportTransactionInput } from "../agentic-ledger.service";
import type { BankCsvParseResult } from "./types";
import {
  detectDelimiter,
  normalizeHeader,
  parseCsvLine,
  parseFlexibleAmount,
  parseFlexibleDate,
} from "./csv.utils";

/**
 * Parse a “Perú bank export” CSV using header-based heuristics.
 *
 * Designed to work across multiple Peruvian banks by looking for common Spanish headers:
 * - Fecha / Fecha operación / Fecha movimiento
 * - Descripción / Detalle / Concepto / Glosa
 * - Cargo / Abono OR Monto/Importe (+ optional Tipo)
 *
 * Use this when you have a bank-labeled format but the file is still a standard CSV export.
 *
 * @param csvText - Raw CSV text
 * @param label - Bank label for warnings (e.g., "INTERBANK")
 * @returns Normalized transactions + warnings
 *
 * @example
 * ```csv
 * Fecha,Descripción,Importe
 * 2026-01-31,PAGO, -118.00
 * ```
 */
export function parsePeruHeaderCsv(csvText: string, label: string): BankCsvParseResult {
  const trimmed = csvText.trim();
  if (!trimmed) return { transactions: [], warnings: ["Empty CSV"] };

  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length <= 1) return { transactions: [], warnings: ["CSV has no data rows"] };

  const delimiter = detectDelimiter(lines[0] ?? "");
  const header = parseCsvLine(lines[0] ?? "", delimiter).map(normalizeHeader);

  const idxDate = findHeaderIndex(header, [
    "fecha",
    "fechaoperacion",
    "fechadeoperacion",
    "fechamovimiento",
    "fechatransaccion",
    "fechavalor",
  ]);
  const idxDesc = findHeaderIndex(header, ["descripcion", "detalle", "concepto", "glosa"]);
  const idxCargo = findHeaderIndex(header, ["cargo", "debito", "egreso", "retiro", "debe"]);
  const idxAbono = findHeaderIndex(header, ["abono", "credito", "ingreso", "deposito", "haber"]);
  const idxMonto = findHeaderIndex(header, ["monto", "importe", "importeoperacion", "importeoperaciones"]);
  const idxTipo = findHeaderIndex(header, ["tipo", "tipomovimiento", "naturaleza"]);
  const idxRef = findHeaderIndex(header, ["nrooperacion", "numerooperacion", "operacion", "referencia"]);

  const warnings: string[] = [];
  if (idxDate === -1) warnings.push(`${label} CSV: date column not detected`);
  if (idxDesc === -1) warnings.push(`${label} CSV: description column not detected`);

  const out: ImportTransactionInput[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i] ?? "", delimiter);
    const dateRaw = idxDate >= 0 ? row[idxDate] ?? "" : "";
    const desc = idxDesc >= 0 ? row[idxDesc] ?? "" : "";
    const date = parseFlexibleDate(dateRaw);
    if (!date || !desc) continue;

    const ref = idxRef >= 0 ? (row[idxRef] ?? "").trim() : "";

    const cargo = idxCargo >= 0 ? parseFlexibleAmount(row[idxCargo] ?? "") : null;
    const abono = idxAbono >= 0 ? parseFlexibleAmount(row[idxAbono] ?? "") : null;
    const monto = idxMonto >= 0 ? parseFlexibleAmount(row[idxMonto] ?? "") : null;

    let amount: number | null = null;
    let type: "DEBIT" | "CREDIT" | null = null;

    if (cargo !== null || abono !== null) {
      if (cargo && cargo !== 0) {
        amount = Math.abs(cargo);
        type = "DEBIT";
      } else if (abono && abono !== 0) {
        amount = Math.abs(abono);
        type = "CREDIT";
      }
    } else if (monto !== null) {
      const typeHint = idxTipo >= 0 ? (row[idxTipo] ?? "").trim().toLowerCase() : "";
      if (typeHint) {
        if (/(cargo|debito|egreso|retiro|debe|d)/i.test(typeHint)) type = "DEBIT";
        if (/(abono|credito|ingreso|deposito|haber|c)/i.test(typeHint)) type = "CREDIT";
      }
      if (!type) type = monto < 0 ? "DEBIT" : "CREDIT";
      amount = Math.abs(monto);
    }

    if (!amount || !type) continue;

    out.push({
      date,
      description: desc.trim(),
      amount,
      type,
      reference: ref || undefined,
    });
  }

  return { transactions: out, warnings };
}

function findHeaderIndex(headers: string[], candidates: string[]): number {
  for (const cand of candidates) {
    const idx = headers.indexOf(cand);
    if (idx !== -1) return idx;
  }
  return -1;
}


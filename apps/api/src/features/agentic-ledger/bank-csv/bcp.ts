import { parsePeruHeaderCsv } from "./peru-header";
import type { BankCsvParseResult } from "./types";

/**
 * Parse BCP-style CSV exports (Perú).
 *
 * Strategy:
 * - Autodetect delimiter (`,` vs `;` vs tab)
 * - Use header-based column lookup
 * - Support either:
 *   - separate `cargo` and `abono` columns, or
 *   - a single `monto` column + optional `tipo`, or
 *   - signed amount (negative = DEBIT)
 *
 * @example
 * ```csv
 * Fecha;Descripción;Cargo;Abono;Nro Operación
 * 31/01/2026;PAGO PROVEEDOR;118.00;;OP-123
 * ```
 *
 * @param csvText - Raw CSV export text
 * @returns Normalized transactions + warnings
 */
export function parseBcpCsv(csvText: string): BankCsvParseResult {
	return parsePeruHeaderCsv(csvText, "BCP");
}

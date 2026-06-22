/**
 * @fileoverview Data export service supporting CSV, TSV, JSON, PDF, XLSX, and
 * encrypted exports. Built as an extensible plugin system so new formats can be
 * registered at runtime.
 *
 * **Design philosophy:**
 * - Core text-based formats (CSV/TSV/JSON) are generated client-side
 * - PDF/XLSX delegate to a server endpoint (`apiUrl`) — not yet implemented,
 *   will throw at runtime
 * - Encrypted exports require a 12+ character password — also not yet implemented
 * - Custom formats can be added via `registerPlugin()` without touching core
 *
 * **Error handling:**
 * - PDF, XLSX, and encrypted exports throw descriptive errors when called
 * - CSV/TSV add a UTF-8 BOM (`\uFEFF`) for Excel compatibility
 *
 * @see {@link registerPlugin} to add a custom export format
 * @see {@link exportData} the main export function
 */

import { buildDelimitedText } from "./export-utils";

/**
 * Supported export formats.
 * Extends the union with `string & {}` to allow custom registered formats
 * while keeping IDE autocompletion for built-in values.
 */
export type ExportFormat =
  | "csv"
  | "tsv"
  | "json"
  | "pdf"
  | "xlsx"
  | "encrypted"
  | (string & {});

/**
 * Defines a single column for tabular exports.
 */
export interface ExportColumn {
  /** Property key on the data row object */
  key: string;
  /** Human-readable column header shown in output */
  label: string;
}

/**
 * Full options for an export operation.
 */
export interface ExportDataOptions {
  /** Output filename (extension is appended automatically by the caller) */
  filename: string;
  /** Target format — one of the built-in formats or a registered custom format */
  format: ExportFormat;
  /** Array of row objects to export */
  data: Record<string, unknown>[];
  /** Column definitions; auto-detected from the first row when omitted */
  columns?: ExportColumn[];
  /**
   * Server URL for formats that require server-side generation (PDF, XLSX).
   * Required for PDF and XLSX; ignored for client-side formats.
   */
  apiUrl?: string;
  /**
   * Encryption password for `"encrypted"` format.
   * Must be at least 12 characters when used.
   */
  password?: string;
}

/**
 * Contract for a custom export plugin registered via {@link registerPlugin}.
 */
export interface ExportPlugin {
  /** Format identifier (must match `ExportFormat` used by callers) */
  format: ExportFormat;
  /** MIME type for the generated Blob */
  mimeType: string;
  /** File extension including the leading dot (e.g. `".parquet"`) */
  extension: string;
  /** Async function that produces the Blob from data and options */
  generate: (
    data: Record<string, unknown>[],
    options: ExportDataOptions,
  ) => Promise<Blob>;
}

/**
 * Readonly map of built-in format identifiers.
 * Use instead of magic strings: `EXPORT_FORMATS.CSV` instead of `"csv"`.
 */
export const EXPORT_FORMATS = {
  CSV: "csv",
  TSV: "tsv",
  JSON: "json",
  PDF: "pdf",
  XLSX: "xlsx",
  ENCRYPTED: "encrypted",
} as const;

const plugins = new Map<string, ExportPlugin>();

/**
 * Register a custom export plugin.
 *
 * Plugins are looked up before the built-in switch, so a plugin can override
 * a built-in format (e.g. replace CSV with a custom encoding).
 *
 * @param plugin - The plugin descriptor with `format`, `mimeType`, `extension`,
 *   and a `generate()` function
 *
 * @example
 * ```ts
 * registerPlugin({
 *   format: "parquet",
 *   mimeType: "application/octet-stream",
 *   extension: ".parquet",
 *   generate: async (data) => encodeParquet(data),
 * })
 * ```
 */
export function registerPlugin(plugin: ExportPlugin): void {
  plugins.set(plugin.format, plugin);
}

/**
 * Resolves column definitions for tabular exports.
 *
 * When `columns` is provided, returns it as-is.
 * Otherwise derives columns from the keys of the first data row.
 *
 * @param data - The row data array
 * @param columns - Optional explicit column definitions
 * @returns An array of `ExportColumn` — either the one provided or auto-derived
 *
 * @example
 * ```ts
 * const cols = resolveColumns(rows, [
 *   { key: "id", label: "ID" },
 * ])
 * ```
 */
export function resolveColumns(
  data: Record<string, unknown>[],
  columns?: ExportColumn[],
): ExportColumn[] {
  if (columns) return columns;
  if (data.length === 0) return [];
  return Object.keys(data[0]).map((key) => ({ key, label: key }));
}

/**
 * Main export function. Generates a Blob in the requested format.
 *
 * **Formats handled client-side:** CSV, TSV, JSON
 * **Formats delegated to a server:** PDF, XLSX (require `options.apiUrl`)
 * **Format with special requirements:** encrypted (requires 12+ char password)
 * **Custom formats:** checked via registered plugins first
 *
 * @param options - Export configuration including data, format, and format-specific options
 * @returns A Blob ready for download
 * @throws If the format requires a password shorter than 12 characters
 * @throws If the format requires `apiUrl` and it is not set
 * @throws If the format is unsupported
 *
 * @example
 * ```ts
 * const blob = await exportData({
 *   filename: "clientes",
 *   format: "csv",
 *   data: rows,
 *   columns: [{ key: "name", label: "Nombre" }],
 * })
 * downloadExport(blob, "clientes.csv")
 * ```
 *
 * @see {@link registerPlugin} to add a custom format
 * @see {@link downloadExport} to trigger a browser download
 */
export async function exportData(
  options: ExportDataOptions,
): Promise<Blob> {
  const { data, columns, password, format } = options;
  const resolved = resolveColumns(data, columns);
  const headers = resolved.map((c) => c.label);
  const rows = data.map((item) => resolved.map((c) => item[c.key]));

  if (plugins.has(format)) {
    const plugin = plugins.get(format)!;
    return plugin.generate(data, options);
  }

  switch (format) {
    case "csv": {
      const csv = buildDelimitedText(headers, rows, ",");
      return new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    }
    case "tsv": {
      const tsv = buildDelimitedText(headers, rows, "\t");
      return new Blob([`\uFEFF${tsv}`], {
        type: "text/tab-separated-values;charset=utf-8",
      });
    }
    case "json": {
      const formatted = JSON.stringify(data, null, 2);
      return new Blob([formatted], { type: "application/json;charset=utf-8" });
    }
    case "encrypted": {
      if (!password || password.trim().length < 12) {
        throw new Error(
          "Encryption password must be at least 12 characters",
        );
      }
      throw new Error("Encrypted export not implemented in export-service");
    }
    case "pdf": {
      if (!options.apiUrl) {
        throw new Error("PDF export requires an apiUrl");
      }
      throw new Error("PDF export not implemented in export-service");
    }
    case "xlsx": {
      if (!options.apiUrl) {
        throw new Error("XLSX export requires an apiUrl");
      }
      throw new Error("XLSX export not implemented in export-service");
    }
    default:
      throw new Error("Unsupported export format");
  }
}

/**
 * Triggers a browser download of a Blob.
 *
 * Creates a temporary `<a>` element with an object URL, clicks it, then
 * immediately cleans up. No-op on the server side (SSR-safe).
 *
 * @param blob - The Blob to download
 * @param filename - The filename the browser should suggest (include extension)
 *
 * @example
 * ```ts
 * const blob = await exportData({ ... })
 * downloadExport(blob, "reporte.csv")
 * ```
 */
export function downloadExport(blob: Blob, filename: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

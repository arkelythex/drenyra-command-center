/**
 * SUNAT document-line tax type for invoice items (GRAVADO/EXONERADO/INAFECTO).
 *
 * `@drenyra/domain`'s `CountryRuntime` has no tax-type enum — it only models
 * named `TaxRule`s (IGV, Renta, Detraccion), not the SUNAT document-line
 * concept of whether a line is taxed/exempt/not-subject. This stays
 * apps/web-local by design; it centralizes what `InvoiceLineItems.tsx`,
 * `EditInvoiceModal.tsx`, and `useInvoiceCalculations.ts` used to repeat as
 * inline `taxType === "GRAVADO"` string-literal checks.
 *
 * `TaxType` itself is re-exported from `api/invoicing/types.ts` (the
 * canonical wire-format definition) so there is exactly one type
 * declaration, not a parallel one.
 *
 * @module features/invoices/lib/tax-type
 */

import type { TaxType } from "../api/invoicing/types";

export type { TaxType };

/** Canonical tax-type values — use instead of repeating string literals. */
export const TAX_TYPE = {
	GRAVADO: "GRAVADO",
	EXONERADO: "EXONERADO",
	INAFECTO: "INAFECTO",
} as const satisfies Record<string, TaxType>;

/** Human-readable Spanish labels for UI display (dropdowns, summaries). */
export const TAX_TYPE_LABELS: Record<TaxType, string> = {
	GRAVADO: "Gravado",
	EXONERADO: "Exonerado",
	INAFECTO: "Inafecto",
};

/**
 * Whether a line item's tax type is subject to IGV.
 *
 * Only `GRAVADO` ("taxed") items carry IGV; `EXONERADO` ("exempt") and
 * `INAFECTO` ("not subject") do not. This is a pure name for the check
 * previously repeated inline as `taxType === "GRAVADO"`; it changes no
 * behavior.
 */
export function isTaxable(taxType: TaxType): boolean {
	return taxType === TAX_TYPE.GRAVADO;
}

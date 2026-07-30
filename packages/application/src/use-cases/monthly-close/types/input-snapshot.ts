/**
 * InputSnapshot type — frozen state of all data sources at close execution start.
 *
 * PR1 — Type foundations for Real Monthly Close Execution.
 */

export interface InputSnapshot {
  /** Fiscal period in YYYY-MM format */
  fiscalPeriod: string;

  /** Last journal entry sequence number, or null if no entries exist */
  ledgerVersion: number | null;

  /** Last invoice ID or count, or null if no invoices processed */
  invoiceDatasetVersion: number | null;

  /** Last completed reconciliation ID, or null if no reconciliations */
  bankReconciliationVersion: number | null;

  /** Source of exchange rates: sunat, bcrp, or manual */
  exchangeRateSource: string;

  /** Active tax regime and depreciation method version */
  jurisdictionPackageVersion: string;

  /** ISO 8601 timestamp of capture */
  capturedAt: string;
}

/**
 * Creates an InputSnapshot with default values for a company and period.
 * In PR1, this is a factory that produces the shape with null versions.
 * In PR2, this will be replaced by FreezeSnapshotStep which queries real DB state.
 */
export function captureInputSnapshot(
  _companyId: string,
  fiscalPeriod: string,
): InputSnapshot {
  return {
    fiscalPeriod,
    ledgerVersion: null,
    invoiceDatasetVersion: null,
    bankReconciliationVersion: null,
    exchangeRateSource: "sunat",
    jurisdictionPackageVersion: "PE-2026-v1",
    capturedAt: new Date().toISOString(),
  };
}

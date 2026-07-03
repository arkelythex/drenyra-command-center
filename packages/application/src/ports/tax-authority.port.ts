/**
 * TaxAuthorityPort — Pluggable interface for tax authority operations.
 *
 * Each LATAM country adapter (SUNAT/PE, SAT/MX, SII/CL, DIAN/CO) implements
 * this port, so the rest of the application never depends on a specific authority.
 *
 * Register adapters via `registerTaxAuthority()` from the adapter package.
 *
 * @module ports/tax-authority.port
 */

import type { CountryCode } from "@arkelythex/domain";
import type {
	CDRInfo,
	ConnectivityStatus,
	DocumentValidationResult,
	FiscalRecord,
	InvoiceSubmissionData,
	InvoiceSubmissionResult,
	RegisterDiscrepancy,
	RegisterSyncRequest,
	RegisterSyncResult,
	RegisterSyncStatus,
	TaxIdInfo,
} from "./tax-authority.types";

/**
 * TaxAuthorityPort interface.
 */
export interface TaxAuthorityPort {
	/** Country this adapter serves (e.g. "PE", "MX", "CL", "CO"). */
	readonly countryCode: CountryCode;

	/** Human-readable provider name (e.g. "SUNAT", "SAT", "SII", "DIAN"). */
	readonly providerName: string;

	/**
	 * Initialize the adapter (load credentials, warm caches, etc.).
	 * Must be called before any other method.
	 */
	initialize(): Promise<boolean>;

	// ─── Tax ID consultation ─────────────────────────────────────────

	/**
	 * Consult a tax ID (RUC in PE, RFC in MX, RUT in CL, NIT in CO).
	 * Returns normalized TaxIdInfo or throws on network error.
	 */
	consultTaxId(taxId: string): Promise<TaxIdInfo>;

	// ─── Invoice submission ──────────────────────────────────────────

	/**
	 * Submit an electronic invoice to the tax authority (via OSE/PSE).
	 * Returns the submission result including CDR when available.
	 */
	sendInvoice(data: InvoiceSubmissionData): Promise<InvoiceSubmissionResult>;

	/**
	 * Parse a CDR (Comprobante de Recepción / digital receipt) from base64.
	 * Synchronous — does not call any external API.
	 */
	parseCDR(cdrBase64: string): CDRInfo;

	// ─── Document validation ─────────────────────────────────────────

	/**
	 * Validate an electronic document (UBL 2.1 in PE, CFDI 4.0 in MX, DTE in CL).
	 * Returns validation errors and warnings without submitting.
	 */
	validateDocument(xml: string): Promise<DocumentValidationResult>;

	// ─── Connectivity ────────────────────────────────────────────────

	/**
	 * Check whether the authority/OSE is reachable.
	 */
	checkConnectivity(): Promise<ConnectivityStatus>;

	// ─── Register sync ───────────────────────────────────────────────

	/**
	 * Request a register download from the tax authority.
	 * Returns a ticket to check status (SIRE ticket in PE, CFDI consulta in MX).
	 */
	requestRegisterDownload(
		request: RegisterSyncRequest,
	): Promise<RegisterSyncStatus>;

	/**
	 * Check the status of a register download request.
	 */
	checkRegisterStatus(
		taxId: string,
		ticket: string,
	): Promise<RegisterSyncStatus>;

	/**
	 * Download a register file once ready.
	 * Returns the raw file content (usually ZIP) or null on failure.
	 */
	downloadRegisterFile(
		taxId: string,
		downloadCode: string,
	): Promise<Buffer | null>;

	/**
	 * Compare local records with authority records.
	 * Returns discrepancies found between the two sets.
	 */
	findDiscrepancies(
		localRecords: FiscalRecord[],
		authorityRecords: FiscalRecord[],
	): RegisterDiscrepancy[];

	/**
	 * Full sync workflow: request, wait, download, parse, compare.
	 */
	fullRegisterSync(
		request: RegisterSyncRequest,
		localRecords: FiscalRecord[],
		onProgress?: (status: RegisterSyncStatus) => void,
	): Promise<RegisterSyncResult>;
}

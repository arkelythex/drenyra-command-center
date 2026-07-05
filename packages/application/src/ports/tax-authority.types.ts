/**
 * TaxAuthority — Shared types for the pluggable TaxAuthority port.
 *
 * These types are country-agnostic. Each country adapter maps its own
 * fiscal authority concepts (SUNAT, SAT, SII, DIAN) into these uniform types.
 *
 * @module ports/tax-authority.types
 */

import type { CountryCode } from "@drenyra/domain";

// ─── Tax ID ───────────────────────────────────────────────────────────

export type TaxIdStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "UNKNOWN";

export interface TaxIdInfo {
	taxId: string;
	legalName: string;
	status: TaxIdStatus;
	taxIdType: string;
	countryCode: CountryCode;
	address?: string;
	registeredAt?: string;
}

// ─── Invoice submission ───────────────────────────────────────────────

export interface InvoiceSubmissionData {
	xmlContent: string;
	invoiceNumber: string;
	invoiceType: string;
	countryCode: CountryCode;
	issuerTaxId: string;
}

export type CDRStatus = "ACCEPTED" | "REJECTED" | "OBSERVED";

export interface CDRInfo {
	status: CDRStatus;
	code: string;
	message: string;
	rawContent?: string;
}

export interface InvoiceSubmissionResult {
	success: boolean;
	cdr?: CDRInfo;
	authorityCode?: string;
	authorityDescription?: string;
	error?: string;
	attemptsCount: number;
}

// ─── Document validation ──────────────────────────────────────────────

export interface DocumentValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

// ─── Connectivity ─────────────────────────────────────────────────────

export interface ConnectivityStatus {
	online: boolean;
	provider: string;
	message: string;
	checkedAt: string;
}

// ─── Register sync (generic — SIRE in PE, CFDI/SAT in MX, DTE/SII in CL) ─

export interface RegisterSyncRequest {
	taxId: string;
	period: string; // YYYYMM
	registerType: "SALES" | "PURCHASES";
	countryCode: CountryCode;
}

export type SyncStatus = "PENDING" | "PROCESSING" | "READY" | "ERROR";

export interface RegisterSyncStatus {
	ticket: string;
	status: SyncStatus;
	message?: string;
	progress?: number; // 0–100
}

export interface FiscalRecord {
	period: string;
	documentType: string;
	series: string;
	number: string;
	issuerTaxId: string;
	issuerName: string;
	issueDate: Date;
	currency: string;
	/** Monetary amount in cents (integer). Divide by 100 for display. */
	total: number;
	metadata?: Record<string, unknown>;
}

export type DiscrepancyType =
	| "MISSING_LOCAL"
	| "MISSING_AUTHORITY"
	| "AMOUNT_MISMATCH";

export interface RegisterDiscrepancy {
	type: DiscrepancyType;
	documentKey: string;
	localValue?: string;
	authorityValue?: string;
}

export interface RegisterSyncResult {
	success: boolean;
	ticket?: string;
	records?: FiscalRecord[];
	totalRecords?: number;
	discrepancies?: RegisterDiscrepancy[];
	error?: string;
}

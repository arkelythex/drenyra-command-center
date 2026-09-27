import type { CountryCode } from "@drenyra/domain";
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
export interface DocumentValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
export interface ConnectivityStatus {
    online: boolean;
    provider: string;
    message: string;
    checkedAt: string;
}
export interface RegisterSyncRequest {
    taxId: string;
    period: string;
    registerType: "SALES" | "PURCHASES";
    countryCode: CountryCode;
}
export type SyncStatus = "PENDING" | "PROCESSING" | "READY" | "ERROR";
export interface RegisterSyncStatus {
    ticket: string;
    status: SyncStatus;
    message?: string;
    progress?: number;
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
    total: number;
    metadata?: Record<string, unknown>;
}
export type DiscrepancyType = "MISSING_LOCAL" | "MISSING_AUTHORITY" | "AMOUNT_MISMATCH";
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
//# sourceMappingURL=tax-authority.types.d.ts.map
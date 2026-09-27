import type { CountryCode } from "@drenyra/domain";
import type { CDRInfo, ConnectivityStatus, DocumentValidationResult, FiscalRecord, InvoiceSubmissionData, InvoiceSubmissionResult, RegisterDiscrepancy, RegisterSyncRequest, RegisterSyncResult, RegisterSyncStatus, TaxIdInfo } from "./tax-authority.types";
export interface TaxAuthorityPort {
    readonly countryCode: CountryCode;
    readonly providerName: string;
    initialize(): Promise<boolean>;
    consultTaxId(taxId: string): Promise<TaxIdInfo>;
    sendInvoice(data: InvoiceSubmissionData): Promise<InvoiceSubmissionResult>;
    parseCDR(cdrBase64: string): CDRInfo;
    validateDocument(xml: string): Promise<DocumentValidationResult>;
    checkConnectivity(): Promise<ConnectivityStatus>;
    requestRegisterDownload(request: RegisterSyncRequest): Promise<RegisterSyncStatus>;
    checkRegisterStatus(taxId: string, ticket: string): Promise<RegisterSyncStatus>;
    downloadRegisterFile(taxId: string, downloadCode: string): Promise<Buffer | null>;
    findDiscrepancies(localRecords: FiscalRecord[], authorityRecords: FiscalRecord[]): RegisterDiscrepancy[];
    fullRegisterSync(request: RegisterSyncRequest, localRecords: FiscalRecord[], onProgress?: (status: RegisterSyncStatus) => void): Promise<RegisterSyncResult>;
}
//# sourceMappingURL=tax-authority.port.d.ts.map
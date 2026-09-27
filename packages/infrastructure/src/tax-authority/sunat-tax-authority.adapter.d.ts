import type { TaxAuthorityPort } from "@drenyra/application/ports/tax-authority.port";
import type { CDRInfo, ConnectivityStatus, DocumentValidationResult, FiscalRecord, InvoiceSubmissionData, InvoiceSubmissionResult, RegisterDiscrepancy, RegisterSyncRequest, RegisterSyncResult, RegisterSyncStatus, TaxIdInfo } from "@drenyra/application/ports/tax-authority.types";
import type { CountryCode } from "@drenyra/domain";
export declare class SunatTaxAuthorityAdapter implements TaxAuthorityPort {
    readonly countryCode: CountryCode;
    readonly providerName = "SUNAT";
    private client;
    private sireService;
    private ublParser;
    private organizationId;
    constructor(organizationId: number);
    initialize(): Promise<boolean>;
    consultTaxId(taxId: string): Promise<TaxIdInfo>;
    sendInvoice(data: InvoiceSubmissionData): Promise<InvoiceSubmissionResult>;
    parseCDR(cdrBase64: string): CDRInfo;
    private mapCDRStatus;
    validateDocument(xml: string): Promise<DocumentValidationResult>;
    checkConnectivity(): Promise<ConnectivityStatus>;
    requestRegisterDownload(request: RegisterSyncRequest): Promise<RegisterSyncStatus>;
    checkRegisterStatus(taxId: string, ticket: string): Promise<RegisterSyncStatus>;
    downloadRegisterFile(taxId: string, downloadCode: string): Promise<Buffer | null>;
    findDiscrepancies(localRecords: FiscalRecord[], authorityRecords: FiscalRecord[]): RegisterDiscrepancy[];
    fullRegisterSync(request: RegisterSyncRequest, localRecords: FiscalRecord[], onProgress?: (status: RegisterSyncStatus) => void): Promise<RegisterSyncResult>;
    private mapDiscrepancyType;
}
export declare function createSunatTaxAuthority(organizationId: number): Promise<SunatTaxAuthorityAdapter | null>;
//# sourceMappingURL=sunat-tax-authority.adapter.d.ts.map
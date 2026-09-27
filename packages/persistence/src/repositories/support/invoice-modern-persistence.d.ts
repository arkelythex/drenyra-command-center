import type { Invoice, InvoiceItem, InvoiceStatus } from "@drenyra/domain/entities/Invoice";
type ModularInvoiceStatus = "DRAFT" | "SENT" | "CANCELLED";
type ModularSunatStatus = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ANNULLED";
type ModularTaxType = "GRAVADO" | "EXONERADO";
type ModularInvoiceReadStatus = "DRAFT" | "SENT" | "CANCELLED";
type ModularSunatReadStatus = "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REJECTED" | "ANNULLED" | null;
export declare const mapInvoiceStatusToModularStatus: (status: InvoiceStatus) => ModularInvoiceStatus;
export declare const mapInvoiceStatusToSunatStatus: (status: InvoiceStatus) => ModularSunatStatus;
export declare const mapModularStatusToInvoiceStatus: (status: ModularInvoiceReadStatus, sunatStatus: ModularSunatReadStatus) => InvoiceStatus;
export declare const resolveInvoicePartnerIdentity: (invoice: Invoice, normalizedInvoiceId: string) => {
    taxId: string;
    partnerDocumentType: string;
};
export declare const mapInvoiceItemToModularInsert: (invoiceId: string, item: InvoiceItem) => {
    id: string;
    invoiceId: string;
    description: string;
    quantity: string;
    unitPrice: string;
    taxType: ModularTaxType;
    igvRate: string;
    subtotal: string;
    igvAmount: string;
    totalAmount: string;
    createdAt: Date;
};
export declare const formatInvoiceAmount: (amount: number) => string;
export {};
//# sourceMappingURL=invoice-modern-persistence.d.ts.map
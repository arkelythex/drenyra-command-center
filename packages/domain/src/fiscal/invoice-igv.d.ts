export interface UblTaxTotalEntry {
    readonly TaxAmount?: {
        readonly "#text"?: string;
    } | string;
    readonly TaxSubtotal?: {
        readonly TaxCategory?: {
            readonly TaxScheme?: {
                readonly ID?: string;
            };
        };
    };
}
export declare function extractIgvFromUbl(taxTotal: UblTaxTotalEntry | UblTaxTotalEntry[] | undefined, totalAmount: number): number;
//# sourceMappingURL=invoice-igv.d.ts.map
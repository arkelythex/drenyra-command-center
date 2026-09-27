export function extractIgvFromUbl(taxTotal, totalAmount) {
    let igvAmount = 0;
    if (Array.isArray(taxTotal)) {
        const igvTax = taxTotal.find((t) => t.TaxSubtotal?.TaxCategory?.TaxScheme?.ID === "1000" || t.TaxAmount);
        const taxAmount = igvTax?.TaxAmount;
        igvAmount = parseFloat((taxAmount && typeof taxAmount === "object"
            ? taxAmount["#text"]
            : taxAmount) || "0");
    }
    else if (taxTotal) {
        const taxAmount = taxTotal.TaxAmount;
        igvAmount = parseFloat((taxAmount && typeof taxAmount === "object"
            ? taxAmount["#text"]
            : taxAmount) || "0");
    }
    if (igvAmount === 0 && totalAmount > 0) {
        igvAmount = totalAmount - totalAmount / 1.18;
    }
    return igvAmount;
}
//# sourceMappingURL=invoice-igv.js.map
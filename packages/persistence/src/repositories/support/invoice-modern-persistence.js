const formatDecimal = (value) => value.toFixed(2);
export const mapInvoiceStatusToModularStatus = (status) => {
	switch (status) {
		case "SENT":
		case "ACCEPTED":
		case "REJECTED":
			return "SENT";
		case "CANCELLED":
			return "CANCELLED";
		default:
			return "DRAFT";
	}
};
export const mapInvoiceStatusToSunatStatus = (status) => {
	switch (status) {
		case "SENT":
			return "SUBMITTED";
		case "ACCEPTED":
			return "ACCEPTED";
		case "REJECTED":
			return "REJECTED";
		case "CANCELLED":
			return "ANNULLED";
		default:
			return "DRAFT";
	}
};
export const mapModularStatusToInvoiceStatus = (status, sunatStatus) => {
	if (status === "CANCELLED" || sunatStatus === "ANNULLED") {
		return "CANCELLED";
	}
	if (sunatStatus === "ACCEPTED") {
		return "ACCEPTED";
	}
	if (sunatStatus === "REJECTED") {
		return "REJECTED";
	}
	if (status === "SENT" || sunatStatus === "SUBMITTED") {
		return "SENT";
	}
	return "DRAFT";
};
export const resolveInvoicePartnerIdentity = (invoice, normalizedInvoiceId) => {
	const clientRuc = invoice.clientRUC?.toString();
	if (clientRuc) {
		return {
			taxId: clientRuc,
			partnerDocumentType: "RUC",
		};
	}
	const clientDni = invoice.clientDNI?.toString();
	if (clientDni) {
		return {
			taxId: clientDni,
			partnerDocumentType: "DNI",
		};
	}
	return {
		taxId: `ANON-${normalizedInvoiceId.slice(0, 15)}`,
		partnerDocumentType: "ANON",
	};
};
export const mapInvoiceItemToModularInsert = (invoiceId, item) => {
	const itemSubtotal = item.subtotal.getAmount();
	const itemIgv = item.igv.getAmount();
	const taxType = item.igv.isZero() ? "EXONERADO" : "GRAVADO";
	const igvRate =
		itemSubtotal > 0 ? formatDecimal((itemIgv / itemSubtotal) * 100) : "0.00";
	return {
		id: item.id,
		invoiceId,
		description: item.description,
		quantity: formatDecimal(item.quantity),
		unitPrice: formatDecimal(item.unitPrice.getAmount()),
		taxType,
		igvRate,
		subtotal: formatDecimal(item.subtotal.getAmount()),
		igvAmount: formatDecimal(item.igv.getAmount()),
		totalAmount: formatDecimal(item.total.getAmount()),
		createdAt: new Date(),
	};
};
export const formatInvoiceAmount = (amount) => formatDecimal(amount);


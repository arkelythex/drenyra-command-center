export function extractText(obj, ...paths) {
	for (const path of paths) {
		const keys = path.split(".");
		let current = obj;
		for (const key of keys) {
			if (current && typeof current === "object" && !Array.isArray(current)) {
				const nodeObj = current;
				current =
					nodeObj[`cbc:${key}`] || nodeObj[key] || nodeObj[`cac:${key}`];
			} else {
				current = undefined;
				break;
			}
		}
		if (current !== undefined && current !== null) {
			if (
				typeof current === "object" &&
				!Array.isArray(current) &&
				"#text" in current
			) {
				return String(current["#text"]);
			}
			if (typeof current !== "object") return String(current);
		}
	}
	return "";
}
export function extractNumber(obj, ...paths) {
	const text = extractText(obj, ...paths);
	const num = parseFloat(text);
	return Number.isNaN(num) ? 0 : num;
}
export function extractSupplierRuc(invoice) {
	const partyNode =
		invoice["cac:AccountingSupplierParty"] || invoice.AccountingSupplierParty;
	if (!partyNode || typeof partyNode !== "object" || Array.isArray(partyNode))
		return "";
	const party = partyNode["cac:Party"] || partyNode.Party;
	if (!party || typeof party !== "object" || Array.isArray(party)) return "";
	const partyIdNode =
		party["cac:PartyIdentification"] || party.PartyIdentification;
	if (
		!partyIdNode ||
		typeof partyIdNode !== "object" ||
		Array.isArray(partyIdNode)
	)
		return "";
	const idNode = partyIdNode["cbc:ID"] || partyIdNode.ID;
	return idNode
		? String(
				typeof idNode === "object" && "#text" in idNode
					? idNode["#text"]
					: idNode,
			)
		: "";
}
export function extractSupplierName(invoice) {
	const partyNode =
		invoice["cac:AccountingSupplierParty"] || invoice.AccountingSupplierParty;
	if (!partyNode || typeof partyNode !== "object" || Array.isArray(partyNode))
		return "";
	const party = partyNode["cac:Party"] || partyNode.Party;
	if (!party || typeof party !== "object" || Array.isArray(party)) return "";
	const legalName = party["cac:PartyLegalEntity"] || party.PartyLegalEntity;
	if (!legalName || typeof legalName !== "object" || Array.isArray(legalName))
		return "";
	const registrationName =
		legalName["cbc:RegistrationName"] || legalName.RegistrationName;
	return registrationName
		? String(
				typeof registrationName === "object" && "#text" in registrationName
					? registrationName["#text"]
					: registrationName,
			)
		: "";
}
export function extractCustomerRuc(invoice) {
	const partyNode =
		invoice["cac:AccountingCustomerParty"] || invoice.AccountingCustomerParty;
	if (!partyNode || typeof partyNode !== "object" || Array.isArray(partyNode))
		return "";
	const party = partyNode["cac:Party"] || partyNode.Party;
	if (!party || typeof party !== "object" || Array.isArray(party)) return "";
	const partyIdNode =
		party["cac:PartyIdentification"] || party.PartyIdentification;
	if (
		!partyIdNode ||
		typeof partyIdNode !== "object" ||
		Array.isArray(partyIdNode)
	)
		return "";
	const idNode = partyIdNode["cbc:ID"] || partyIdNode.ID;
	return idNode
		? String(
				typeof idNode === "object" && "#text" in idNode
					? idNode["#text"]
					: idNode,
			)
		: "";
}
export function extractCustomerName(invoice) {
	const partyNode =
		invoice["cac:AccountingCustomerParty"] || invoice.AccountingCustomerParty;
	if (!partyNode || typeof partyNode !== "object" || Array.isArray(partyNode))
		return "";
	const party = partyNode["cac:Party"] || partyNode.Party;
	if (!party || typeof party !== "object" || Array.isArray(party)) return "";
	const legalName = party["cac:PartyLegalEntity"] || party.PartyLegalEntity;
	if (!legalName || typeof legalName !== "object" || Array.isArray(legalName))
		return "";
	const registrationName =
		legalName["cbc:RegistrationName"] || legalName.RegistrationName;
	return registrationName
		? String(
				typeof registrationName === "object" && "#text" in registrationName
					? registrationName["#text"]
					: registrationName,
			)
		: "";
}
export function extractSubtotal(invoice) {
	const monetaryTotal =
		invoice["cac:LegalMonetaryTotal"] || invoice.LegalMonetaryTotal;
	if (
		!monetaryTotal ||
		typeof monetaryTotal !== "object" ||
		Array.isArray(monetaryTotal)
	)
		return 0;
	const lineExt =
		monetaryTotal["cbc:LineExtensionAmount"] ||
		monetaryTotal.LineExtensionAmount;
	return lineExt
		? parseFloat(
				String(
					typeof lineExt === "object" && "#text" in lineExt
						? lineExt["#text"]
						: lineExt,
				),
			) || 0
		: 0;
}
export function extractIGV(invoice) {
	const monetaryTotal =
		invoice["cac:LegalMonetaryTotal"] || invoice.LegalMonetaryTotal;
	if (
		!monetaryTotal ||
		typeof monetaryTotal !== "object" ||
		Array.isArray(monetaryTotal)
	)
		return 0;
	const taxTotal = invoice["cac:TaxTotal"] || invoice.TaxTotal;
	if (!taxTotal || typeof taxTotal !== "object" || Array.isArray(taxTotal))
		return 0;
	const taxAmt = taxTotal["cbc:TaxAmount"] || taxTotal.TaxAmount;
	return taxAmt
		? parseFloat(
				String(
					typeof taxAmt === "object" && "#text" in taxAmt
						? taxAmt["#text"]
						: taxAmt,
				),
			) || 0
		: 0;
}
export function extractTotal(invoice) {
	const monetaryTotal =
		invoice["cac:LegalMonetaryTotal"] || invoice.LegalMonetaryTotal;
	if (
		!monetaryTotal ||
		typeof monetaryTotal !== "object" ||
		Array.isArray(monetaryTotal)
	)
		return 0;
	const payableAmt =
		monetaryTotal["cbc:PayableAmount"] || monetaryTotal.PayableAmount;
	return payableAmt
		? parseFloat(
				String(
					typeof payableAmt === "object" && "#text" in payableAmt
						? payableAmt["#text"]
						: payableAmt,
				),
			) || 0
		: 0;
}
export function extractCurrency(invoice) {
	const monetaryTotal =
		invoice["cac:LegalMonetaryTotal"] || invoice.LegalMonetaryTotal;
	if (
		!monetaryTotal ||
		typeof monetaryTotal !== "object" ||
		Array.isArray(monetaryTotal)
	)
		return "PEN";
	const payableAmt =
		monetaryTotal["cbc:PayableAmount"] || monetaryTotal.PayableAmount;
	if (
		payableAmt &&
		typeof payableAmt === "object" &&
		!Array.isArray(payableAmt) &&
		"@_currencyID" in payableAmt
	) {
		return String(payableAmt["@_currencyID"]);
	}
	return "PEN";
}
export function extractItems(invoice) {
	const lines = invoice["cac:InvoiceLine"] || invoice.InvoiceLine;
	if (!lines) return [];
	const lineArray = Array.isArray(lines) ? lines : [lines];
	return lineArray.map((line) => {
		if (!line || typeof line !== "object" || Array.isArray(line)) {
			return { description: "", quantity: 0, unitPrice: 0, lineTotal: 0 };
		}
		const lineObj = line;
		const description = extractText(
			lineObj,
			"Item.Name",
			"Item.cbc:Name",
			"cbc:Name",
		);
		const quantity = extractNumber(
			lineObj,
			"InvoicedQuantity",
			"cbc:InvoicedQuantity",
		);
		const unitPrice = extractNumber(
			lineObj,
			"Price.PriceAmount",
			"Price.cbc:PriceAmount",
			"cbc:PriceAmount",
		);
		const lineTotal = extractNumber(
			lineObj,
			"LineExtensionAmount",
			"cbc:LineExtensionAmount",
		);
		const unitCode = extractText(
			lineObj,
			"InvoicedQuantity.@_unitCode",
			"cbc:InvoicedQuantity.@_unitCode",
		);
		const id = extractText(lineObj, "ID", "cbc:ID");
		return { id, description, quantity, unitCode, unitPrice, lineTotal };
	});
}

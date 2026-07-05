import type { MockCpeRow } from "./cpe-validator.mock";

interface CpeValidationRequestBody {
	companyRuc: string;
	cpeNumber: string;
	xmlContent: string;
	issueDate: string;
	totalAmount: number;
	skipCache: boolean;
}

const DEFAULT_COMPANY_RUC = "20100070970";
const SANDBOX_REJECTED_RUC = "99999000009";

export function buildCpeValidationRequest(
	row: MockCpeRow,
): CpeValidationRequestBody {
	const companyRuc = resolveCompanyRuc(row.sunatCode);
	const cpeNumber = resolveCpeNumber(row);

	return {
		companyRuc,
		cpeNumber,
		xmlContent: buildDemoCpeXml({
			companyRuc,
			cpeNumber,
			issueDate: row.date,
			totalAmount: row.amount,
		}),
		issueDate: row.date,
		totalAmount: row.amount,
		skipCache: true,
	};
}

function resolveCompanyRuc(code?: string): string {
	return code === "2320" ? SANDBOX_REJECTED_RUC : DEFAULT_COMPANY_RUC;
}

function resolveCpeNumber(row: MockCpeRow): string {
	switch (row.sunatCode) {
		case "0101":
			return withCorrelative(row.document, "00007777");
		case "4040":
			return withCorrelative(row.document, "00006666");
		case "0":
			return withCorrelative(row.document, "00009999");
		default:
			return normalizeCpeNumber(row.document);
	}
}

function normalizeCpeNumber(value: string): string {
	const match = value
		.trim()
		.toUpperCase()
		.match(/^([A-Z0-9]{4})-(\d{1,8})$/);
	if (!match) {
		return "F001-00001234";
	}

	return `${match[1]}-${match[2].padStart(8, "0")}`;
}

function withCorrelative(value: string, correlative: string): string {
	const normalized = normalizeCpeNumber(value);
	return `${normalized.slice(0, 4)}-${correlative}`;
}

function buildDemoCpeXml(input: {
	companyRuc: string;
	cpeNumber: string;
	issueDate: string;
	totalAmount: number;
}): string {
	const taxAmount = Math.max(input.totalAmount * 0.18, 0).toFixed(2);
	const payableAmount = input.totalAmount.toFixed(2);

	return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>${input.cpeNumber}</cbc:ID>
  <cbc:IssueDate>${input.issueDate}</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>${input.companyRuc}</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID>20987654326</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">${taxAmount}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:PayableAmount currencyID="PEN">${payableAmount}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;
}

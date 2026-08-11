/**
 * UBL 2.1 XML Generator for SUNAT
 * Generates valid electronic invoice XML
 *
 * @standard UBL 2.1 (ISO/IEC 19845)
 * @standard SUNAT - Superintendencia Nacional de Aduanas y de Administración Tributaria
 */

import {
	type InvoiceItem,
	type InvoiceNumber,
	MonetaryAmount,
	type RUC,
} from "./value-objects";

export interface InvoiceData {
	issuer: {
		ruc: RUC;
		name: string;
		address: string;
		district: string;
		province: string;
		department: string;
	};
	customer: {
		documentType: "RUC" | "DNI" | "CE" | "PAS";
		documentNumber: string;
		name: string;
		address?: string;
	};
	invoiceNumber: InvoiceNumber;
	issueDate: Date;
	dueDate?: Date;
	currency: "PEN" | "USD";
	items: InvoiceItem[];
	notes?: string;
}

export class UBLInvoiceGenerator {
	generate(data: InvoiceData): string {
		const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
        <sac:AdditionalInformation xmlns:sac="urn:sunat:names:specification:ubl:peru:schema:xsd:SunatAggregateComponents-1">
          ${this.generateAdditionalMonetaryTotals(data)}
        </sac:AdditionalInformation>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID schemeAgencyName="PE:SUNAT">2.0</cbc:CustomizationID>
  <cbc:ID>${data.invoiceNumber.toString()}</cbc:ID>
  <cbc:IssueDate>${this.formatDate(data.issueDate)}</cbc:IssueDate>
  ${data.dueDate ? `<cbc:DueDate>${this.formatDate(data.dueDate)}</cbc:DueDate>` : ""}
  <cbc:InvoiceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Documento" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01" listID="0101">01</cbc:InvoiceTypeCode>
  <cbc:Note languageLocaleID="1000"><![CDATA[${this.numberToWords(this.calculateTotal(data))}]]></cbc:Note>
  ${data.notes ? `<cbc:Note><![CDATA[${data.notes}]]></cbc:Note>` : ""}
  <cbc:DocumentCurrencyCode listID="ISO 4217 Alpha" listName="Currency" listAgencyName="United Nations Economic Commission for Europe">${data.currency}</cbc:DocumentCurrencyCode>
  
  ${this.generateSignature(data)}
  ${this.generateSupplierParty(data.issuer)}
  ${this.generateCustomerParty(data.customer)}
  ${this.generateTaxTotal(data)}
  ${this.generateLegalMonetaryTotal(data)}
  ${this.generateInvoiceLines(data)}
</Invoice>`;

		return xml;
	}

	private generateAdditionalMonetaryTotals(data: InvoiceData): string {
		const subtotal = this.calculateSubtotal(data);

		return `
      <sac:AdditionalMonetaryTotal>
        <cbc:ID>1001</cbc:ID>
        <cbc:PayableAmount currencyID="${data.currency}">${subtotal.toString()}</cbc:PayableAmount>
      </sac:AdditionalMonetaryTotal>
      <sac:AdditionalMonetaryTotal>
        <cbc:ID>1002</cbc:ID>
        <cbc:PayableAmount currencyID="${data.currency}">0.00</cbc:PayableAmount>
      </sac:AdditionalMonetaryTotal>
      <sac:AdditionalMonetaryTotal>
        <cbc:ID>1003</cbc:ID>
        <cbc:PayableAmount currencyID="${data.currency}">0.00</cbc:PayableAmount>
      </sac:AdditionalMonetaryTotal>
      <sac:AdditionalProperty>
        <cbc:ID>1000</cbc:ID>
        <cbc:Value>${this.numberToWords(this.calculateTotal(data))}</cbc:Value>
      </sac:AdditionalProperty>`;
	}

	private generateSignature(data: InvoiceData): string {
		return `
  <cac:Signature>
    <cbc:ID>${data.invoiceNumber.toString()}</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification>
        <cbc:ID>${data.issuer.ruc.toString()}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${data.issuer.name}]]></cbc:Name>
      </cac:PartyName>
    </cac:SignatoryParty>
    <cac:DigitalSignatureAttachment>
      <cac:ExternalReference>
        <cbc:URI>#Signature${data.invoiceNumber.toString().replace("-", "")}</cbc:URI>
      </cac:ExternalReference>
    </cac:DigitalSignatureAttachment>
  </cac:Signature>`;
	}

	private generateSupplierParty(issuer: InvoiceData["issuer"]): string {
		return `
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${issuer.ruc.toString()}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name><![CDATA[${issuer.name}]]></cbc:Name>
      </cac:PartyName>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${issuer.name}]]></cbc:RegistrationName>
        <cac:RegistrationAddress>
          <cbc:AddressTypeCode listAgencyName="PE:SUNAT" listName="Establecimientos anexos">0000</cbc:AddressTypeCode>
          <cbc:CitySubdivisionName>${issuer.district}</cbc:CitySubdivisionName>
          <cbc:CityName>${issuer.province}</cbc:CityName>
          <cbc:CountrySubentity>${issuer.department}</cbc:CountrySubentity>
          <cbc:District>${issuer.district}</cbc:District>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${issuer.address}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode listID="ISO 3166-1" listAgencyName="United Nations Economic Commission for Europe" listName="Country">PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>`;
	}

	private generateCustomerParty(customer: InvoiceData["customer"]): string {
		const docTypeMap: Record<string, string> = {
			RUC: "6",
			DNI: "1",
			CE: "4",
			PAS: "7",
		};

		return `
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${docTypeMap[customer.documentType]}" schemeName="Documento de Identidad" schemeAgencyName="PE:SUNAT" schemeURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06">${customer.documentNumber}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName><![CDATA[${customer.name}]]></cbc:RegistrationName>
        ${
					customer.address
						? `
        <cac:RegistrationAddress>
          <cac:AddressLine>
            <cbc:Line><![CDATA[${customer.address}]]></cbc:Line>
          </cac:AddressLine>
          <cac:Country>
            <cbc:IdentificationCode>PE</cbc:IdentificationCode>
          </cac:Country>
        </cac:RegistrationAddress>`
						: ""
				}
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>`;
	}

	private generateTaxTotal(data: InvoiceData): string {
		const igv = this.calculateIGV(data);

		return `
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${data.currency}">${igv.toString()}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="${data.currency}">${this.calculateSubtotal(data).toString()}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="${data.currency}">${igv.toString()}</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID schemeAgencyName="United Nations Economic Commission for Europe" schemeID="UN/ECE 5305" schemeName="Tax Category Identifier">S</cbc:ID>
        <cac:TaxScheme>
          <cbc:ID schemeAgencyName="PE:SUNAT" schemeID="UN/ECE 5153" schemeName="Tax Scheme Identifie">1000</cbc:ID>
          <cbc:Name>IGV</cbc:Name>
          <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>`;
	}

	private generateLegalMonetaryTotal(data: InvoiceData): string {
		const subtotal = this.calculateSubtotal(data);
		const total = this.calculateTotal(data);

		return `
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${subtotal.toString()}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${data.currency}">${total.toString()}</cbc:TaxInclusiveAmount>
    <cbc:AllowanceTotalAmount currencyID="${data.currency}">0.00</cbc:AllowanceTotalAmount>
    <cbc:ChargeTotalAmount currencyID="${data.currency}">0.00</cbc:ChargeTotalAmount>
    <cbc:PrepaidAmount currencyID="${data.currency}">0.00</cbc:PrepaidAmount>
    <cbc:PayableAmount currencyID="${data.currency}">${total.toString()}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>`;
	}

	private generateInvoiceLines(data: InvoiceData): string {
		return data.items
			.map((item, index) => {
				const subtotal = item.getSubtotal();
				const igv = item.getIGV();
				const total = item.getTotal();

				return `
  <cac:InvoiceLine>
    <cbc:ID>${index + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="NIU" unitCodeListAgencyName="United Nations Economic Commission for Europe" unitCodeListID="UN/ECE rec 20">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${data.currency}">${subtotal.toString()}</cbc:LineExtensionAmount>
    <cac:PricingReference>
      <cac:AlternativeConditionPrice>
        <cbc:PriceAmount currencyID="${data.currency}">${total.getAmount().toFixed(2)}</cbc:PriceAmount>
        <cbc:PriceTypeCode listAgencyName="PE:SUNAT" listName="Tipo de Precio" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16">01</cbc:PriceTypeCode>
      </cac:AlternativeConditionPrice>
    </cac:PricingReference>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${data.currency}">${igv.toString()}</cbc:TaxAmount>
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="${data.currency}">${subtotal.toString()}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="${data.currency}">${igv.toString()}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>S</cbc:ID>
          <cbc:Percent>${item.igvRate * 100}</cbc:Percent>
          <cbc:TaxExemptionReasonCode listAgencyName="PE:SUNAT" listName="Afectacion del IGV" listURI="urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07">10</cbc:TaxExemptionReasonCode>
          <cac:TaxScheme>
            <cbc:ID>1000</cbc:ID>
            <cbc:Name>IGV</cbc:Name>
            <cbc:TaxTypeCode>VAT</cbc:TaxTypeCode>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Description><![CDATA[${item.description}]]></cbc:Description>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${data.currency}">${item.unitPrice.toString()}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
			})
			.join("");
	}

	private calculateSubtotal(data: InvoiceData): MonetaryAmount {
		const total = data.items.reduce(
			(sum, item) => sum + item.getSubtotal().getAmount(),
			0,
		);
		return MonetaryAmount.create(total, data.currency);
	}

	private calculateIGV(data: InvoiceData): MonetaryAmount {
		const total = data.items.reduce(
			(sum, item) => sum + item.getIGV().getAmount(),
			0,
		);
		return MonetaryAmount.create(total, data.currency);
	}

	private calculateTotal(data: InvoiceData): MonetaryAmount {
		const total = data.items.reduce(
			(sum, item) => sum + item.getTotal().getAmount(),
			0,
		);
		return MonetaryAmount.create(total, data.currency);
	}

	private formatDate(date: Date): string {
		return date.toISOString().split("T")[0] ?? "";
	}

	private numberToWords(amount: MonetaryAmount): string {
		// Simplified - in production, use a complete number-to-words library
		const num = amount.getAmount();
		const intPart = Math.floor(num);
		const decimalPart = Math.round((num - intPart) * 100);

		return `SON: ${intPart.toLocaleString("es-PE")} CON ${decimalPart.toString().padStart(2, "0")}/100 ${amount.getCurrency() === "PEN" ? "SOLES" : "DÓLARES AMERICANOS"}`;
	}
}

export const ublInvoiceGenerator = new UBLInvoiceGenerator();

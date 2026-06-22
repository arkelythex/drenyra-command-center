/**
 * XML Generation Module
 * Handles UBL 2.1 XML generation for electronic invoices
 */

import { create } from 'xmlbuilder2';
import type { InvoiceXMLData } from './sunat-types';

/**
 * Generate UBL 2.1 XML for electronic invoice
 */
export function generateInvoiceXML(data: InvoiceXMLData): string {
  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Invoice', {
      'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    })
      .ele('cbc:UBLVersionID').txt('2.1').up()
      .ele('cbc:CustomizationID').txt('2.0').up()
      .ele('cbc:ID').txt(data.invoiceNumber).up()
      .ele('cbc:IssueDate').txt(data.issueDate.toISOString().split('T')[0]).up()
      .ele('cbc:DueDate').txt(data.dueDate.toISOString().split('T')[0]).up()
      .ele('cbc:InvoiceTypeCode').txt('01').up()
      .ele('cbc:DocumentCurrencyCode').txt(data.currency).up()
      
      // Supplier (Company)
      .ele('cac:AccountingSupplierParty')
        .ele('cac:Party')
          .ele('cac:PartyIdentification')
            .ele('cbc:ID', { schemeID: '6' }).txt(data.company.ruc).up()
          .up()
          .ele('cac:PartyLegalEntity')
            .ele('cbc:RegistrationName').txt(data.company.businessName).up()
          .up()
          .ele('cac:PartyTaxScheme')
            .ele('cbc:RegistrationName').txt(data.company.businessName).up()
            .ele('cbc:CompanyID', { schemeID: '6' }).txt(data.company.ruc).up()
          .up()
        .up()
      .up()
      
      // Customer
      .ele('cac:AccountingCustomerParty')
        .ele('cac:Party')
          .ele('cac:PartyIdentification')
            .ele('cbc:ID', { 
              schemeID: data.customer.taxId.length === 11 ? '6' : '1' 
            }).txt(data.customer.taxId).up()
          .up()
          .ele('cac:PartyLegalEntity')
            .ele('cbc:RegistrationName').txt(data.customer.legalName).up()
          .up()
        .up()
      .up()
      
      // Tax Total
      .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(data.igvAmount.toFixed(2)).up()
        .ele('cac:TaxSubtotal')
          .ele('cbc:TaxableAmount', { currencyID: data.currency }).txt(data.subtotal.toFixed(2)).up()
          .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(data.igvAmount.toFixed(2)).up()
          .ele('cac:TaxCategory')
            .ele('cbc:ID').txt('S').up()
            .ele('cbc:Percent').txt('18.00').up()
            .ele('cac:TaxScheme')
              .ele('cbc:ID').txt('1000').up()
              .ele('cbc:Name').txt('IGV').up()
              .ele('cbc:TaxTypeCode').txt('VAT').up()
            .up()
          .up()
        .up()
      .up()
      
      // Legal Monetary Total
      .ele('cac:LegalMonetaryTotal')
        .ele('cbc:LineExtensionAmount', { currencyID: data.currency }).txt(data.subtotal.toFixed(2)).up()
        .ele('cbc:TaxInclusiveAmount', { currencyID: data.currency }).txt(data.totalAmount.toFixed(2)).up()
        .ele('cbc:PayableAmount', { currencyID: data.currency }).txt(data.totalAmount.toFixed(2)).up()
      .up();

  // Invoice Lines
  data.items.forEach((item, index) => {
    doc.ele('cac:InvoiceLine')
      .ele('cbc:ID').txt((index + 1).toString()).up()
      .ele('cbc:InvoicedQuantity', { unitCode: 'NIU' }).txt(item.quantity.toString()).up()
      .ele('cbc:LineExtensionAmount', { currencyID: data.currency }).txt(item.subtotal.toFixed(2)).up()
      .ele('cac:PricingReference')
        .ele('cac:AlternativeConditionPrice')
          .ele('cbc:PriceAmount', { currencyID: data.currency }).txt(item.totalAmount.toFixed(2)).up()
          .ele('cbc:PriceTypeCode').txt('01').up()
        .up()
      .up()
      .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(item.igvAmount.toFixed(2)).up()
        .ele('cac:TaxSubtotal')
          .ele('cbc:TaxableAmount', { currencyID: data.currency }).txt(item.subtotal.toFixed(2)).up()
          .ele('cbc:TaxAmount', { currencyID: data.currency }).txt(item.igvAmount.toFixed(2)).up()
          .ele('cac:TaxCategory')
            .ele('cbc:ID').txt('S').up()
            .ele('cbc:Percent').txt('18.00').up()
            .ele('cac:TaxScheme')
              .ele('cbc:ID').txt('1000').up()
              .ele('cbc:Name').txt('IGV').up()
              .ele('cbc:TaxTypeCode').txt('VAT').up()
            .up()
          .up()
        .up()
      .up()
      .ele('cac:Item')
        .ele('cbc:Description').txt(item.description).up()
      .up()
      .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: data.currency }).txt(item.unitPrice.toFixed(2)).up()
      .up()
    .up();
  });

  return doc.end({ prettyPrint: true });
}

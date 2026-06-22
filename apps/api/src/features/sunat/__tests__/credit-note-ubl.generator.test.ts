import { describe, expect, it } from 'vitest';
import { generateCreditNoteXml } from '../xml/credit-note-ubl.generator';
import type { CreditNoteData } from '../types/ubl.types';

describe('Credit Note UBL Generator', () => {
  const validCreditNoteData: CreditNoteData = {
    id: 'FC01-00000001',
    ublVersionId: '2.1',
    customizationId: '2.0',
    creditNoteTypeCode: '07',
    documentCurrencyCode: 'PEN',
    issueDate: '2026-01-29',
    supplier: {
      ruc: '20123456789',
      legalName: 'EMPRESA DEMO SAC',
      address: {
        country: 'PE',
      },
    },
    customer: {
      ruc: '20987654321',
      legalName: 'CLIENTE EJEMPLO SRL',
    },
    taxTotals: [
      {
        taxAmount: 18,
        taxSubtotal: [],
      },
    ],
    legalMonetaryTotal: {
      lineExtensionAmount: 100,
      taxInclusiveAmount: 118,
      payableAmount: 118,
    },
    invoiceLines: [
      {
        id: '1',
        quantity: 1,
        unitCode: 'NIU',
        lineExtensionAmount: 100,
        unitPrice: 100,
        totalAmount: 118,
        taxAmount: 18,
        taxCategory: 'S',
        description: 'Servicio de Consultoría',
      },
    ],
    billingReference: {
      invoiceDocumentReference: {
        id: 'F001-00000001',
        issueDate: '2026-01-28',
      },
    },
    discrepancyResponse: {
      responseCode: '01',
      description: 'Anulación de la operación',
    },
  };

  it('should keep supplier identification as RUC even when documentType is provided', () => {
    const supplierWithExplicitDniType: CreditNoteData = {
      ...validCreditNoteData,
      supplier: {
        ...validCreditNoteData.supplier,
        documentType: '1',
      },
    };

    const { fileName, xml } = generateCreditNoteXml(supplierWithExplicitDniType);

    expect(fileName).toBe('20123456789-07-FC01-00000001.xml');
    expect(xml).toContain('<cbc:CreditNoteTypeCode>07</cbc:CreditNoteTypeCode>');
    expect(xml).toContain('<cbc:ID schemeID="6"');
    expect(xml).not.toContain('<cbc:ID schemeID="1">20123456789</cbc:ID>');
  });

  it('should allow customer DNI scheme for credit notes linked to boleta flows', () => {
    const customerWithDni: CreditNoteData = {
      ...validCreditNoteData,
      id: 'BC01-00000001',
      customer: {
        ruc: '12345678',
        documentType: '1',
        legalName: 'CLIENTE DNI',
      },
      billingReference: {
        invoiceDocumentReference: {
          id: 'B001-00000001',
          issueDate: '2026-01-28',
        },
      },
    };

    const { xml } = generateCreditNoteXml(customerWithDni);

    expect(xml).toContain('<cbc:ID>BC01-00000001</cbc:ID>');
    expect(xml).toContain('<cbc:ReferenceID>B001-00000001</cbc:ReferenceID>');
    expect(xml).toContain('<cbc:ID schemeID="1"');
    expect(xml).toContain('12345678');
    expect(xml).toContain('CLIENTE DNI');
  });

  it('should reject DNI customers for factura-linked credit notes', () => {
    const facturaLinkedDniCustomer: CreditNoteData = {
      ...validCreditNoteData,
      customer: {
        ruc: '12345678',
        documentType: '1',
        legalName: 'CLIENTE DNI',
      },
      billingReference: {
        invoiceDocumentReference: {
          id: 'F001-00000001',
          issueDate: '2026-01-28',
        },
      },
    };

    expect(() => {
      generateCreditNoteXml(facturaLinkedDniCustomer);
    }).toThrow(/DNI customers must reference a boleta/i);
  });

  it('should reject invalid DNI length for boleta-linked credit notes', () => {
    const invalidDniCustomer: CreditNoteData = {
      ...validCreditNoteData,
      id: 'BC01-00000001',
      customer: {
        ruc: '123',
        documentType: '1',
        legalName: 'CLIENTE DNI INVALIDO',
      },
      billingReference: {
        invoiceDocumentReference: {
          id: 'B001-00000001',
          issueDate: '2026-01-28',
        },
      },
    };

    expect(() => {
      generateCreditNoteXml(invalidDniCustomer);
    }).toThrow(/document number/i);
  });

  it('should reject invalid supplier RUC', () => {
    const invalidSupplier: CreditNoteData = {
      ...validCreditNoteData,
      supplier: {
        ...validCreditNoteData.supplier,
        ruc: '123',
      },
    };

    expect(() => {
      generateCreditNoteXml(invalidSupplier);
    }).toThrow(/RUC/i);
  });
});

/**
 * XML Signer Tests
 * Tests for XML digital signature operations (SUNAT 2026)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import forge from 'node-forge';
import {
  signXml,
  validateXmlSignature,
  extractSignatureValue,
} from '../xml-signer';
import type { Certificate } from '../certificate.handler';

describe('XML Signer', () => {
  let testCert: Certificate;

  beforeAll(() => {
    // Generate a test certificate for signing with proper attributes
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

    // Set subject and issuer with proper OIDs
    const subject = [
      { name: 'commonName', value: 'Test Certificate', type: '2.5.4.3' },
      { name: 'organizationName', value: 'Test Organization', type: '2.5.4.10' },
      { name: 'countryName', value: 'PE', type: '2.5.4.6' },
    ];

    cert.setSubject(subject);
    cert.setIssuer(subject);

    // Self-sign the certificate
    cert.sign(keys.privateKey, forge.md.sha256.create());

    testCert = {
      privateKey: forge.pki.privateKeyToPem(keys.privateKey),
      publicCert: forge.pki.certificateToPem(cert),
      issuer: 'CN=Test Certificate, O=Test Organization, C=PE',
      subject: 'CN=Test Certificate, O=Test Organization, C=PE',
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
    };
  });

  // Sample UBL 2.1 invoice XML with ExtensionContent
  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent>
      </ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>F001-00000001</cbc:ID>
  <cbc:IssueDate>2024-01-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>PEN</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Test Supplier S.A.C.</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Test Customer S.A.C.</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="PEN">18.00</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="PEN">100.00</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="PEN">118.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="PEN">118.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
</Invoice>`;

  describe('signXml', () => {
    it('should sign a sample XML document with RSA-SHA256', () => {
      const signedXml = signXml(sampleXml, testCert);

      expect(signedXml).toBeDefined();
      expect(signedXml).toContain('Signature');
      expect(signedXml).toContain('SignedInfo');
      expect(signedXml).toContain('SignatureValue');
    });

    it('should insert signature in UBLExtensions/ExtensionContent', () => {
      const signedXml = signXml(sampleXml, testCert);

      // Parse the signed XML to verify structure
      expect(signedXml).toContain('<ext:ExtensionContent>');
      expect(signedXml).toContain('</ext:ExtensionContent>');

      // Signature should be inside ExtensionContent
      const extensionContentMatch = signedXml.match(
        /<ext:ExtensionContent>([\s\S]*?)<\/ext:ExtensionContent>/
      );
      expect(extensionContentMatch).toBeTruthy();
      expect(extensionContentMatch![1]).toContain('Signature');
    });

    it('should validate XML signature structure with KeyInfo and X509Certificate', () => {
      const signedXml = signXml(sampleXml, testCert);

      // Check for KeyInfo element
      expect(signedXml).toContain('KeyInfo');

      // Check for X509Data
      expect(signedXml).toContain('X509Data');

      // Check for X509Certificate
      expect(signedXml).toContain('X509Certificate');

      // Extract certificate content (should be base64)
      const certMatch = signedXml.match(/<ds:X509Certificate>([\s\S]*?)<\/ds:X509Certificate>/);
      expect(certMatch).toBeTruthy();
      expect(certMatch![1].length).toBeGreaterThan(0);
    });

    it('should include ds namespace prefix for signature elements', () => {
      const signedXml = signXml(sampleXml, testCert);

      expect(signedXml).toContain('ds:Signature');
      expect(signedXml).toContain('ds:SignedInfo');
      expect(signedXml).toContain('ds:SignatureValue');
      expect(signedXml).toContain('ds:DigestValue');
    });

    it('should throw error when ExtensionContent is not found', () => {
      const invalidXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-00000001</cbc:ID>
</Invoice>`;

      expect(() => {
        signXml(invalidXml, testCert);
      }).toThrow('ExtensionContent not found');
    });

    it('should throw error with invalid certificate', () => {
      const invalidCert: Certificate = {
        ...testCert,
        privateKey: 'invalid private key',
      };

      expect(() => {
        signXml(sampleXml, invalidCert);
      }).toThrow('Failed to sign XML');
    });
  });

  describe('validateXmlSignature', () => {
    it('should validate a valid signature', () => {
      const signedXml = signXml(sampleXml, testCert);
      const isValid = validateXmlSignature(signedXml, testCert.publicCert);

      expect(isValid).toBe(true);
    });

    it('should detect tampered document', () => {
      const signedXml = signXml(sampleXml, testCert);

      // Tamper with the signed XML by changing the invoice ID
      const tamperedXml = signedXml.replace('F001-00000001', 'F001-00000002');

      const isValid = validateXmlSignature(tamperedXml, testCert.publicCert);

      expect(isValid).toBe(false);
    });

    it('should return false for XML without signature', () => {
      const isValid = validateXmlSignature(sampleXml, testCert.publicCert);

      expect(isValid).toBe(false);
    });

    it('should return false for invalid XML', () => {
      const isValid = validateXmlSignature('not valid xml', testCert.publicCert);

      expect(isValid).toBe(false);
    });
  });

  describe('extractSignatureValue', () => {
    it('should extract signature value from signed XML', () => {
      const signedXml = signXml(sampleXml, testCert);
      const signatureValue = extractSignatureValue(signedXml);

      expect(signatureValue).toBeDefined();
      expect(signatureValue).not.toBeNull();
      expect(signatureValue!.length).toBeGreaterThan(0);
      // Signature value should be base64 encoded
      expect(signatureValue).toMatch(/^[A-Za-z0-9+/=]+$/);
    });

    it('should return null for unsigned XML', () => {
      const signatureValue = extractSignatureValue(sampleXml);

      expect(signatureValue).toBeNull();
    });

    it('should return null for invalid XML', () => {
      const signatureValue = extractSignatureValue('not valid xml');

      expect(signatureValue).toBeNull();
    });

    it('should extract unique signature values for different documents', () => {
      const signedXml1 = signXml(sampleXml, testCert);

      // Create slightly different XML
      const modifiedXml = sampleXml.replace('F001-00000001', 'F001-00000002');
      const signedXml2 = signXml(modifiedXml, testCert);

      const signatureValue1 = extractSignatureValue(signedXml1);
      const signatureValue2 = extractSignatureValue(signedXml2);

      expect(signatureValue1).not.toBe(signatureValue2);
    });
  });
});

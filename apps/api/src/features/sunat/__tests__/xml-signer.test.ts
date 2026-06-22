import { describe, it, expect, beforeAll } from 'vitest';
import forge from 'node-forge';
import { signXml, validateXmlSignature } from '../signature/xml-signer';
import type { Certificate } from '../signature/certificate.handler';

describe('XML Signer', () => {
  let mockCertificate: Certificate;

  beforeAll(() => {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date('2026-01-01');
    cert.validity.notAfter = new Date('2027-01-01');

    const subject = [
      { name: 'commonName', value: 'Test Certificate', type: '2.5.4.3' },
      { name: 'organizationName', value: 'Test Organization', type: '2.5.4.10' },
      { name: 'countryName', value: 'PE', type: '2.5.4.6' },
    ];

    cert.setSubject(subject);
    cert.setIssuer(subject);
    cert.sign(keys.privateKey, forge.md.sha256.create());

    mockCertificate = {
      privateKey: forge.pki.privateKeyToPem(keys.privateKey),
      publicCert: forge.pki.certificateToPem(cert),
      issuer: 'CN=Test Certificate, O=Test Organization, C=PE',
      subject: 'CN=Test Certificate, O=Test Organization, C=PE',
      validFrom: cert.validity.notBefore,
      validTo: cert.validity.notAfter,
    };
  });

  const sampleInvoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <ext:UBLExtensions>
    <ext:UBLExtension>
      <ext:ExtensionContent></ext:ExtensionContent>
    </ext:UBLExtension>
  </ext:UBLExtensions>
  <cbc:ID>F001-00000001</cbc:ID>
  <cbc:IssueDate>2026-01-29</cbc:IssueDate>
  <cbc:InvoiceTypeCode>01</cbc:InvoiceTypeCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">20123456789</cbc:ID>
      </cac:PartyIdentification>
    </cac:Party>
  </cac:AccountingSupplierParty>
</Invoice>`;

  describe('signXml', () => {
    it('should sign XML with digital signature', () => {
      const signedXml = signXml(sampleInvoiceXml, mockCertificate);

      expect(signedXml).toBeDefined();
      expect(signedXml).toContain('<ds:Signature');
      expect(signedXml).toContain('<ds:SignatureValue>');
      expect(signedXml).toContain('<ds:X509Certificate>');
    });

    it('should include signature in UBLExtensions', () => {
      const signedXml = signXml(sampleInvoiceXml, mockCertificate);

      expect(signedXml).toContain('ExtensionContent');
      expect(signedXml.indexOf('<ds:Signature')).toBeGreaterThan(
        signedXml.indexOf('ExtensionContent')
      );
    });

    it('should use RSA-SHA256 algorithm', () => {
      const signedXml = signXml(sampleInvoiceXml, mockCertificate);

      expect(signedXml).toContain('http://www.w3.org/2001/04/xmldsig-more#rsa-sha256');
    });

    it('should throw error for invalid XML', () => {
      const invalidXml = '<Invalid>Not properly closed';

      expect(() => {
        signXml(invalidXml, mockCertificate);
      }).toThrow();
    });
  });

  describe('validateXmlSignature', () => {
    it('should validate a correctly signed XML', () => {
      const signedXml = signXml(sampleInvoiceXml, mockCertificate);
      const isValid = validateXmlSignature(signedXml, mockCertificate.publicCert);

      expect(isValid).toBe(true);
    });

    it('should reject tampered XML', () => {
      const signedXml = signXml(sampleInvoiceXml, mockCertificate);
      const tamperedXml = signedXml.replace('F001-00000001', 'F001-99999999');

      const isValid = validateXmlSignature(tamperedXml, mockCertificate.publicCert);
      expect(isValid).toBe(false);
    });

    it('should reject XML without signature', () => {
      const isValid = validateXmlSignature(sampleInvoiceXml, mockCertificate.publicCert);
      expect(isValid).toBe(false);
    });
  });
});

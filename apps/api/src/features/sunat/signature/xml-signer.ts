/**
 * XML Digital Signature (SUNAT 2026)
 * Signs UBL 2.1 XML documents with digital certificate
 *
 * Standards:
 * - XML Signature (XMLDSig) - W3C standard
 * - Enveloped signature (signature dentro del XML)
 * - SUNAT requires signature in UBLExtensions
 */

import { SignedXml } from 'xml-crypto';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import type { Element as XmlDomElement } from '@xmldom/xmldom';
import { createLogger } from '../../../lib/logger';
import type { Certificate } from './certificate.handler';

const logger = createLogger({ module: 'sunat/signature/xml-signer' });

/**
 * Sign XML with digital certificate (enveloped signature)
 *
 * @param xml - Unsigned XML string
 * @param certificate - Certificate with private key
 * @returns Signed XML string
 * @throws {Error} If the XML cannot be signed or required nodes are missing
 *
 * @example
 * ```ts
 * const signed = signXml("<Invoice><ext:UBLExtensions><ext:UBLExtension><ext:ExtensionContent/></ext:UBLExtension></ext:UBLExtensions></Invoice>", cert);
 * ```
 */
export function signXml(xml: string, certificate: Certificate): string {
  try {
    if (!xml.includes('ExtensionContent')) {
      throw new Error('ExtensionContent not found in XML. Cannot add signature.');
    }

    // Parse XML
    const doc = new DOMParser().parseFromString(xml, 'text/xml');

    // Find UBLExtensions/UBLExtension/ExtensionContent
    // Support both namespaced (ext:ExtensionContent) and non-namespaced versions
    let extensionContent: XmlDomElement | null = null;

    // Try with namespace first (UBL 2.1 standard)
    extensionContent =
      (doc.getElementsByTagNameNS(
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
        'ExtensionContent',
      )[0] as XmlDomElement | undefined) ?? null;

    // Fallback: try without namespace or with ext: prefix
    if (!extensionContent) {
      extensionContent =
        (doc.getElementsByTagName('ExtensionContent')[0] as XmlDomElement | undefined) ??
        (doc.getElementsByTagName('ext:ExtensionContent')[0] as XmlDomElement | undefined) ??
        null;
    }
    
    if (!extensionContent) {
      throw new Error('ExtensionContent not found in XML. Cannot add signature.');
    }

    // Create signature with options
    const sig = new SignedXml({
      privateKey: certificate.privateKey,
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      canonicalizationAlgorithm: 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315',
    });

    // Add reference to root element with transforms (object syntax for xml-crypto 6.x)
    sig.addReference({
      xpath: '/*', // XPath to root
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature', // Enveloped
        'http://www.w3.org/TR/2001/REC-xml-c14n-20010315', // Canonicalization
      ],
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256', // SHA-256 digest
      uri: '',
      inclusiveNamespacesPrefixList: [],
      isEmptyUri: true,
    });

    // Compute signature and insert into ExtensionContent
    sig.computeSignature(xml, {
      prefix: 'ds',
      location: {
        reference: "//*[local-name(.)='ExtensionContent']",
        action: 'append',
      },
    });

    let signedXmlString = sig.getSignedXml();

    // Insert X509 certificate in KeyInfo
    signedXmlString = insertCertificateInSignature(signedXmlString, certificate.publicCert);

    return signedXmlString;
  } catch (error) {
    throw new Error(
      `Failed to sign XML: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Insert X509Certificate into Signature/KeyInfo
 * SUNAT requires the certificate in the signature
 */
function insertCertificateInSignature(signedXml: string, publicCert: string): string {
  const doc = new DOMParser().parseFromString(signedXml, 'text/xml');

  const signature = doc.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'Signature')[0];
  if (!signature) {
    throw new Error('Signature element not found in XML');
  }

  let keyInfo = doc.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'KeyInfo')[0];
  if (!keyInfo) {
    keyInfo = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:KeyInfo');
    const signedInfo = signature.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'SignedInfo')[0];
    if (signedInfo && signedInfo.parentNode) {
      signedInfo.parentNode.insertBefore(keyInfo, signedInfo.nextSibling);
    } else {
      signature.appendChild(keyInfo);
    }
  }

  // Extract certificate content (remove PEM headers)
  const certContent = publicCert
    .replace(/-----BEGIN CERTIFICATE-----/g, '')
    .replace(/-----END CERTIFICATE-----/g, '')
    .replace(/\n/g, '')
    .trim();

  // Create or update X509Certificate element
  let x509Certificate = keyInfo.getElementsByTagNameNS('http://www.w3.org/2000/09/xmldsig#', 'X509Certificate')[0];
  if (!x509Certificate) {
    const x509Data = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:X509Data');
    x509Certificate = doc.createElementNS('http://www.w3.org/2000/09/xmldsig#', 'ds:X509Certificate');
    x509Data.appendChild(x509Certificate);
    keyInfo.appendChild(x509Data);
  }
  x509Certificate.textContent = certContent;

  // Serialize back to string
  return new XMLSerializer().serializeToString(doc);
}

/**
 * Validate XML signature
 * Verifies that signature is valid
 *
 * @param signedXml - Signed XML string
 * @param publicCert - Public certificate in PEM format
 * @returns `true` if signature is valid, otherwise `false`
 * @throws {Error} If the signature element is missing (handled internally and returned as `false`)
 *
 * @example
 * ```ts
 * const ok = validateXmlSignature(signedXml, cert.publicCert);
 * ```
 */
export function validateXmlSignature(signedXml: string, publicCert: string): boolean {
  try {
    const doc = new DOMParser().parseFromString(signedXml, 'text/xml');
    const signature = doc.getElementsByTagNameNS(
      'http://www.w3.org/2000/09/xmldsig#',
      'Signature'
    )[0];

    if (!signature) {
      throw new Error('Signature not found in XML');
    }

    const sig = new SignedXml();
    // xml-crypto types use lib.dom `Node`; @xmldom elements satisfy the runtime contract.
    sig.loadSignature(signature as unknown as Node);
    sig.publicCert = publicCert;

    // Verify signature with public certificate
    const isValid = sig.checkSignature(signedXml);

    if (!isValid) {
      logger.error(
        {
          validationErrors: sig
            .getReferences()
            .map((ref) => ref.validationError?.message)
            .filter(Boolean),
        },
        'XML signature validation failed',
      );
    }

    return isValid;
  } catch (error) {
    logger.error({ error }, 'Failed to validate XML signature');
    return false;
  }
}

/**
 * Extract signature value from signed XML (for debugging)
 *
 * @param signedXml - Signed XML string
 * @returns SignatureValue content or `null`
 *
 * @example
 * ```ts
 * const value = extractSignatureValue(signedXml);
 * ```
 */
export function extractSignatureValue(signedXml: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(signedXml, 'text/xml');
    const signatureValue = doc.getElementsByTagNameNS(
      'http://www.w3.org/2000/09/xmldsig#',
      'SignatureValue'
    )[0];

    return signatureValue?.textContent || null;
  } catch {
    return null;
  }
}

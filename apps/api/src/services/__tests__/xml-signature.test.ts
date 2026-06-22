/**
 * XML Signature Service Tests
 */

import forge from "node-forge";
import { beforeAll, describe, expect, it } from "vitest";
import { XMLSignatureService } from "../sunat/xml/signature.service";

describe("XMLSignatureService", () => {
	let mockPrivateKey: string;
	let mockCertificate: string;

	const mockXML = `<?xml version="1.0"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID>F001-1</cbc:ID>
</Invoice>`;

	beforeAll(() => {
		const keys = forge.pki.rsa.generateKeyPair(2048);
		const cert = forge.pki.createCertificate();
		cert.publicKey = keys.publicKey;
		cert.serialNumber = "01";
		cert.validity.notBefore = new Date();
		cert.validity.notAfter = new Date();
		cert.validity.notAfter.setFullYear(
			cert.validity.notBefore.getFullYear() + 1,
		);

		const subject = [
			{ name: "commonName", value: "Test SUNAT Certificate" },
			{ name: "organizationName", value: "Test Organization" },
			{ name: "countryName", value: "PE" },
		];

		cert.setSubject(subject);
		cert.setIssuer(subject);
		cert.sign(keys.privateKey, forge.md.sha256.create());

		mockPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);
		mockCertificate = forge.pki.certificateToPem(cert);
	});

	it("returns signature components", () => {
		const result = XMLSignatureService.sign(mockXML, {
			privateKey: mockPrivateKey,
			certificate: mockCertificate,
		});

		expect(result.xml).toContain("<ds:Signature");
		expect(result.xml).toContain("<ds:SignatureValue>");
		expect(result.xml).toContain("<ds:X509Certificate>");
		expect(result.digestValue).toBeTruthy();
		expect(result.signatureValue).toBeTruthy();
	});

	it("injects signature into XML", () => {
		const result = XMLSignatureService.sign(mockXML, {
			privateKey: mockPrivateKey,
			certificate: mockCertificate,
		});

		expect(result.xml).toContain("<ds:Signature");
		expect(result.xml.indexOf("<ds:Signature")).toBeGreaterThan(
			result.xml.indexOf("<Invoice"),
		);
	});

	it("includes certificate in signature", () => {
		const result = XMLSignatureService.sign(mockXML, {
			privateKey: mockPrivateKey,
			certificate: mockCertificate,
		});

		expect(result.xml).not.toContain("-----BEGIN CERTIFICATE-----");
		expect(result.xml).toContain("<ds:X509Certificate>");
	});

	it("handles custom signature ID", () => {
		const result = XMLSignatureService.sign(mockXML, {
			privateKey: mockPrivateKey,
			certificate: mockCertificate,
			signatureId: "MyCustomSignature",
		});

		expect(result.xml).toContain('Id="MyCustomSignature"');
	});
});

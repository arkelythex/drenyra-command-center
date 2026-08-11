/**
 * Certificate Handler
 * Manages digital certificates for XML signing (SUNAT 2026)
 *
 * Certificate format: .PEM (Privacy Enhanced Mail)
 * Required by SUNAT for electronic invoicing
 */

import fs from "node:fs";
import forge from "node-forge";
import { createLogger } from "../../../lib/logger";

const logger = createLogger({ module: "sunat/signature/certificate-handler" });

/**
 * Certificate data structure
 *
 * @example
 * ```ts
 * const cert: Certificate = {
 *   privateKey: "-----BEGIN PRIVATE KEY-----...",
 *   publicCert: "-----BEGIN CERTIFICATE-----...",
 *   issuer: "CN=Issuer",
 *   subject: "CN=Subject",
 *   validFrom: new Date(),
 *   validTo: new Date(),
 * };
 * ```
 */
export interface Certificate {
	privateKey: string; // PEM format
	publicCert: string; // PEM format
	issuer: string;
	subject: string;
	validFrom: Date;
	validTo: Date;
}

/**
 * Load certificate from PFX/P12 file and convert to PEM
 *
 * @param pfxPath - Path to .pfx or .p12 file
 * @param password - Certificate password
 * @returns Certificate in PEM format
 * @throws {Error} If the PFX cannot be read or parsed
 *
 * @example
 * ```ts
 * const cert = loadCertificateFromPfx("/path/to/cert.pfx", "password");
 * ```
 */
export function loadCertificateFromPfx(
	pfxPath: string,
	password: string,
): Certificate {
	try {
		// Read PFX file
		const pfxBuffer = fs.readFileSync(pfxPath);
		const pfxBase64 = pfxBuffer.toString("base64");

		// Parse PFX with node-forge
		const p12Asn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64));
		const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

		// Extract private key
		const keyBags = p12.getBags({
			bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
		});
		const keyBagOid = forge.pki.oids.pkcs8ShroudedKeyBag;
		if (!keyBagOid) {
			throw new Error("No private key found in certificate");
		}
		const keyBag = keyBags[keyBagOid]?.[0];
		if (!keyBag) {
			throw new Error("No private key found in certificate");
		}
		const privateKey = forge.pki.privateKeyToPem(
			keyBag.key as forge.pki.PrivateKey,
		);

		// Extract certificate
		const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
		const certBagOid = forge.pki.oids.certBag;
		if (!certBagOid) {
			throw new Error("No certificate found in PFX");
		}
		const certBag = certBags[certBagOid]?.[0];
		if (!certBag) {
			throw new Error("No certificate found in PFX");
		}
		const cert = certBag.cert as forge.pki.Certificate;
		const publicCert = forge.pki.certificateToPem(cert);

		// Extract metadata
		const issuer = cert.issuer.attributes
			.map((attr) => `${attr.shortName}=${attr.value}`)
			.join(", ");
		const subject = cert.subject.attributes
			.map((attr) => `${attr.shortName}=${attr.value}`)
			.join(", ");

		return {
			privateKey,
			publicCert,
			issuer,
			subject,
			validFrom: cert.validity.notBefore,
			validTo: cert.validity.notAfter,
		};
	} catch (error) {
		throw new Error(
			`Failed to load certificate: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Load certificate from PEM files
 *
 * @param privateKeyPath - Path to private key .pem
 * @param certPath - Path to certificate .pem
 * @returns Certificate
 * @throws {Error} If the PEM files cannot be read or parsed
 *
 * @example
 * ```ts
 * const cert = loadCertificateFromPem("/path/key.pem", "/path/cert.pem");
 * ```
 */
export function loadCertificateFromPem(
	privateKeyPath: string,
	certPath: string,
): Certificate {
	try {
		const privateKey = fs.readFileSync(privateKeyPath, "utf8");
		const publicCert = fs.readFileSync(certPath, "utf8");

		// Parse certificate to extract metadata
		const cert = forge.pki.certificateFromPem(publicCert);

		const issuer = cert.issuer.attributes
			.map((attr) => `${attr.shortName}=${attr.value}`)
			.join(", ");
		const subject = cert.subject.attributes
			.map((attr) => `${attr.shortName}=${attr.value}`)
			.join(", ");

		return {
			privateKey,
			publicCert,
			issuer,
			subject,
			validFrom: cert.validity.notBefore,
			validTo: cert.validity.notAfter,
		};
	} catch (error) {
		throw new Error(
			`Failed to load PEM certificate: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}

/**
 * Validate certificate is still valid
 *
 * @param cert - Certificate to validate
 * @returns Validation result (boolean + error list)
 *
 * @example
 * ```ts
 * const result = validateCertificate(cert);
 * if (!result.isValid) console.error(result.errors);
 * ```
 */
export function validateCertificate(cert: Certificate): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const now = new Date();

	// Check validity period
	if (now < cert.validFrom) {
		errors.push(
			`Certificate not yet valid. Valid from: ${cert.validFrom.toISOString()}`,
		);
	}

	if (now > cert.validTo) {
		errors.push(
			`Certificate expired. Valid until: ${cert.validTo.toISOString()}`,
		);
	}

	// Warn if expiring soon (within 30 days)
	const thirtyDaysFromNow = new Date();
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
	if (now < cert.validTo && cert.validTo < thirtyDaysFromNow) {
		const daysRemaining = Math.floor(
			(cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
		);
		logger.warn(
			{ daysRemaining, subject: cert.subject },
			"Certificate expires soon",
		);
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Get certificate info for display
 *
 * @param cert - Certificate to inspect
 * @returns Display-friendly fields and days remaining
 *
 * @example
 * ```ts
 * const info = getCertificateInfo(cert);
 * console.log(info.daysRemaining);
 * ```
 */
export function getCertificateInfo(cert: Certificate): {
	subject: string;
	issuer: string;
	validFrom: string;
	validTo: string;
	daysRemaining: number;
} {
	const now = new Date();
	const daysRemaining = Math.floor(
		(cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);

	return {
		subject: cert.subject,
		issuer: cert.issuer,
		validFrom: cert.validFrom.toISOString().slice(0, 10),
		validTo: cert.validTo.toISOString().slice(0, 10),
		daysRemaining,
	};
}

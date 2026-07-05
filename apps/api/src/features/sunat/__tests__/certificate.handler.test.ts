import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import forge from "node-forge";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Certificate } from "../signature/certificate.handler";
import {
	loadCertificateFromPem,
	validateCertificate,
} from "../signature/certificate.handler";

describe("Certificate Handler", () => {
	// Avoid mutating tracked repo fixtures during tests.
	const testDir = mkdtempSync(join(tmpdir(), "drenyra-cert-fixtures-"));
	const privateKeyPath = join(testDir, "test-private.pem");
	const certPath = join(testDir, "test-cert.pem");

	let generatedPrivateKey = "";
	let generatedCert = "";

	beforeAll(() => {
		const keys = forge.pki.rsa.generateKeyPair(2048);
		const cert = forge.pki.createCertificate();
		cert.publicKey = keys.publicKey;
		cert.serialNumber = "01";
		cert.validity.notBefore = new Date("2026-01-01");
		cert.validity.notAfter = new Date("2027-01-01");

		const subject = [
			{ name: "commonName", value: "Test Certificate", type: "2.5.4.3" },
			{
				name: "organizationName",
				value: "Test Organization",
				type: "2.5.4.10",
			},
			{ name: "countryName", value: "PE", type: "2.5.4.6" },
		];

		cert.setSubject(subject);
		cert.setIssuer(subject);
		cert.sign(keys.privateKey, forge.md.sha256.create());

		generatedPrivateKey = forge.pki.privateKeyToPem(keys.privateKey);
		generatedCert = forge.pki.certificateToPem(cert);

		writeFileSync(privateKeyPath, generatedPrivateKey);
		writeFileSync(certPath, generatedCert);
	});

	afterAll(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	describe("loadCertificateFromPem", () => {
		it("should load certificate from PEM files", () => {
			const cert: Certificate = loadCertificateFromPem(
				privateKeyPath,
				certPath,
			);

			expect(cert).toBeDefined();
			expect(cert.privateKey).toContain("PRIVATE KEY");
			expect(cert.publicCert).toContain("BEGIN CERTIFICATE");
			expect(cert.issuer).toBeDefined();
			expect(cert.subject).toBeDefined();
		});

		it("should throw error for invalid paths", () => {
			expect(() => {
				loadCertificateFromPem("/invalid/path.pem", "/invalid/cert.pem");
			}).toThrow();
		});
	});

	describe("validateCertificate", () => {
		it("should validate a valid certificate", () => {
			const cert: Certificate = loadCertificateFromPem(
				privateKeyPath,
				certPath,
			);
			const validation = validateCertificate(cert);

			expect(validation).toBeDefined();
			expect(validation.isValid).toBe(true);
			expect(Array.isArray(validation.errors)).toBe(true);
		});

		it("should detect expired certificates", () => {
			const expiredCert: Certificate = {
				privateKey: generatedPrivateKey,
				publicCert: generatedCert,
				issuer: "Test Issuer",
				subject: "Test Subject",
				validFrom: new Date("2020-01-01"),
				validTo: new Date("2021-01-01"), // Expired
			};

			const validation = validateCertificate(expiredCert);
			expect(validation.isValid).toBe(false);
			expect(validation.errors.length).toBeGreaterThan(0);
			expect(validation.errors.some((e) => e.includes("expired"))).toBe(true);
		});

		it("should detect not-yet-valid certificates", () => {
			const futureCert: Certificate = {
				privateKey: generatedPrivateKey,
				publicCert: generatedCert,
				issuer: "Test Issuer",
				subject: "Test Subject",
				validFrom: new Date("2030-01-01"), // Future
				validTo: new Date("2031-01-01"),
			};

			const validation = validateCertificate(futureCert);
			expect(validation.isValid).toBe(false);
			expect(validation.errors.some((e) => e.includes("not yet valid"))).toBe(
				true,
			);
		});
	});
});

/**
 * Certificate Handler Tests
 * Tests for digital certificate operations (SUNAT 2026)
 */

import fs from "node:fs";
import forge from "node-forge";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockedFunction,
	vi,
} from "vitest";
import {
	type Certificate,
	getCertificateInfo,
	loadCertificateFromPem,
	validateCertificate,
} from "../certificate.handler";

// Mock fs module
vi.mock("fs", () => ({
	default: {
		readFileSync: vi.fn(),
	},
	readFileSync: vi.fn(),
}));

const { loggerWarnSpy } = vi.hoisted(() => ({
	loggerWarnSpy: vi.fn(),
}));

vi.mock("../../../../lib/logger", () => ({
	createLogger: vi.fn(() => ({
		warn: loggerWarnSpy,
	})),
}));

describe("Certificate Handler", () => {
	// Create a real test certificate using node-forge
	let testCert: Certificate;
	let expiredCert: Certificate;
	let expiringSoonCert: Certificate;

	beforeEach(() => {
		// Generate a valid test certificate with proper attributes
		const keys = forge.pki.rsa.generateKeyPair(2048);
		const cert = forge.pki.createCertificate();
		cert.publicKey = keys.publicKey;
		cert.serialNumber = "01";
		cert.validity.notBefore = new Date();
		cert.validity.notAfter = new Date();
		cert.validity.notAfter.setFullYear(
			cert.validity.notBefore.getFullYear() + 1,
		);

		// Set subject and issuer with proper OIDs
		// Use distinguished name for subject and issuer
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

		// Self-sign the certificate
		cert.sign(keys.privateKey, forge.md.sha256.create());

		testCert = {
			privateKey: forge.pki.privateKeyToPem(keys.privateKey),
			publicCert: forge.pki.certificateToPem(cert),
			issuer: "CN=Test Certificate, O=Test Organization, C=PE",
			subject: "CN=Test Certificate, O=Test Organization, C=PE",
			validFrom: cert.validity.notBefore,
			validTo: cert.validity.notAfter,
		};

		// Create expired certificate
		const expiredKeys = forge.pki.rsa.generateKeyPair(2048);
		const expiredCertificate = forge.pki.createCertificate();
		expiredCertificate.publicKey = expiredKeys.publicKey;
		expiredCertificate.serialNumber = "02";
		expiredCertificate.validity.notBefore = new Date("2020-01-01");
		expiredCertificate.validity.notAfter = new Date("2020-12-31");
		expiredCertificate.setSubject(subject);
		expiredCertificate.setIssuer(subject);
		expiredCertificate.sign(expiredKeys.privateKey, forge.md.sha256.create());

		expiredCert = {
			privateKey: forge.pki.privateKeyToPem(expiredKeys.privateKey),
			publicCert: forge.pki.certificateToPem(expiredCertificate),
			issuer: "CN=Test Certificate, O=Test Organization, C=PE",
			subject: "CN=Test Certificate, O=Test Organization, C=PE",
			validFrom: expiredCertificate.validity.notBefore,
			validTo: expiredCertificate.validity.notAfter,
		};

		// Create certificate expiring in 15 days
		const expiringKeys = forge.pki.rsa.generateKeyPair(2048);
		const expiringCertificate = forge.pki.createCertificate();
		expiringCertificate.publicKey = expiringKeys.publicKey;
		expiringCertificate.serialNumber = "03";
		expiringCertificate.validity.notBefore = new Date();
		expiringCertificate.validity.notAfter = new Date();
		expiringCertificate.validity.notAfter.setDate(
			expiringCertificate.validity.notBefore.getDate() + 15,
		);
		expiringCertificate.setSubject(subject);
		expiringCertificate.setIssuer(subject);
		expiringCertificate.sign(expiringKeys.privateKey, forge.md.sha256.create());

		expiringSoonCert = {
			privateKey: forge.pki.privateKeyToPem(expiringKeys.privateKey),
			publicCert: forge.pki.certificateToPem(expiringCertificate),
			issuer: "CN=Test Certificate, O=Test Organization, C=PE",
			subject: "CN=Test Certificate, O=Test Organization, C=PE",
			validFrom: expiringCertificate.validity.notBefore,
			validTo: expiringCertificate.validity.notAfter,
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
		loggerWarnSpy.mockReset();
	});

	describe("loadCertificateFromPem", () => {
		it("should load certificate from PEM files", () => {
			// Mock fs.readFileSync to return test certificate data
			const mockReadFileSync = fs.readFileSync as MockedFunction<
				typeof fs.readFileSync
			>;
			mockReadFileSync.mockImplementation((path: fs.PathOrFileDescriptor) => {
				if (path.toString().includes("private")) {
					return testCert.privateKey;
				}
				return testCert.publicCert;
			});

			const cert = loadCertificateFromPem(
				"/path/to/private.pem",
				"/path/to/cert.pem",
			);

			expect(cert).toBeDefined();
			expect(cert.privateKey).toContain("BEGIN RSA PRIVATE KEY");
			expect(cert.publicCert).toContain("BEGIN CERTIFICATE");
			expect(cert.issuer).toContain("Test Certificate");
			expect(cert.subject).toContain("Test Organization");
			expect(cert.validFrom).toBeInstanceOf(Date);
			expect(cert.validTo).toBeInstanceOf(Date);
		});

		it("should handle invalid certificate data gracefully", () => {
			const mockReadFileSync = fs.readFileSync as MockedFunction<
				typeof fs.readFileSync
			>;
			mockReadFileSync.mockReturnValue(Buffer.from("invalid data"));

			expect(() => {
				loadCertificateFromPem("/path/to/private.pem", "/path/to/cert.pem");
			}).toThrow("Failed to load PEM certificate");
		});

		it("should handle file read errors", () => {
			const mockReadFileSync = fs.readFileSync as MockedFunction<
				typeof fs.readFileSync
			>;
			mockReadFileSync.mockImplementation(() => {
				throw new Error("File not found");
			});

			expect(() => {
				loadCertificateFromPem("/path/to/private.pem", "/path/to/cert.pem");
			}).toThrow("Failed to load PEM certificate");
		});
	});

	describe("validateCertificate", () => {
		it("should validate a valid certificate", () => {
			const result = validateCertificate(testCert);

			expect(result.isValid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it("should detect expired certificate", () => {
			const result = validateCertificate(expiredCert);

			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain("expired");
		});

		it("should detect certificate not yet valid", () => {
			const futureCert: Certificate = {
				...testCert,
				validFrom: new Date(Date.now() + 86400000 * 30), // 30 days from now
				validTo: new Date(Date.now() + 86400000 * 365), // 1 year from now
			};

			const result = validateCertificate(futureCert);

			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(1);
			expect(result.errors[0]).toContain("not yet valid");
		});

		it("should warn when certificate expires within 30 days", () => {
			validateCertificate(expiringSoonCert);

			expect(loggerWarnSpy).toHaveBeenCalledOnce();
			expect(loggerWarnSpy.mock.calls[0]?.[0]).toMatchObject({
				daysRemaining: expect.any(Number),
				subject: expiringSoonCert.subject,
			});
			expect(loggerWarnSpy.mock.calls[0]?.[1]).toBe("Certificate expires soon");
		});

		it("should not warn for certificates valid for more than 30 days", () => {
			validateCertificate(testCert);

			expect(loggerWarnSpy).not.toHaveBeenCalled();
		});

		it("should return multiple errors for invalid certificate", () => {
			const invalidCert: Certificate = {
				...testCert,
				validFrom: new Date(Date.now() + 86400000 * 30), // Future
				validTo: new Date(Date.now() - 86400000 * 30), // Past
			};

			const result = validateCertificate(invalidCert);

			expect(result.isValid).toBe(false);
			expect(result.errors).toHaveLength(2);
		});
	});

	describe("getCertificateInfo", () => {
		it("should extract certificate metadata", () => {
			const info = getCertificateInfo(testCert);

			expect(info.subject).toBe(testCert.subject);
			expect(info.issuer).toBe(testCert.issuer);
			expect(info.validFrom).toBe(
				testCert.validFrom.toISOString().split("T")[0],
			);
			expect(info.validTo).toBe(testCert.validTo.toISOString().split("T")[0]);
			expect(typeof info.daysRemaining).toBe("number");
			expect(info.daysRemaining).toBeGreaterThan(0);
		});

		it("should calculate days remaining correctly", () => {
			const info = getCertificateInfo(expiringSoonCert);

			expect(info.daysRemaining).toBeGreaterThanOrEqual(14);
			expect(info.daysRemaining).toBeLessThanOrEqual(16);
		});

		it("should return negative days for expired certificate", () => {
			const info = getCertificateInfo(expiredCert);

			expect(info.daysRemaining).toBeLessThan(0);
		});
	});
});

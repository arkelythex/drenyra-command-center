/**
 * Invoice Signer Service Tests
 * Tests for high-level invoice signing operations (SUNAT 2026)
 */

import { EventEmitter } from "node:events";
import fs from "node:fs";
import forge from "node-forge";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { CreditNoteData, InvoiceData } from "../../types/ubl.types";
import type { Certificate } from "../certificate.handler";
import {
	batchSignInvoices,
	generateAndSignCreditNote,
	generateAndSignInvoice,
} from "../invoice-signer.service";

// Mock fs modules
vi.mock("fs");
vi.mock("archiver", () => ({
	ZipArchive: vi.fn(() => {
		let output: EventEmitter | null = null;
		const api = {
			on: vi.fn().mockImplementation(() => api),
			pipe: vi.fn().mockImplementation((out: EventEmitter) => {
				output = out;
				return out;
			}),
			append: vi.fn(),
			finalize: vi.fn().mockImplementation(() => {
				if (output && typeof (output as EventEmitter).emit === "function") {
					setTimeout(() => (output as EventEmitter).emit("close"), 0);
				}
			}),
			pointer: vi.fn(() => 0),
		};
		return api;
	}),
}));

describe("Invoice Signer Service", () => {
	let testCert: Certificate;
	const outputDir = "/tmp/test-output";

	// Sample invoice data
	const sampleInvoice: InvoiceData = {
		id: "F001-00000001",
		issueDate: "2024-01-15",
		invoiceTypeCode: "01",
		documentCurrencyCode: "PEN",
		supplier: {
			ruc: "20100070970",
			legalName: "Test Supplier S.A.C.",
			tradeName: "Test Supplier",
			address: {
				streetName: "Av. Test 123",
				cityName: "Lima",
				countrySubentity: "Lima",
				district: "Miraflores",
				country: "PE",
			},
		},
		customer: {
			ruc: "20100070971",
			legalName: "Test Customer S.A.C.",
			address: {
				country: "PE",
			},
		},
		invoiceLines: [
			{
				id: "1",
				quantity: 2,
				unitCode: "NIU",
				description: "Test Product",
				unitPrice: 50.0,
				taxCategory: "S",
				lineExtensionAmount: 100.0,
				taxAmount: 18.0,
				totalAmount: 118.0,
			},
		],
		taxTotals: [
			{
				taxAmount: 18.0,
				taxSubtotal: [
					{
						taxableAmount: 100.0,
						taxAmount: 18.0,
						taxCategory: "S",
						taxType: "1000",
						taxRate: 18.0,
					},
				],
			},
		],
		legalMonetaryTotal: {
			lineExtensionAmount: 100.0,
			taxInclusiveAmount: 118.0,
			payableAmount: 118.0,
		},
		paymentTerms: {
			paymentMeansCode: "Contado",
		},
	};

	// Sample credit note data
	const sampleCreditNote: CreditNoteData = {
		id: "FC01-00000001",
		issueDate: "2024-01-16",
		creditNoteTypeCode: "07",
		documentCurrencyCode: "PEN",
		supplier: {
			ruc: "20100070970",
			legalName: "Test Supplier S.A.C.",
			address: {
				country: "PE",
			},
		},
		customer: {
			ruc: "20100070971",
			legalName: "Test Customer S.A.C.",
			address: {
				country: "PE",
			},
		},
		invoiceLines: [
			{
				id: "1",
				quantity: 1,
				unitCode: "NIU",
				description: "Test Product - Devolución",
				unitPrice: 50.0,
				taxCategory: "S",
				lineExtensionAmount: 50.0,
				taxAmount: 9.0,
				totalAmount: 59.0,
			},
		],
		taxTotals: [
			{
				taxAmount: 9.0,
				taxSubtotal: [
					{
						taxableAmount: 50.0,
						taxAmount: 9.0,
						taxCategory: "S",
						taxType: "1000",
						taxRate: 18.0,
					},
				],
			},
		],
		legalMonetaryTotal: {
			lineExtensionAmount: 50.0,
			taxInclusiveAmount: 59.0,
			payableAmount: 59.0,
		},
		billingReference: {
			invoiceDocumentReference: {
				id: "F001-00000001",
				issueDate: "2024-01-15",
			},
		},
		discrepancyResponse: {
			responseCode: "01",
			description: "Anulación de la operación",
		},
	};

	beforeAll(() => {
		// Generate a test certificate
		const keys = forge.pki.rsa.generateKeyPair(2048);
		const cert = forge.pki.createCertificate();
		cert.publicKey = keys.publicKey;
		cert.serialNumber = "01";
		cert.validity.notBefore = new Date();
		cert.validity.notAfter = new Date();
		cert.validity.notAfter.setFullYear(
			cert.validity.notBefore.getFullYear() + 1,
		);

		const attrs = [
			{ name: "commonName", value: "Test Certificate" },
			{ name: "organizationName", value: "Test Organization" },
			{ name: "countryName", value: "PE" },
		];
		cert.setSubject(attrs);
		cert.setIssuer(attrs);

		cert.sign(keys.privateKey);

		testCert = {
			privateKey: forge.pki.privateKeyToPem(keys.privateKey),
			publicCert: forge.pki.certificateToPem(cert),
			issuer: "CN=Test Certificate, O=Test Organization, C=PE",
			subject: "CN=Test Certificate, O=Test Organization, C=PE",
			validFrom: cert.validity.notBefore,
			validTo: cert.validity.notAfter,
		};
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	beforeEach(() => {
		vi.mocked(fs.mkdir).mockImplementation((...args) => {
			const callback = args[args.length - 1] as (
				err?: NodeJS.ErrnoException | null,
			) => void;
			callback(null);
		});

		vi.mocked(fs.writeFile).mockImplementation((...args) => {
			const callback = args[args.length - 1] as (
				err?: NodeJS.ErrnoException | null,
			) => void;
			callback(null);
		});

		vi.mocked(fs.createWriteStream).mockImplementation(() => {
			return new EventEmitter() as unknown as fs.WriteStream;
		});
	});

	describe("generateAndSignInvoice", () => {
		it("should generate and sign a complete invoice", async () => {
			const result = await generateAndSignInvoice(sampleInvoice, testCert);

			expect(result).toBeDefined();
			expect(result.xml).toBeDefined();
			expect(result.xml).toContain('<?xml version="1.0"');
			expect(result.xml).toContain("<Invoice");
			expect(result.xml).toContain("<ds:Signature");
			expect(result.fileName).toBe("20100070970-01-F001-00000001.xml");
			expect(result.zipFileName).toBe("20100070970-01-F001-00000001.zip");
			expect(result.hash).toBeDefined();
			expect(result.hash.length).toBe(64); // SHA-256 hex string
		});

		it("should verify file naming convention (RUC-TipoDoc-Serie-Numero.xml)", async () => {
			const result = await generateAndSignInvoice(sampleInvoice, testCert);

			// File name format: RUC-TipoDoc-Serie-Numero.xml
			const expectedPattern = /^\d{11}-\d{2}-[FB]\d{3}-\d{8}\.xml$/;
			expect(result.fileName).toMatch(expectedPattern);

			// Verify components
			const parts = result.fileName.replace(".xml", "").split("-");
			expect(parts[0]).toBe(sampleInvoice.supplier.ruc);
			expect(parts[1]).toBe(sampleInvoice.invoiceTypeCode);
			expect(parts[2]).toBe("F001");
			expect(parts[3]).toBe("00000001");
		});

		it("should save signed XML to file when outputDir is provided", async () => {
			const writeFileMock = vi.fn((...args: unknown[]) => {
				const callback = args[args.length - 1] as (
					err?: NodeJS.ErrnoException | null,
				) => void;
				callback(null);
			});
			const mkdirMock = vi.fn((...args: unknown[]) => {
				const callback = args[args.length - 1] as (
					err?: NodeJS.ErrnoException | null,
				) => void;
				callback(null);
			});

			vi.mocked(fs.writeFile).mockImplementation(
				writeFileMock as unknown as typeof fs.writeFile,
			);
			vi.mocked(fs.mkdir).mockImplementation(
				mkdirMock as unknown as typeof fs.mkdir,
			);
			vi.mocked(fs.createWriteStream).mockImplementation(() => {
				return new EventEmitter() as unknown as fs.WriteStream;
			});

			await generateAndSignInvoice(sampleInvoice, testCert, outputDir);

			expect(mkdirMock).toHaveBeenCalledWith(
				outputDir,
				{ recursive: true },
				expect.any(Function),
			);
		});

		it("should create ZIP file when outputDir is provided", async () => {
			vi.mocked(fs.createWriteStream).mockImplementation(() => {
				return new EventEmitter() as unknown as fs.WriteStream;
			});

			const result = await generateAndSignInvoice(
				sampleInvoice,
				testCert,
				outputDir,
			);

			expect(result.zipFileName).toBe("20100070970-01-F001-00000001.zip");
			expect(fs.createWriteStream).toHaveBeenCalled();
		});

		it("should handle different invoice types correctly", async () => {
			const boletaInvoice: InvoiceData = {
				...sampleInvoice,
				id: "B001-00000001",
				invoiceTypeCode: "03",
			};

			const result = await generateAndSignInvoice(boletaInvoice, testCert);

			expect(result.fileName).toContain("-03-");
			expect(result.fileName).toContain("B001");
		});

		it("should throw error for invalid invoice data", async () => {
			const invalidInvoice = { ...sampleInvoice, id: "INVALID" };

			await expect(
				generateAndSignInvoice(invalidInvoice, testCert),
			).rejects.toThrow();
		});
	});

	describe("generateAndSignCreditNote", () => {
		it("should generate and sign a credit note", async () => {
			const result = await generateAndSignCreditNote(
				sampleCreditNote,
				testCert,
			);

			expect(result).toBeDefined();
			expect(result.xml).toBeDefined();
			expect(result.xml).toContain("<CreditNote");
			expect(result.xml).toContain("<ds:Signature");
			expect(result.xml).toContain(
				"<cbc:CreditNoteTypeCode>07</cbc:CreditNoteTypeCode>",
			);
			expect(result.xml).toContain("<cac:DiscrepancyResponse>");
			expect(result.xml).toContain("<cac:BillingReference>");
			expect(result.fileName).toBe("20100070970-07-FC01-00000001.xml");
			expect(result.zipFileName).toBe("20100070970-07-FC01-00000001.zip");
		});

		it("should include reference to original invoice", async () => {
			const result = await generateAndSignCreditNote(
				sampleCreditNote,
				testCert,
			);

			expect(result.xml).toContain(
				"<cbc:ReferenceID>F001-00000001</cbc:ReferenceID>",
			);
			expect(result.xml).toContain("<cbc:ResponseCode>01</cbc:ResponseCode>");
			expect(result.xml).toContain(
				"<cbc:Description>Anulación de la operación</cbc:Description>",
			);
		});

		it("should verify credit note file naming convention", async () => {
			const result = await generateAndSignCreditNote(
				sampleCreditNote,
				testCert,
			);

			// Credit note format: RUC-07-Serie-Numero.xml
			const expectedPattern = /^\d{11}-07-FC\d{2}-\d{8}\.xml$/;
			expect(result.fileName).toMatch(expectedPattern);
		});
	});

	describe("batchSignInvoices", () => {
		it("should batch sign multiple invoices", async () => {
			const invoices: InvoiceData[] = [
				{ ...sampleInvoice, id: "F001-00000001" },
				{ ...sampleInvoice, id: "F001-00000002" },
				{ ...sampleInvoice, id: "F001-00000003" },
			];

			vi.mocked(fs.createWriteStream).mockImplementation(() => {
				return new EventEmitter() as unknown as fs.WriteStream;
			});

			const results = await batchSignInvoices(invoices, testCert, outputDir);

			expect(results).toHaveLength(3);
			expect(results[0].fileName).toContain("00000001");
			expect(results[1].fileName).toContain("00000002");
			expect(results[2].fileName).toContain("00000003");
		});

		it("should handle empty invoice list", async () => {
			const results = await batchSignInvoices([], testCert, outputDir);

			expect(results).toHaveLength(0);
		});

		it("should throw error if one invoice fails", async () => {
			const invoices: InvoiceData[] = [
				{ ...sampleInvoice, id: "F001-00000001" },
				{ ...sampleInvoice, id: "INVALID-ID" },
			];

			await expect(
				batchSignInvoices(invoices, testCert, outputDir),
			).rejects.toThrow();
		});
	});

	describe("error handling", () => {
		it("should handle file system errors gracefully", async () => {
			vi.mocked(fs.mkdir).mockImplementation((...args) => {
				const callback = args[args.length - 1] as (
					err?: NodeJS.ErrnoException | null,
				) => void;
				callback(new Error("Permission denied"));
			});

			await expect(
				generateAndSignInvoice(sampleInvoice, testCert, outputDir),
			).rejects.toThrow("Permission denied");
		});

		it("should handle ZIP creation errors", async () => {
			vi.mocked(fs.createWriteStream).mockImplementation(() => {
				throw new Error("Disk full");
			});

			await expect(
				generateAndSignInvoice(sampleInvoice, testCert, outputDir),
			).rejects.toThrow("Disk full");
		});

		it("should handle invalid certificate", async () => {
			const invalidCert: Certificate = {
				...testCert,
				privateKey: "invalid key",
			};

			await expect(
				generateAndSignInvoice(sampleInvoice, invalidCert),
			).rejects.toThrow();
		});
	});
});

/**
 * Document Entity Unit Tests
 *
 * Tests for the Document domain entity in the IDP pipeline.
 * Document Status Flow:
 * UPLOADED → EXTRACTING → PENDING_VALIDATION → VALIDATED/REJECTED → PROCESSING → PROCESSED
 */

import { describe, expect, it } from "vitest";
import {
	Document,
	type DocumentProps,
	type DocumentStatus,
	type DocumentType,
	type ExtractedData,
} from "../Document";

// Test helper to create valid document props
function createValidDocumentProps(
	overrides: Partial<DocumentProps> = {},
): DocumentProps {
	return {
		id: "doc-123",
		clientId: "client-456",
		clientName: "ACME Corp",
		fileName: "factura-001.pdf",
		fileUrl: "https://storage.example.com/factura-001.pdf",
		fileType: "PDF" as DocumentType,
		fileSize: 1024000,
		status: "UPLOADED" as DocumentStatus,
		uploadedAt: new Date("2024-01-15"),
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-01-15"),
		...overrides,
	};
}

// Test helper to create extracted data
function createExtractedData(
	overrides: Partial<ExtractedData> = {},
): ExtractedData {
	return {
		providerRUC: "20100070970",
		providerName: "Proveedor S.A.C.",
		issueDate: new Date("2024-01-10"),
		documentNumber: "F001-00001234",
		baseAmount: 1000,
		igvAmount: 180,
		totalAmount: 1180,
		currency: "PEN",
		confidenceScore: 85,
		...overrides,
	};
}

describe("Document Entity", () => {
	describe("Creation", () => {
		it("should create a valid document", () => {
			const props = createValidDocumentProps();
			const document = Document.create(props);

			expect(document.id).toBe("doc-123");
			expect(document.clientId).toBe("client-456");
			expect(document.clientName).toBe("ACME Corp");
			expect(document.fileName).toBe("factura-001.pdf");
			expect(document.fileType).toBe("PDF");
			expect(document.status).toBe("UPLOADED");
		});

		it("should create document with all file types", () => {
			const fileTypes: DocumentType[] = ["IMAGE", "XML", "PDF"];

			fileTypes.forEach((fileType) => {
				const document = Document.create(
					createValidDocumentProps({ fileType }),
				);
				expect(document.fileType).toBe(fileType);
			});
		});
	});

	describe("Status Transitions - Happy Path", () => {
		describe("startExtraction()", () => {
			it("should transition UPLOADED → EXTRACTING", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "UPLOADED" }),
				);

				const extracting = document.startExtraction();

				expect(extracting.status).toBe("EXTRACTING");
				expect(extracting.updatedAt).toBeInstanceOf(Date);
			});
		});

		describe("completeExtraction()", () => {
			it("should transition EXTRACTING → PENDING_VALIDATION", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "EXTRACTING" }),
				);

				const extracted = document.completeExtraction(createExtractedData());

				expect(extracted.status).toBe("PENDING_VALIDATION");
				expect(extracted.extractedData).toBeDefined();
			});

			it("should calculate HIGH confidence for score >= 95", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "EXTRACTING" }),
				);

				const extracted = document.completeExtraction(
					createExtractedData({ confidenceScore: 95 }),
				);

				expect(extracted.confidenceLevel).toBe("HIGH");
			});

			it("should calculate MEDIUM confidence for score 70-94", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "EXTRACTING" }),
				);

				const extracted = document.completeExtraction(
					createExtractedData({ confidenceScore: 85 }),
				);

				expect(extracted.confidenceLevel).toBe("MEDIUM");
			});

			it("should calculate LOW confidence for score < 70", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "EXTRACTING" }),
				);

				const extracted = document.completeExtraction(
					createExtractedData({ confidenceScore: 50 }),
				);

				expect(extracted.confidenceLevel).toBe("LOW");
			});
		});

		describe("validate()", () => {
			it("should transition PENDING_VALIDATION → VALIDATED", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "PENDING_VALIDATION" }),
				);

				const validated = document.validate("user-123", "Aprobado");

				expect(validated.status).toBe("VALIDATED");
				expect(validated.validatedBy).toBe("user-123");
				expect(validated.validatedAt).toBeInstanceOf(Date);
			});

			it("should allow validation without notes", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "PENDING_VALIDATION" }),
				);

				const validated = document.validate("user-123");

				expect(validated.status).toBe("VALIDATED");
			});
		});

		describe("reject()", () => {
			it("should transition to REJECTED with reason", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "PENDING_VALIDATION" }),
				);

				const rejected = document.reject("user-123", "Documento ilegible");

				expect(rejected.status).toBe("REJECTED");
				expect(rejected.validatedBy).toBe("user-123");
				expect(rejected.validatedAt).toBeInstanceOf(Date);
			});

			it("should allow rejection from any status", () => {
				// Reject can be called from any status as a general error handling
				const statuses: DocumentStatus[] = [
					"UPLOADED",
					"EXTRACTING",
					"PROCESSING",
				];

				statuses.forEach((status) => {
					const document = Document.create(
						createValidDocumentProps({ status }),
					);
					const rejected = document.reject("user-123", "Error");
					expect(rejected.status).toBe("REJECTED");
				});
			});
		});

		describe("startProcessing()", () => {
			it("should transition VALIDATED → PROCESSING", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "VALIDATED" }),
				);

				const processing = document.startProcessing();

				expect(processing.status).toBe("PROCESSING");
			});
		});

		describe("completeProcessing()", () => {
			it("should transition PROCESSING → PROCESSED", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "PROCESSING" }),
				);

				const processed = document.completeProcessing("entry-789");

				expect(processed.status).toBe("PROCESSED");
				expect(processed.processedAt).toBeInstanceOf(Date);
			});
		});

		describe("markAsError()", () => {
			it("should transition to ERROR status", () => {
				const document = Document.create(
					createValidDocumentProps({ status: "EXTRACTING" }),
				);

				const errored = document.markAsError("OCR failed");

				expect(errored.status).toBe("ERROR");
			});

			it("should allow error from any status", () => {
				const statuses: DocumentStatus[] = [
					"UPLOADED",
					"EXTRACTING",
					"PENDING_VALIDATION",
					"VALIDATED",
					"PROCESSING",
				];

				statuses.forEach((status) => {
					const document = Document.create(
						createValidDocumentProps({ status }),
					);
					const errored = document.markAsError("Error");
					expect(errored.status).toBe("ERROR");
				});
			});
		});
	});

	describe("Status Transitions - Error Cases", () => {
		it("should throw error when starting extraction on non-UPLOADED document", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			expect(() => document.startExtraction()).toThrow(
				"Can only start extraction on UPLOADED documents",
			);
		});

		it("should throw error when completing extraction on non-EXTRACTING document", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);

			expect(() => document.completeExtraction(createExtractedData())).toThrow(
				"Can only complete extraction on EXTRACTING documents",
			);
		});

		it("should throw error when validating non-PENDING_VALIDATION document", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);

			expect(() => document.validate("user-123")).toThrow(
				"Can only validate PENDING_VALIDATION documents",
			);
		});

		it("should throw error when starting processing on non-VALIDATED document", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "PENDING_VALIDATION" }),
			);

			expect(() => document.startProcessing()).toThrow(
				"Can only process VALIDATED documents",
			);
		});

		it("should throw error when completing processing on non-PROCESSING document", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "VALIDATED" }),
			);

			expect(() => document.completeProcessing("entry-123")).toThrow(
				"Can only complete processing on PROCESSING documents",
			);
		});
	});

	describe("Business Methods", () => {
		describe("needsReview()", () => {
			it("should return true for MEDIUM confidence", () => {
				const document = Document.create(
					createValidDocumentProps({ confidenceLevel: "MEDIUM" }),
				);

				expect(document.needsReview()).toBe(true);
			});

			it("should return true for LOW confidence", () => {
				const document = Document.create(
					createValidDocumentProps({ confidenceLevel: "LOW" }),
				);

				expect(document.needsReview()).toBe(true);
			});

			it("should return false for HIGH confidence", () => {
				const document = Document.create(
					createValidDocumentProps({ confidenceLevel: "HIGH" }),
				);

				expect(document.needsReview()).toBe(false);
			});

			it("should return false when confidence is undefined", () => {
				const document = Document.create(
					createValidDocumentProps({ confidenceLevel: undefined }),
				);

				expect(document.needsReview()).toBe(false);
			});
		});

		describe("canAutoProcess()", () => {
			it("should return true for HIGH confidence XML documents", () => {
				const document = Document.create(
					createValidDocumentProps({
						confidenceLevel: "HIGH",
						fileType: "XML",
					}),
				);

				expect(document.canAutoProcess()).toBe(true);
			});

			it("should return false for HIGH confidence non-XML documents", () => {
				const document = Document.create(
					createValidDocumentProps({
						confidenceLevel: "HIGH",
						fileType: "PDF",
					}),
				);

				expect(document.canAutoProcess()).toBe(false);
			});

			it("should return false for non-HIGH confidence XML documents", () => {
				const document = Document.create(
					createValidDocumentProps({
						confidenceLevel: "MEDIUM",
						fileType: "XML",
					}),
				);

				expect(document.canAutoProcess()).toBe(false);
			});

			it("should return false when confidence is undefined", () => {
				const document = Document.create(
					createValidDocumentProps({
						confidenceLevel: undefined,
						fileType: "XML",
					}),
				);

				expect(document.canAutoProcess()).toBe(false);
			});
		});
	});

	describe("Immutability", () => {
		it("should be frozen after creation", () => {
			const document = Document.create(createValidDocumentProps());

			expect(Object.isFrozen(document)).toBe(true);
		});

		it("should return new instance on status change", () => {
			const original = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);
			const extracting = original.startExtraction();

			expect(extracting).not.toBe(original);
			expect(original.status).toBe("UPLOADED");
			expect(extracting.status).toBe("EXTRACTING");
		});
	});

	describe("Getters", () => {
		it("should return all properties correctly", () => {
			const props = createValidDocumentProps({
				extractedData: createExtractedData(),
				confidenceLevel: "HIGH",
				validatedBy: "user-123",
				validatedAt: new Date("2024-01-16"),
				processedAt: new Date("2024-01-17"),
			});

			const document = Document.create(props);

			expect(document.id).toBe(props.id);
			expect(document.clientId).toBe(props.clientId);
			expect(document.clientName).toBe(props.clientName);
			expect(document.fileName).toBe(props.fileName);
			expect(document.fileUrl).toBe(props.fileUrl);
			expect(document.fileType).toBe(props.fileType);
			expect(document.status).toBe(props.status);
			expect(document.extractedData).toBeDefined();
			expect(document.confidenceLevel).toBe("HIGH");
			expect(document.validatedBy).toBe("user-123");
			expect(document.validatedAt).toBeInstanceOf(Date);
			expect(document.uploadedAt).toEqual(props.uploadedAt);
			expect(document.processedAt).toBeInstanceOf(Date);
			expect(document.createdAt).toEqual(props.createdAt);
			expect(document.updatedAt).toEqual(props.updatedAt);
		});
	});

	describe("Edge Cases", () => {
		it("should handle document without extracted data", () => {
			const document = Document.create(
				createValidDocumentProps({ extractedData: undefined }),
			);

			expect(document.extractedData).toBeUndefined();
		});

		it("should handle confidence score of 0", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: 0 }),
			);

			expect(extracted.confidenceLevel).toBe("LOW");
		});

		it("should handle confidence score of 100", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: 100 }),
			);

			expect(extracted.confidenceLevel).toBe("HIGH");
		});

		it("should handle confidence score at boundary (70)", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: 70 }),
			);

			expect(extracted.confidenceLevel).toBe("MEDIUM");
		});

		it("should handle confidence score at boundary (95)", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: 95 }),
			);

			expect(extracted.confidenceLevel).toBe("HIGH");
		});

		it("should handle confidence score at boundary (69)", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: 69 }),
			);

			expect(extracted.confidenceLevel).toBe("LOW");
		});

		it("should handle missing confidence score", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ confidenceScore: undefined }),
			);

			expect(extracted.confidenceLevel).toBe("LOW");
		});

		it("should handle empty extracted data", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction({});

			expect(extracted.status).toBe("PENDING_VALIDATION");
			expect(extracted.confidenceLevel).toBe("LOW");
		});

		it("should handle very large file size", () => {
			const document = Document.create(
				createValidDocumentProps({ fileSize: 1073741824 }), // 1GB
			);

			expect(document.id).toBe("doc-123");
		});

		it("should handle USD currency in extracted data", () => {
			const document = Document.create(
				createValidDocumentProps({ status: "EXTRACTING" }),
			);

			const extracted = document.completeExtraction(
				createExtractedData({ currency: "USD" }),
			);

			expect(extracted.extractedData?.currency).toBe("USD");
		});
	});

	describe("Complete Pipeline Flow", () => {
		it("should complete full pipeline: UPLOADED → PROCESSED", () => {
			// 1. Upload document
			let document = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);
			expect(document.status).toBe("UPLOADED");

			// 2. Start extraction
			document = document.startExtraction();
			expect(document.status).toBe("EXTRACTING");

			// 3. Complete extraction
			document = document.completeExtraction(
				createExtractedData({ confidenceScore: 85 }),
			);
			expect(document.status).toBe("PENDING_VALIDATION");
			expect(document.confidenceLevel).toBe("MEDIUM");

			// 4. Validate
			document = document.validate("accountant-123", "Verificado");
			expect(document.status).toBe("VALIDATED");
			expect(document.validatedBy).toBe("accountant-123");

			// 5. Start processing
			document = document.startProcessing();
			expect(document.status).toBe("PROCESSING");

			// 6. Complete processing
			document = document.completeProcessing("journal-entry-456");
			expect(document.status).toBe("PROCESSED");
			expect(document.processedAt).toBeInstanceOf(Date);
		});

		it("should handle rejection path", () => {
			// 1. Upload document
			let document = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);

			// 2. Start and complete extraction
			document = document.startExtraction();
			document = document.completeExtraction(
				createExtractedData({ confidenceScore: 30 }),
			);
			expect(document.confidenceLevel).toBe("LOW");
			expect(document.needsReview()).toBe(true);

			// 3. Accountant rejects
			document = document.reject("accountant-123", "Documento no válido");
			expect(document.status).toBe("REJECTED");
		});

		it("should handle error path", () => {
			let document = Document.create(
				createValidDocumentProps({ status: "UPLOADED" }),
			);

			document = document.startExtraction();
			document = document.markAsError("OCR engine timeout");

			expect(document.status).toBe("ERROR");
		});
	});
});

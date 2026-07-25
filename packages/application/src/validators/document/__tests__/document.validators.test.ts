/**
 * Document Validators Tests
 * Comprehensive tests for document validation schemas (66% → 100% coverage)
 */

import { describe, expect, it } from "vitest";
import {
	type RejectDocumentInput,
	RejectDocumentSchema,
	UploadDocumentSchema,
	type ValidateDocumentInput,
	ValidateDocumentSchema,
} from "../document.validators";

// ===== UPLOAD DOCUMENT SCHEMA =====

describe("UploadDocumentSchema", () => {
	const validClientId = "123e4567-e89b-12d3-a456-426614174000";

	describe("valid inputs", () => {
		it("should accept valid File upload", () => {
			const file = new File(["test content"], "invoice.pdf", {
				type: "application/pdf",
			});

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Acme Corp",
				file,
				fileName: "invoice.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.clientId).toBe(validClientId);
				expect(result.data.clientName).toBe("Acme Corp");
				expect(result.data.file).toBeInstanceOf(File);
			}
		});

		it("should accept valid Buffer upload", () => {
			const buffer = Buffer.from("test content");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Global Inc",
				file: buffer,
				fileName: "factura.xml",
				fileType: "XML" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.file).toBeInstanceOf(Buffer);
			}
		});

		it("should accept IMAGE file type", () => {
			const file = new File(["img"], "invoice.jpg", { type: "image/jpeg" });

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: "invoice.jpg",
				fileType: "IMAGE" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept XML file type", () => {
			const buffer = Buffer.from("<xml></xml>");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: buffer,
				fileName: "cpe.xml",
				fileType: "XML" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept company-scoped upload without organizationId", () => {
			const file = new File(["test content"], "invoice.pdf", {
				type: "application/pdf",
			});

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Company Scoped",
				file,
				fileName: "invoice.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("file size validation (lines 13-14 coverage)", () => {
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

		it("should accept File within size limit", () => {
			// 1MB file (well under 10MB limit)
			const smallFile = new File([new ArrayBuffer(1024 * 1024)], "small.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: smallFile,
				fileName: "small.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept Buffer within size limit", () => {
			// 1MB buffer (well under 10MB limit)
			const smallBuffer = Buffer.alloc(1024 * 1024);

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: smallBuffer,
				fileName: "small.xml",
				fileType: "XML" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should reject File exceeding size limit", () => {
			// 11MB file (exceeds 10MB limit)
			const largeFile = new File(
				[new ArrayBuffer(11 * 1024 * 1024)],
				"large.pdf",
			);

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: largeFile,
				fileName: "large.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain("10MB");
			}
		});

		it("should reject Buffer exceeding size limit", () => {
			// 11MB buffer (exceeds 10MB limit)
			const largeBuffer = Buffer.alloc(11 * 1024 * 1024);

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: largeBuffer,
				fileName: "large.xml",
				fileType: "XML" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain("10MB");
			}
		});

		it("should accept File at exact size limit", () => {
			// Exactly 10MB file (at limit)
			const exactFile = new File([new ArrayBuffer(MAX_FILE_SIZE)], "exact.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: exactFile,
				fileName: "exact.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept Buffer at exact size limit", () => {
			// Exactly 10MB buffer (at limit)
			const exactBuffer = Buffer.alloc(MAX_FILE_SIZE);

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file: exactBuffer,
				fileName: "exact.xml",
				fileType: "XML" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("clientId validation", () => {
		it("should reject missing organizationId", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: "test.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject invalid UUID", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: "not-a-uuid",
				clientName: "Client",
				file,
				fileName: "test.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					"ID de cliente inválido",
				);
			}
		});

		it("should accept valid UUIDs in different formats", () => {
			const file = new File(["test"], "test.pdf");
			const validUUIDs = [
				"123e4567-e89b-12d3-a456-426614174000",
				"a1b2c3d4-e5f6-7890-abcd-ef1234567890",
				"00000000-0000-0000-0000-000000000000",
			];

			validUUIDs.forEach((uuid) => {
				const input = {
					companyId: "123e4567-e89b-12d3-a456-426614174001",
					clientId: uuid,
					clientName: "Client",
					file,
					fileName: "test.pdf",
					fileType: "PDF" as const,
				};

				const result = UploadDocumentSchema.safeParse(input);
				expect(result.success).toBe(true);
			});
		});
	});

	describe("clientName validation", () => {
		it("should reject empty client name", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "",
				file,
				fileName: "test.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					"Nombre de cliente requerido",
				);
			}
		});

		it("should reject client name exceeding 200 characters", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "A".repeat(201),
				file,
				fileName: "test.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should accept client name at max length", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "A".repeat(200),
				file,
				fileName: "test.pdf",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("fileName validation", () => {
		it("should reject empty file name", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: "",
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject file name exceeding 255 characters", () => {
			const file = new File(["test"], "test.pdf");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: `${"A".repeat(256)}.pdf`,
				fileType: "PDF" as const,
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});

	describe("fileType validation", () => {
		it("should reject invalid file type", () => {
			const file = new File(["test"], "test.doc");

			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				clientId: validClientId,
				clientName: "Client",
				file,
				fileName: "test.doc",
				fileType: "DOCX", // Invalid type
			};

			const result = UploadDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should only accept IMAGE, XML, or PDF", () => {
			const validTypes = ["IMAGE", "XML", "PDF"] as const;

			validTypes.forEach((fileType) => {
				const file = new File(["test"], `test.${fileType.toLowerCase()}`);

				const input = {
					companyId: "123e4567-e89b-12d3-a456-426614174001",
					clientId: validClientId,
					clientName: "Client",
					file,
					fileName: `test.${fileType.toLowerCase()}`,
					fileType,
				};

				const result = UploadDocumentSchema.safeParse(input);
				expect(result.success).toBe(true);
			});
		});
	});
});

// ===== VALIDATE DOCUMENT SCHEMA =====

describe("ValidateDocumentSchema", () => {
	describe("valid inputs", () => {
		it("should accept valid validation input", () => {
			const input: ValidateDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept validation with corrected data", () => {
			const input: ValidateDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
				correctedData: { total: 1000, igv: 180 },
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.correctedData).toEqual({ total: 1000, igv: 180 });
			}
		});

		it("should accept validation with notes", () => {
			const input: ValidateDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
				notes: "Validated successfully",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept validation with both corrected data and notes", () => {
			const input: ValidateDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
				correctedData: { clientRuc: "20512345678" },
				notes: "Corrected RUC",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept company-scoped validation without organizationId", () => {
			const input: ValidateDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("validation errors", () => {
		it("should reject invalid document UUID", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "not-a-uuid",
				validatedBy: "user-123",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject empty validatedBy", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "",
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject notes exceeding 1000 characters", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
				notes: "A".repeat(1001),
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should accept notes at max length", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				validatedBy: "user-123",
				notes: "A".repeat(1000),
			};

			const result = ValidateDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});
});

// ===== REJECT DOCUMENT SCHEMA =====

describe("RejectDocumentSchema", () => {
	describe("valid inputs", () => {
		it("should accept valid rejection input", () => {
			const input: RejectDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				rejectedBy: "user-456",
				reason: "RUC inválido",
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});

		it("should accept reason at max length", () => {
			const input: RejectDocumentInput = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				rejectedBy: "user-456",
				reason: "A".repeat(500),
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(true);
		});
	});

	describe("validation errors", () => {
		it("should reject invalid document UUID", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "invalid-uuid",
				rejectedBy: "user-456",
				reason: "Invalid",
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject empty rejectedBy", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				rejectedBy: "",
				reason: "Invalid",
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});

		it("should reject empty reason", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				rejectedBy: "user-456",
				reason: "",
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.issues[0].message).toContain(
					"Razón de rechazo requerida",
				);
			}
		});

		it("should reject reason exceeding 500 characters", () => {
			const input = {
				companyId: "123e4567-e89b-12d3-a456-426614174001",
				documentId: "123e4567-e89b-12d3-a456-426614174000",
				rejectedBy: "user-456",
				reason: "A".repeat(501),
			};

			const result = RejectDocumentSchema.safeParse(input);

			expect(result.success).toBe(false);
		});
	});
});

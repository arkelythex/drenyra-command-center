import { Document } from "@arkelythex/domain/entities/Document";
import { describe, expect, it } from "vitest";
import {
	mapDocumentRowToEntity,
	mapDocumentToInsert,
	mapDocumentToUpdate,
} from "./document-persistence";

function createDocument() {
	return Document.create({
		id: "doc_123",
		clientId: "client_456",
		clientName: "ACME SAC",
		fileName: "invoice.xml",
		fileUrl: "https://cdn.arkelythex.dev/invoice.xml",
		fileType: "XML",
		fileSize: 2048,
		status: "VALIDATED",
		extractedData: {
			providerRUC: "20100070970",
			issueDate: new Date("2026-02-28T12:00:00.000Z"),
			totalAmount: 118,
			currency: "PEN",
			confidenceScore: 100,
		},
		confidenceLevel: "HIGH",
		validatedBy: "user-1",
		validatedAt: new Date("2026-02-28T12:05:00.000Z"),
		validationNotes: "Datos confirmados",
		accountingEntryId: "je_001",
		uploadedAt: new Date("2026-02-28T12:00:00.000Z"),
		processedAt: new Date("2026-02-28T12:06:00.000Z"),
		createdAt: new Date("2026-02-28T12:00:00.000Z"),
		updatedAt: new Date("2026-02-28T12:06:00.000Z"),
	});
}

describe("document persistence mapping", () => {
	it("serializes extracted data and domain metadata for inserts", () => {
		const document = createDocument();
		const payload = mapDocumentToInsert(document);

		expect(payload.id).toBe("doc_123");
		expect(payload.validationNotes).toBe("Datos confirmados");
		expect(payload.accountingEntryId).toBe("je_001");
		expect(payload.extractedData).toEqual({
			providerRUC: "20100070970",
			issueDate: "2026-02-28T12:00:00.000Z",
			totalAmount: 118,
			currency: "PEN",
			confidenceScore: 100,
		});
	});

	it("omits immutable fields on updates", () => {
		const payload = mapDocumentToUpdate(createDocument());

		expect(payload.id).toBeUndefined();
		expect(payload.createdAt).toBeUndefined();
		expect(payload.status).toBe("VALIDATED");
		expect(payload.validationNotes).toBe("Datos confirmados");
	});

	it("rehydrates persisted rows into the domain entity", () => {
		const entity = mapDocumentRowToEntity({
			id: "doc_123",
			organizationId: 42,
			companyId: "cmp_123",
			clientId: "client_456",
			clientName: "ACME SAC",
			fileName: "invoice.xml",
			fileUrl: "https://cdn.arkelythex.dev/invoice.xml",
			fileType: "XML",
			fileSize: 2048,
			status: "VALIDATED",
			extractedData: {
				providerRUC: "20100070970",
				issueDate: "2026-02-28T12:00:00.000Z",
				totalAmount: 118,
				currency: "PEN",
				confidenceScore: 100,
			},
			confidenceLevel: "HIGH",
			validatedBy: "user-1",
			validatedAt: new Date("2026-02-28T12:05:00.000Z"),
			validationNotes: "Datos confirmados",
			accountingEntryId: "je_001",
			uploadedAt: new Date("2026-02-28T12:00:00.000Z"),
			processedAt: new Date("2026-02-28T12:06:00.000Z"),
			createdAt: new Date("2026-02-28T12:00:00.000Z"),
			updatedAt: new Date("2026-02-28T12:06:00.000Z"),
		});

		expect(entity.fileSize).toBe(2048);
		expect(entity.validationNotes).toBe("Datos confirmados");
		expect(entity.accountingEntryId).toBe("je_001");
		expect(entity.extractedData?.issueDate?.toISOString()).toBe(
			"2026-02-28T12:00:00.000Z",
		);
	});
});

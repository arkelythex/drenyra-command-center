import { describe, expect, it } from "vitest";
import { Document } from "../Document";

describe("Document getters", () => {
	it("exposes validationNotes and accountingEntryId when present", () => {
		const document = Document.create({
			id: "doc_1",
			clientId: "client_1",
			clientName: "ACME SAC",
			fileName: "invoice.pdf",
			fileUrl: "https://example.com/invoice.pdf",
			fileType: "PDF",
			fileSize: 1024,
			status: "PROCESSED",
			validationNotes: "Aprobado por contabilidad",
			accountingEntryId: "je_42",
			uploadedAt: new Date("2026-02-28T10:00:00.000Z"),
			processedAt: new Date("2026-02-28T10:15:00.000Z"),
			createdAt: new Date("2026-02-28T10:00:00.000Z"),
			updatedAt: new Date("2026-02-28T10:15:00.000Z"),
		});

		expect(document.validationNotes).toBe("Aprobado por contabilidad");
		expect(document.accountingEntryId).toBe("je_42");
	});
});

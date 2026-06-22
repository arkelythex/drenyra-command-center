import { Document } from "@arkelythex/domain/entities/Document";
import { describe, expect, it } from "vitest";
import { DocumentRepositoryImpl } from "./document.repository";

function createDocument() {
	return Document.create({
		id: "doc_1",
		clientId: "client_1",
		clientName: "ACME SAC",
		fileName: "invoice.pdf",
		fileUrl: "https://example.com/invoice.pdf",
		fileType: "PDF",
		fileSize: 1024,
		status: "UPLOADED",
		uploadedAt: new Date("2026-02-28T10:00:00.000Z"),
		createdAt: new Date("2026-02-28T10:00:00.000Z"),
		updatedAt: new Date("2026-02-28T10:00:00.000Z"),
	});
}

describe("DocumentRepositoryImpl", () => {
	it("fails fast on save without tenant context", async () => {
		const repository = new DocumentRepositoryImpl();

		await expect(repository.save(createDocument())).rejects.toThrow(
			"DocumentRepository.save requires tenant context. Use saveForCompany(document, companyId).",
		);
	});

	it("fails fast on update without tenant context", async () => {
		const repository = new DocumentRepositoryImpl();

		await expect(repository.update(createDocument())).rejects.toThrow(
			"DocumentRepository.update requires tenant context. Use updateForCompany(document, companyId).",
		);
	});

	it("fails fast on findById without tenant context", async () => {
		const repository = new DocumentRepositoryImpl();

		await expect(repository.findById("doc_1")).rejects.toThrow(
			"DocumentRepository.findById requires tenant context. Use findByIdForCompany(id, companyId).",
		);
	});
});

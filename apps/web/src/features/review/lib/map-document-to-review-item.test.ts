import { describe, expect, it } from "vitest";
import {
	conflictsFromExtracted,
	mapDocumentDtoToReviewItem,
} from "./map-document-to-review-item";

describe("mapDocumentDtoToReviewItem", () => {
	it("maps DTO with partial extractedData and marks conflict when fields differ from empty original", () => {
		const item = mapDocumentDtoToReviewItem({
			id: "doc-1",
			fileName: "FAC.pdf",
			status: "revision_humana",
			confidenceLevel: "high",
			uploadedAt: "2026-04-18T12:00:00.000Z",
			extractedData: {
				issuerRUC: "20100017491",
				total: 450.5,
			},
		});

		expect(item.id).toBe("doc-1");
		expect(item.filename).toBe("FAC.pdf");
		expect(item.date).toBe("2026-04-18");
		expect(item.amount).toBe(450.5);
		expect(item.confidence).toBe(0.92);
		expect(item.status).toBe("conflict");
		expect(item.conflicts.taxId?.extracted).toBe("20100017491");
		expect(item.conflicts.total?.extracted).toBe(450.5);
	});

	it("uses extraction fallback when extractedData is missing", () => {
		const item = mapDocumentDtoToReviewItem({
			id: "doc-2",
			fileName: "X.xml",
			status: "revision_humana",
			confidenceLevel: undefined,
		});

		expect(item.conflicts.extraction?.isDifferent).toBe(false);
		expect(item.status).toBe("pending");
	});
});

describe("conflictsFromExtracted", () => {
	it("stringifies unknown object keys as raw payload", () => {
		const c = conflictsFromExtracted({ foo: "bar", nested: { a: 1 } }, 0.8);
		expect(c.raw).toBeDefined();
		expect(String(c.raw?.extracted)).toContain("foo");
	});
});

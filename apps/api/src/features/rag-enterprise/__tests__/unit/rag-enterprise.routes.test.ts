import { describe, expect, it } from "vitest";
import { ragEnterpriseRoutes } from "../../routes";

const app = ragEnterpriseRoutes;

describe("RAG enterprise tenant boundary", () => {
	it("requires a company header when creating collections", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/rag/collections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Tax docs" }) }));
		expect(response.status).toBe(400);
	});

	it("requires a company header when listing collections", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/rag/collections"))).status).toBe(400);
	});

	it("requires a company header when reading a collection", async () => {
		expect((await app.handle(new Request("http://localhost/api/v1/rag/collections/collection-1"))).status).toBe(400);
	});

	it("requires a company header when uploading a document", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/rag/collections/collection-1/upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: "Tax", fileName: "tax.txt", fileType: "txt", content: "content" }) }));
		expect(response.status).toBe(400);
	});

	it("requires a company header when querying the knowledge base", async () => {
		const response = await app.handle(new Request("http://localhost/api/v1/rag/query", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ collectionId: "collection-1", query: "tax invoices" }) }));
		expect(response.status).toBe(400);
	});
});

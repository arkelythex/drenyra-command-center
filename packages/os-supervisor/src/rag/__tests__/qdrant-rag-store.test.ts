import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { QdrantRagStore } from "../qdrant-rag-store.js";
import { OSKnowledgeNamespace } from "../types.js";

/**
 * Qdrant integration tests.
 * ⚠️ SKIPPED by default. Run with Qdrant server running:
 *   docker compose up -d qdrant
 *   QDRANT_URL=http://localhost:6333 bun vitest run --reporter verbose
 *
 * To enable: change describe.skip → describe.only or remove .skip
 */
describe.skip("QdrantRagStore", () => {
	const QDRANT_URL = "http://localhost:6333";
	let store: QdrantRagStore;

	beforeEach(async () => {
		store = new QdrantRagStore({ url: QDRANT_URL });
		if (!(await store.isAvailable())) {
			return;
		}
		await store.ensureCollections();
		await store.clear();
	});

	afterEach(async () => {
		await store.clear().catch(() => {});
	});

	it("should index and query by namespace", async () => {
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Ley IGV",
			title: "Tasa IGV",
			content: "La tasa del IGV es 18% (16% impuesto + 2% IPM)",
		});

		const results = await store.query({
			namespace: OSKnowledgeNamespace.SUNAT,
			query: "IGV",
		});
		expect(results.length).toBeGreaterThanOrEqual(1);
		expect(results[0]?.source).toBe("Ley IGV");
	});

	it("should not return documents from other namespaces", async () => {
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Ley IGV",
			title: "Tasa IGV",
			content: "La tasa del IGV es 18%",
		});
		await store.index({
			namespace: OSKnowledgeNamespace.DRONE,
			source: "DGAC",
			title: "Reglamento",
			content: "Todo dron debe registrarse",
		});

		const sunatResults = await store.query({
			namespace: OSKnowledgeNamespace.SUNAT,
			query: "dron",
		});
		expect(sunatResults).toHaveLength(0);

		const droneResults = await store.query({
			namespace: OSKnowledgeNamespace.DRONE,
			query: "dron",
		});
		expect(droneResults).toHaveLength(1);
	});

	it("should remove by namespace and id", async () => {
		const id = await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Test",
			title: "Test",
			content: "Documento de prueba",
		});

		expect(await store.remove(OSKnowledgeNamespace.SUNAT, id)).toBe(true);
		const results = await store.query({
			namespace: OSKnowledgeNamespace.SUNAT,
			query: "prueba",
		});
		expect(results).toHaveLength(0);
	});

	it("should list documents by namespace", async () => {
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Doc1",
			title: "Uno",
			content: "Contenido uno",
		});
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Doc2",
			title: "Dos",
			content: "Contenido dos",
		});

		const list = await store.list(OSKnowledgeNamespace.SUNAT);
		expect(list).toHaveLength(2);
	});

	it("should clear all documents", async () => {
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Doc",
			title: "Doc",
			content: "Algo",
		});
		await store.clear();
		const results = await store.query({ query: "Algo" });
		expect(results).toHaveLength(0);
	});

	it("should create collections lazily on first index", async () => {
		const freshStore = new QdrantRagStore({ url: QDRANT_URL });
		const id = await freshStore.index({
			namespace: OSKnowledgeNamespace.CATALOG,
			source: "Catálogo",
			title: "Item",
			content: "Item de prueba",
		});
		expect(id).toBeTruthy();
		const results = await freshStore.query({
			namespace: OSKnowledgeNamespace.CATALOG,
			query: "prueba",
		});
		expect(results).toHaveLength(1);
		await freshStore.clear();
	});
});

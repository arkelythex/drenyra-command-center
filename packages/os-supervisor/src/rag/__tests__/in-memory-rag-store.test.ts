import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryRagStore } from "../in-memory-rag-store.js";
import { OSKnowledgeNamespace } from "../types.js";

describe("InMemoryRagStore", () => {
	let store: InMemoryRagStore;

	beforeEach(async () => {
		store = new InMemoryRagStore();
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Ley IGV",
			title: "Tasa IGV",
			content: "La tasa del IGV es 18% (16% impuesto + 2% IPM)",
		});
		await store.index({
			namespace: OSKnowledgeNamespace.DRONE,
			source: "DGAC",
			title: "Registro drones",
			content: "Todo dron comercial debe registrarse ante la DGAC",
		});
		await store.index({
			namespace: OSKnowledgeNamespace.SUNAT,
			source: "Decreto Supremo",
			title: "Detracciones",
			content: "Las detracciones aplican a servicios gravados con IGV",
		});
	});

	it("should query by namespace", async () => {
		const results = await store.query({
			namespace: OSKnowledgeNamespace.DRONE,
			query: "dron",
		});
		expect(results).toHaveLength(1);
		expect(results[0]?.source).toBe("DGAC");
	});

	it("should query all namespaces when no namespace filter", async () => {
		const results = await store.query({ query: "IGV" });
		expect(results.length).toBeGreaterThanOrEqual(1);
	});

	it("should return empty for non-matching query", async () => {
		const results = await store.query({
			namespace: OSKnowledgeNamespace.LABOR,
			query: "robot",
		});
		expect(results).toHaveLength(0);
	});

	it("should index new documents", async () => {
		const id = await store.index({
			namespace: OSKnowledgeNamespace.CATALOG,
			source: "Catálogo",
			title: "Producto X",
			content: "Producto X es un servicio de consultoría",
		});
		expect(id).toMatch(/^rag_/);
		expect(await store.query({ query: "consultoría" })).toHaveLength(1);
	});

	it("should remove by namespace and id", async () => {
		const results = await store.query({
			namespace: OSKnowledgeNamespace.SUNAT,
			query: "detracciones",
		});
		const removed = await store.remove(
			OSKnowledgeNamespace.SUNAT,
			results[0]?.id,
		);
		expect(removed).toBe(true);
		expect(
			await store.query({
				namespace: OSKnowledgeNamespace.SUNAT,
				query: "detracciones",
			}),
		).toHaveLength(0);
	});

	it("should list documents by namespace", async () => {
		const list = await store.list(OSKnowledgeNamespace.SUNAT);
		expect(list).toHaveLength(2);
	});

	it("should clear all documents", async () => {
		await store.clear();
		expect(await store.query({ query: "IGV" })).toHaveLength(0);
	});
});

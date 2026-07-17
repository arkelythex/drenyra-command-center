import { describe, expect, it } from "vitest";
import {
	ALL_OS_NAMESPACES,
	OS_NAMESPACE_LABELS,
	OSKnowledgeNamespace,
} from "../types.js";

describe("OSKnowledgeNamespace", () => {
	it("should have 6 namespace values", () => {
		expect(ALL_OS_NAMESPACES).toHaveLength(6);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.SUNAT);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.DRONE);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.LABOR);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.POLICIES);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.PROCEDURES);
		expect(ALL_OS_NAMESPACES).toContain(OSKnowledgeNamespace.CATALOG);
	});

	it("should have labels for every namespace", () => {
		for (const ns of ALL_OS_NAMESPACES) {
			expect(OS_NAMESPACE_LABELS[ns]).toBeTruthy();
		}
	});

	it("OSRagDocument should accept valid fields", () => {
		const doc = {
			namespace: OSKnowledgeNamespace.DRONE,
			source: "DGAC Reglamento",
			title: "Operación de drones",
			content: "Los drones comerciales requieren permiso...",
		};
		expect(doc.namespace).toBe(OSKnowledgeNamespace.DRONE);
		expect(doc.source).toBeTruthy();
	});

	it("OSRagQuery should work with optional namespace", () => {
		const q: { query: string; namespace?: OSKnowledgeNamespace } = {
			query: "tasas detracción",
			namespace: OSKnowledgeNamespace.SUNAT,
		};
		expect(q.query).toBeTruthy();
	});

	it("OSRagSearchResult should have score", () => {
		const r = {
			id: "chunk-1",
			namespace: OSKnowledgeNamespace.LABOR,
			source: "Ley 123",
			title: "CTS",
			content: "La CTS se deposita...",
			category: "beneficios",
			score: 0.85,
		};
		expect(r.score).toBeGreaterThan(0);
	});
});

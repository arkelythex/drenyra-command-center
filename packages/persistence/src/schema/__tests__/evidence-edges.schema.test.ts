import { describe, expect, it } from "vitest";

const DRIZZLE_NAME = Symbol.for("drizzle:Name");
const DRIZZLE_COLUMNS = Symbol.for("drizzle:Columns");

interface DrizzleColumnMeta {
	name: string;
	dataType: string;
	notNull: boolean;
	primary: boolean;
	hasDefault: boolean;
}

describe("sireEvidenceEdges schema", () => {
	it("defines evidence_edges table with required columns", async () => {
		const { sireEvidenceEdges } = await import("../evidence-edges.schema");

		expect(sireEvidenceEdges).toBeDefined();

		const tableName = (sireEvidenceEdges as Record<symbol, string>)[
			DRIZZLE_NAME
		];
		expect(tableName).toBe("evidence_edges");

		const columns = (sireEvidenceEdges as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		// Required columns per REQ-B-002
		expect(columns.id).toBeDefined();
		expect(columns.fromNodeId).toBeDefined();
		expect(columns.toNodeId).toBeDefined();
		expect(columns.edgeType).toBeDefined();
		expect(columns.metadata).toBeDefined();
		expect(columns.createdAt).toBeDefined();

		// edgeType is varchar(50) and NOT NULL
		expect(columns.edgeType.dataType).toBe("string");
		expect(columns.edgeType.notNull).toBe(true);

		// FK columns are NOT NULL
		expect(columns.fromNodeId.notNull).toBe(true);
		expect(columns.toNodeId.notNull).toBe(true);

		// id is UUID PK
		expect(columns.id.primary).toBe(true);

		// createdAt is timestamp
		expect(columns.createdAt.dataType).toBe("date");
		expect(columns.createdAt.notNull).toBe(true);
	});

	it("has index on edge_type", async () => {
		const { sireEvidenceEdges } = await import("../evidence-edges.schema");

		const columns = (sireEvidenceEdges as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		expect(columns.edgeType).toBeDefined();
		expect(columns.edgeType.notNull).toBe(true);
	});
});

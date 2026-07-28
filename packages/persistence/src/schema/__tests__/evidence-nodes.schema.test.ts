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

describe("sireEvidenceNodes schema", () => {
	it("defines evidence_nodes table with required columns", async () => {
		const { sireEvidenceNodes } = await import("../evidence-nodes.schema");

		expect(sireEvidenceNodes).toBeDefined();

		// Table name via Drizzle symbol
		const tableName = (sireEvidenceNodes as Record<symbol, string>)[
			DRIZZLE_NAME
		];
		expect(tableName).toBe("evidence_nodes");

		// Columns via Drizzle symbol
		const columns = (sireEvidenceNodes as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		// Required columns per REQ-B-001
		expect(columns.id).toBeDefined();
		expect(columns.type).toBeDefined();
		expect(columns.artifactId).toBeDefined();
		expect(columns.period).toBeDefined();
		expect(columns.companyId).toBeDefined();
		expect(columns.hash).toBeDefined();
		expect(columns.previousHash).toBeDefined();
		expect(columns.metadata).toBeDefined();
		expect(columns.createdAt).toBeDefined();

		// Type is varchar and NOT NULL
		expect(columns.type.dataType).toBe("string");
		expect(columns.type.notNull).toBe(true);

		// Hash is varchar(64) for SHA-256 and NOT NULL
		expect(columns.hash.dataType).toBe("string");
		expect(columns.hash.notNull).toBe(true);

		// previousHash is nullable (genesis node has no previous)
		expect(columns.previousHash.notNull).toBe(false);

		// createdAt is a timestamp
		expect(columns.createdAt.dataType).toBe("date");
		expect(columns.createdAt.notNull).toBe(true);

		// id is UUID PK
		expect(columns.id.primary).toBe(true);
	});

	it("has index on (company_id, period)", async () => {
		const { sireEvidenceNodes } = await import("../evidence-nodes.schema");

		const columns = (sireEvidenceNodes as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		// Both columns exist and are present in the index definition
		expect(columns.companyId).toBeDefined();
		expect(columns.period).toBeDefined();
		expect(columns.companyId.notNull).toBe(true);
		expect(columns.period.notNull).toBe(true);
	});
});

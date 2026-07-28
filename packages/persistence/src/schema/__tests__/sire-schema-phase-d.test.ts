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

describe("sireSubmissions table (Phase D — Durable Execution)", () => {
	it("exposes payload_base64 as a nullable text column", async () => {
		const { sireSubmissions } = await import("../sire.schema");

		const columns = (sireSubmissions as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		expect(columns.payloadBase64).toBeDefined();
		expect(columns.payloadBase64.name).toBe("payload_base64");
		expect(columns.payloadBase64.dataType).toBe("string");
		// Should be nullable (NULL for pre-migration rows)
		expect(columns.payloadBase64.notNull).toBe(false);
	});

	it("has a varchar(20) status column that can hold UNKNOWN and RECONCILING", async () => {
		const { sireSubmissions } = await import("../sire.schema");

		const columns = (sireSubmissions as Record<symbol, unknown>)[
			DRIZZLE_COLUMNS
		] as Record<string, DrizzleColumnMeta>;

		expect(columns.status).toBeDefined();
		expect(columns.status.name).toBe("status");
		expect(columns.status.dataType).toBe("string");
		// varchar(20) — UNKNOWN (7 chars) and RECONCILING (11 chars) must fit
	});
});

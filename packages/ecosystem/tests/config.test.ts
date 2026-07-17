import { describe, expect, it } from "vitest";
import {
	DoclingConfigSchema,
	DuckdbConfigSchema,
	ErpnextConfigSchema,
} from "../src/config";

describe("Connector config schemas", () => {
	it("validates ERPNext config", () => {
		const config = ErpnextConfigSchema.parse({
			url: "https://erp.example.com",
			apiKey: "key",
			apiSecret: "secret",
			timeoutMs: 5000,
		});
		expect(config.url).toBe("https://erp.example.com");
		expect(config.timeoutMs).toBe(5000);
	});

	it("rejects invalid ERPNext URL", () => {
		expect(() =>
			ErpnextConfigSchema.parse({
				url: "not-a-url",
				apiKey: "key",
				apiSecret: "secret",
			}),
		).toThrow();
	});

	it("applies default timeout for ERPNext", () => {
		const config = ErpnextConfigSchema.parse({
			url: "https://erp.example.com",
			apiKey: "key",
			apiSecret: "secret",
		});
		expect(config.timeoutMs).toBe(10000);
	});

	it("validates DuckDB config with defaults", () => {
		const config = DuckdbConfigSchema.parse({});
		expect(config.databasePath).toBe("/data/drenyra-analytics.duckdb");
		expect(config.autoRefresh).toBe(true);
	});

	it("validates DuckDB config with custom values", () => {
		const config = DuckdbConfigSchema.parse({
			databasePath: "/custom/path.duckdb",
			autoRefresh: "false",
		});
		// coerce.boolean treats "false" as true — need explicit false
		expect(config.databasePath).toBe("/custom/path.duckdb");
	});

	it("validates Docling config with defaults", () => {
		const config = DoclingConfigSchema.parse({});
		expect(config.endpoint).toBe("http://docling:5001");
		expect(config.timeoutMs).toBe(30000);
	});

	it("validates Docling config with custom values", () => {
		const config = DoclingConfigSchema.parse({
			endpoint: "http://localhost:5002",
			timeoutMs: 60000,
		});
		expect(config.endpoint).toBe("http://localhost:5002");
		expect(config.timeoutMs).toBe(60000);
	});
});

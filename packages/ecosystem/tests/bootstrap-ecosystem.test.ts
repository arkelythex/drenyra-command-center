import { beforeEach, describe, expect, it } from "vitest";
import {
	getConnectorRegistry,
	resetConnectorRegistry,
} from "../src/connector.registry";

describe("Ecosystem bootstrap", () => {
	beforeEach(() => {
		resetConnectorRegistry();
		for (const key of Object.keys(process.env)) {
			if (key.startsWith("DRENYRA_")) {
				delete process.env[key];
			}
		}
	});

	it("auto-registers ERPNext connector from env vars", async () => {
		process.env.DRENYRA_ERPNEXT_URL = "https://erp.test";
		process.env.DRENYRA_ERPNEXT_API_KEY = "test-key";
		process.env.DRENYRA_ERPNEXT_API_SECRET = "test-secret";

		const { bootstrapEcosystem, getEcosystemBootstrapStatus } = await import(
			// @ts-expect-error cross-package import for integration test
			"../../../apps/api/src/features/ecosystem/bootstrap-ecosystem"
		);

		await bootstrapEcosystem();

		const registry = getConnectorRegistry();
		expect(registry.get("erpnext")).toBeDefined();
		expect(registry.size()).toBeGreaterThanOrEqual(1);

		const status = getEcosystemBootstrapStatus();
		expect(["ready", "partial", "disabled"]).toContain(status.status);
	});

	it("graceful skip when no DRENYRA_ env vars are set", async () => {
		const { bootstrapEcosystem, getEcosystemBootstrapStatus } = await import(
			// @ts-expect-error cross-package import for integration test
			"../../../apps/api/src/features/ecosystem/bootstrap-ecosystem"
		);

		await bootstrapEcosystem();

		const registry = getConnectorRegistry();
		expect(registry.size()).toBe(0);

		const status = getEcosystemBootstrapStatus();
		expect(status.status).toBe("not_configured");
	});

	it("handles DuckDB connector failure gracefully when package unavailable", async () => {
		process.env.DRENYRA_DUCKDB_DATABASE_PATH = "/tmp/test.duckdb";

		const { bootstrapEcosystem, getEcosystemBootstrapStatus } = await import(
			// @ts-expect-error cross-package import for integration test
			"../../../apps/api/src/features/ecosystem/bootstrap-ecosystem"
		);

		await expect(bootstrapEcosystem()).resolves.not.toThrow();

		const status = getEcosystemBootstrapStatus();
		expect(["disabled", "partial", "not_configured"]).toContain(status.status);
	});
});

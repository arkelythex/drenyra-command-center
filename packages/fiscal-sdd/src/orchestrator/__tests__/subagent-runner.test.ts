import { describe, expect, it } from "vitest";
import { DEFAULT_SUBAGENT_CONFIG, SubAgentRunner } from "../subagent-runner";

const TEST_CALLER = async (_s: string, _p: string) =>
	JSON.stringify({
		titulo: "Test",
		normativa: "Ley 12345",
	});

const TEST_SCOPE = {
	organizationId: "org-1",
	companyId: "comp-1",
	companyRuc: "20123456786",
	period: "2026-07",
};

describe("SubAgentRunner", () => {
	it("creates with default config", () => {
		const runner = new SubAgentRunner();
		const config = runner.getConfig();
		expect(config.enabled).toBe(false);
		expect(config.runtime).toBe("inline");
		expect(config.timeoutMs).toBe(60_000);
	});

	it("creates with custom config", () => {
		const runner = new SubAgentRunner({
			enabled: true,
			runtime: "inline",
			timeoutMs: 30_000,
		});

		const config = runner.getConfig();
		expect(config.enabled).toBe(true);
		expect(config.timeoutMs).toBe(30_000);
	});

	it("executes solicitud phase inline", async () => {
		const runner = new SubAgentRunner({ enabled: true, runtime: "inline" });

		const result = await runner.executePhase(
			"solicitud",
			{ changeId: "test-001" },
			TEST_CALLER,
			TEST_SCOPE,
			"test-001",
		);

		expect(result.status).toBe("SUCCESS");
		expect(result.output).toBeDefined();
	});

	it("executes all 6 phases inline", async () => {
		const runner = new SubAgentRunner({ enabled: true, runtime: "inline" });
		const fases = [
			"solicitud",
			"analisis",
			"diseno",
			"plan",
			"migracion",
			"auditoria",
		] as const;

		let input: unknown = { changeId: "test-all" };

		for (const fase of fases) {
			const result = await runner.executePhase(
				fase,
				input,
				TEST_CALLER,
				TEST_SCOPE,
				"test-all",
			);

			expect(result.status).toBe("SUCCESS");
			input = result.output;
		}
	});

	it("falls back to inline when disabled", async () => {
		const runner = new SubAgentRunner({ enabled: false, runtime: "subagent" });

		const result = await runner.executePhase(
			"solicitud",
			{},
			TEST_CALLER,
			TEST_SCOPE,
			"test-002",
		);

		expect(result.status).toBe("SUCCESS");
	});

	it("fails gracefully when subagent runtime not configured", async () => {
		const runner = new SubAgentRunner({
			enabled: true,
			runtime: "subagent",
		});

		const result = await runner.executePhase(
			"solicitud",
			{},
			TEST_CALLER,
			TEST_SCOPE,
			"test-003",
		);

		expect(result.status).toBe("FAILED");
		expect(result.errors[0]).toContain("createSubAgent no configurado");
	});

	it("fails gracefully when intercom runtime not available", async () => {
		const runner = new SubAgentRunner({
			enabled: true,
			runtime: "intercom",
		});

		const result = await runner.executePhase(
			"solicitud",
			{},
			TEST_CALLER,
			TEST_SCOPE,
			"test-004",
		);

		expect(result.status).toBe("FAILED");
		expect(result.errors[0]).toContain("Intercom");
	});

	it("updateConfig changes runtime config", () => {
		const runner = new SubAgentRunner();
		runner.updateConfig({ enabled: true, timeoutMs: 45_000 });

		const config = runner.getConfig();
		expect(config.enabled).toBe(true);
		expect(config.timeoutMs).toBe(45_000);
	});

	it("DEFAULT_SUBAGENT_CONFIG has expected values", () => {
		expect(DEFAULT_SUBAGENT_CONFIG.enabled).toBe(false);
		expect(DEFAULT_SUBAGENT_CONFIG.runtime).toBe("inline");
		expect(DEFAULT_SUBAGENT_CONFIG.timeoutMs).toBe(60_000);
	});
});

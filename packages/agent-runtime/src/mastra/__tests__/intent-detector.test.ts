import { beforeEach, describe, expect, it } from "vitest";
import type { AgentContext } from "../../types/agent-context";
import { IntentDetector } from "../intent-detector";

const mockContext: AgentContext = {
	tenantId: "tenant-1",
	userId: "user-1",
	organizationId: "org-1",
	companyId: "comp-1",
	ruc: "20123456789",
	sessionId: "session-1",
	traceId: "trace-1",
};

describe("IntentDetector", () => {
	let detector: IntentDetector;

	beforeEach(() => {
		detector = new IntentDetector();
	});

	it("should detect finance intent for invoice keywords", async () => {
		const result = await detector.detectIntent(
			"create an invoice for client",
			mockContext,
		);
		expect(result.agent).toBe("finance");
		expect(result.tool).toBe("invoice");
		expect(result.confidence).toBeGreaterThanOrEqual(0.9);
	});

	it("should detect compliance intent for SUNAT keywords", async () => {
		const result = await detector.detectIntent(
			"submit SUNAT report",
			mockContext,
		);
		expect(result.agent).toBe("compliance");
		expect(result.tool).toBe("sire");
	});

	it("should detect compliance intent for IGV", async () => {
		const result = await detector.detectIntent(
			"calcular IGV ventas",
			mockContext,
		);
		expect(result.agent).toBe("compliance");
		expect(result.tool).toBe("igv");
	});

	it("should detect operations intent for customer keywords", async () => {
		const result = await detector.detectIntent(
			"show customer list",
			mockContext,
		);
		expect(result.agent).toBe("operations");
		expect(result.tool).toBe("counterparty");
	});

	it("should detect system-admin intent for config keywords", async () => {
		const result = await detector.detectIntent("change settings", mockContext);
		expect(result.agent).toBe("system-admin");
	});

	it("should detect Latin agent intent for cerno keywords", async () => {
		const result = await detector.detectIntent(
			"give me a vision overview",
			mockContext,
		);
		expect(result.agent).toBe("cerno");
	});

	it("should detect Latin agent intent for custos keywords", async () => {
		const result = await detector.detectIntent(
			"protect this transaction",
			mockContext,
		);
		expect(result.agent).toBe("custos");
	});

	it("should detect Latin agent intent for scripta keywords", async () => {
		const result = await detector.detectIntent(
			"record this document",
			mockContext,
		);
		expect(result.agent).toBe("scripta");
	});

	it("should fallback to ai-assistant for unrecognized input", async () => {
		const result = await detector.detectIntent("hello world", mockContext);
		expect(result.agent).toBe("ai-assistant");
		expect(result.confidence).toBe(0.3);
	});

	it("should be case insensitive", async () => {
		const upper = await detector.detectIntent("SUNAT REPORT", mockContext);
		expect(upper.agent).toBe("compliance");

		const mixed = await detector.detectIntent("IgV CaLcUlAtIoN", mockContext);
		expect(mixed.agent).toBe("compliance");
	});

	it("should prioritize higher-priority rules over lower", async () => {
		// "sunat" has priority 90, "report" has priority 60 via lumen
		const result = await detector.detectIntent(
			"sunat report for march",
			mockContext,
		);
		expect(result.agent).toBe("compliance"); // SUNAT takes precedence
	});

	it("should register new custom rules", async () => {
		detector.register({
			pattern: /\b(custom|bespoke)\b/i,
			agent: "system-admin",
			tool: "custom-handler",
			priority: 100,
		});

		const result = await detector.detectIntent(
			"handle this custom request",
			mockContext,
		);
		expect(result.agent).toBe("system-admin");
		expect(result.tool).toBe("custom-handler");
	});

	it("should list all registered rules", () => {
		const rules = detector.getRules();
		expect(rules.length).toBeGreaterThan(20); // 22 default rules

		// Should be sorted by priority descending
		for (let i = 1; i < rules.length; i++) {
			expect(rules[i - 1].priority).toBeGreaterThanOrEqual(rules[i].priority);
		}
	});

	it("should detect detraccion keywords", async () => {
		const result = await detector.detectIntent(
			"aplicar detraccion SPOT",
			mockContext,
		);
		expect(result.agent).toBe("compliance");
		expect(result.tool).toBe("detraction");
	});

	it("should detect audit keywords", async () => {
		const result = await detector.detectIntent(
			"auditar transacciones",
			mockContext,
		);
		expect(result.agent).toBe("compliance");
		expect(result.tool).toBe("audit");
	});

	it("should detect RUC keywords", async () => {
		const result = await detector.detectIntent(
			"validar RUC 20123456789",
			mockContext,
		);
		expect(result.agent).toBe("compliance");
		expect(result.tool).toBe("ruc");
	});
});

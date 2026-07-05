import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvoiceData, ValidationResult } from "../../config/types";

type GenerateObjectMock = ReturnType<typeof vi.fn>;

function buildInvoice(overrides?: Partial<InvoiceData>): InvoiceData {
	return {
		id: overrides?.id ?? "INV-AI-001",
		ruc: overrides?.ruc ?? "20100070970",
		serie: overrides?.serie ?? "F001",
		numero: overrides?.numero ?? "00000001",
		fecha: overrides?.fecha ?? "2026-02-18",
		moneda: overrides?.moneda ?? "PEN",
		subtotal: overrides?.subtotal ?? 100,
		igv: overrides?.igv ?? 18,
		total: overrides?.total ?? 118,
		items: overrides?.items ?? [
			{
				descripcion: "Servicio profesional",
				cantidad: 1,
				precioUnitario: 100,
				subtotal: 100,
			},
		],
	};
}

async function loadAgentWithAiPath(options: {
	generateObjectImpl: GenerateObjectMock;
	estimateCost?: number;
}) {
	vi.resetModules();

	vi.doMock("ai", () => ({
		generateObject: options.generateObjectImpl,
	}));

	vi.doMock("../../config/openrouter.config", async () => {
		const actual = await vi.importActual<
			typeof import("../../config/openrouter.config")
		>("../../config/openrouter.config");

		return {
			...actual,
			hasOpenRouterKey: () => true,
			openrouter: vi.fn(() => ({ provider: "mock" })),
			getModelForAgent: vi.fn(() => "mock/sunat-model"),
			estimateCost: vi.fn(() => options.estimateCost ?? 0.01),
		};
	});

	const { SUNATAgent } = await import("../../agents/sunat.agent");
	const { agentCache } = await import("../../tools/cache");
	const { budgetTracker } = await import("../../tools/budget-tracker");
	agentCache.clear();
	budgetTracker.clear();

	return { SUNATAgent, agentCache, budgetTracker };
}

describe("SUNATAgent AI path", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.doUnmock("ai");
		vi.doUnmock("../../config/openrouter.config");
	});

	it("merges deterministic rule result with AI warnings and cost metadata", async () => {
		const generateObject = vi.fn(async () => ({
			object: {
				isValid: true,
				errors: [],
				warnings: [
					{
						field: "total",
						code: "BANKING_REQUIRED",
						message: "Pago > S/ 2000 requiere bancarizacion.",
					},
				],
				confidence: 0.91,
			} satisfies ValidationResult,
			usage: {
				totalTokens: 250,
			},
		}));

		const { SUNATAgent, budgetTracker } = await loadAgentWithAiPath({
			generateObjectImpl: generateObject,
			estimateCost: 0.015,
		});

		const agent = new SUNATAgent();
		const result = await agent.validateInvoice(buildInvoice());

		expect(result.success).toBe(true);
		expect(generateObject).toHaveBeenCalledTimes(1);
		expect(result.data?.isValid).toBe(true);
		expect(
			result.data?.warnings.some(
				(warning) => warning.code === "BANKING_REQUIRED",
			),
		).toBe(true);
		expect(
			result.data?.warnings.some(
				(warning) => warning.code === "SUNAT_AI_SIRE_ADAPTATION",
			),
		).toBe(true);
		expect(result.metadata.modelUsed).toBe("mock/sunat-model");
		expect(result.metadata.tokensUsed).toBe(250);
		expect(result.metadata.costUsd).toBe(0.015);
		expect(budgetTracker.getUsage().byAgent.sunat.calls).toBe(1);
	});

	it("uses cache on repeated validations to avoid second LLM call", async () => {
		const generateObject = vi.fn(async () => ({
			object: {
				isValid: true,
				errors: [],
				warnings: [],
				confidence: 0.88,
			} satisfies ValidationResult,
			usage: {
				totalTokens: 120,
			},
		}));

		const { SUNATAgent } = await loadAgentWithAiPath({
			generateObjectImpl: generateObject,
			estimateCost: 0.005,
		});

		const invoice = buildInvoice({ id: "INV-AI-CACHE-001" });
		const agent = new SUNATAgent();

		const first = await agent.validateInvoice(invoice);
		const second = await agent.validateInvoice(invoice);

		expect(first.success).toBe(true);
		expect(second.success).toBe(true);
		expect(generateObject).toHaveBeenCalledTimes(1);
		expect(second.metadata.modelUsed).toBe("cache");
		expect(second.metadata.tokensUsed).toBe(0);
		expect(second.metadata.costUsd).toBe(0);
	});

	it("returns SUNAT_VALIDATION_FAILED when unexpected runtime error occurs", async () => {
		const generateObject = vi.fn(async () => ({
			object: {
				isValid: true,
				errors: [],
				warnings: [],
				confidence: 0.9,
			},
			usage: { totalTokens: 50 },
		}));

		const { SUNATAgent } = await loadAgentWithAiPath({
			generateObjectImpl: generateObject,
		});

		const agent = new SUNATAgent();
		const brokenInvoice = {
			...buildInvoice({ id: "INV-AI-ERR-001" }),
			items: undefined,
		} as unknown as InvoiceData;

		const result = await agent.validateInvoice(brokenInvoice);

		expect(result.success).toBe(false);
		expect(result.error?.code).toBe("SUNAT_VALIDATION_FAILED");
	});
});

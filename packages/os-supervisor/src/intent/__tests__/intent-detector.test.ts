import { describe, expect, it } from "vitest";
import { VerticalType } from "../../types/vertical.types.js";
import { GeneralizedIntentDetector } from "../intent-detector.js";

describe("GeneralizedIntentDetector", () => {
	it("should detect Drenyra intent from fiscal keywords", async () => {
		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{
				pattern: /\b(invoice|factura|igv|sunat)\b/i,
				action: "fiscal",
				priority: 50,
			},
		]);
		const intent = await detector.detectIntent("show me the latest invoice");
		expect(intent.vertical).toBe(VerticalType.DRENYRA);
		expect(intent.confidence).toBeGreaterThan(0.5);
	});

	it("should detect Andino intent from drone keywords", async () => {
		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.ANDINO, [
			{
				pattern: /\b(drone|vuelo|flight|crop|cultivo)\b/i,
				action: "telemetry",
				priority: 50,
			},
		]);
		const intent = await detector.detectIntent("status of drone flight 42");
		expect(intent.vertical).toBe(VerticalType.ANDINO);
	});

	it("should detect Admin intent from HR keywords", async () => {
		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.ADMIN, [
			{
				pattern: /\b(employees?|empleados?|contracts?|contratos?|nómina)\b/i,
				action: "hr",
				priority: 50,
			},
		]);
		const intent = await detector.detectIntent(
			"list employees on maternity leave",
		);
		expect(intent.vertical).toBe(VerticalType.ADMIN);
	});

	it("should fallback to Drenyra when no vertical matches", async () => {
		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{ pattern: /\b(invoice|factura)\b/i, action: "fiscal", priority: 50 },
		]);
		const intent = await detector.detectIntent("what is the weather today?");
		expect(intent.vertical).toBe(VerticalType.DRENYRA);
		expect(intent.confidence).toBeLessThan(0.5);
	});

	it("should respect priority ordering", async () => {
		const detector = new GeneralizedIntentDetector();
		detector.registerVerticalRules(VerticalType.DRENYRA, [
			{ pattern: /\bdrone\b/i, action: "fiscal-drone", priority: 30 },
		]);
		detector.registerVerticalRules(VerticalType.ANDINO, [
			{ pattern: /\bdrone\b/i, action: "telemetry", priority: 80 },
		]);
		const intent = await detector.detectIntent("check drone status");
		expect(intent.vertical).toBe(VerticalType.ANDINO);
	});
});

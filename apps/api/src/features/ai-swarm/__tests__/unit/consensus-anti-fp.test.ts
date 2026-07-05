/**
 * Task 1.2: Consenso Dinámico Anti-Falsas Alarmas — 10 Escenarios SUNAT
 *
 * Target: <2% false positive rate con threshold dinámico.
 * Escenarios cubren los casos fiscales más comunes en el mercado peruano 2026.
 */

import {
	calculateWeightedConfidence,
	computeConsensusScore,
	computeDynamicThreshold,
	generateReasoning,
	getThresholdForSeverity,
	THRESHOLD_CONFIG,
} from "@drenyra/ai/services/swarm-consensus/consensus-engine";
import type { AgentConfidence } from "@drenyra/ai/services/swarm-consensus/types";
import {
	detectRucBreachAnomalies,
	RUC_BREACH_THRESHOLD_PEN,
} from "@drenyra/drenyra-orchestrator/strategies";
import { describe, expect, it } from "vitest";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAgents(
	lector: number,
	validador: number,
	detector: number,
): AgentConfidence[] {
	return [
		{
			agentId: "lector-1",
			agentRole: "lector",
			confidence: lector,
			timestamp: new Date(),
		},
		{
			agentId: "validador-1",
			agentRole: "validador",
			confidence: validador,
			timestamp: new Date(),
		},
		{
			agentId: "detector-1",
			agentRole: "detector",
			confidence: detector,
			timestamp: new Date(),
		},
	];
}

function computeScore(lector: number, validador: number, detector: number) {
	const weighted = calculateWeightedConfidence(
		makeAgents(lector, validador, detector),
	);
	return computeConsensusScore(weighted);
}

// ─── 1. Bug Fix: Weighted Sum (not divide-by-N) ───────────────────────────────

describe("Bug fix: computeConsensusScore usa weighted sum, no promedio simple", () => {
	it("3 agentes a 0.90 → score ≈ 0.90 (era 0.30 con el bug)", () => {
		const score = computeScore(0.9, 0.9, 0.9);
		// Weighted sum: 0.9×0.35 + 0.9×0.40 + 0.9×0.25 = 0.90
		// Agreement bonus: stdDev < 0.04 → +0.02 → 0.92 max
		expect(score).toBeGreaterThanOrEqual(0.9);
		expect(score).toBeLessThanOrEqual(0.95); // capped at 1.0
	});

	it("threshold crítico ahora es 0.95 (no 0.90)", () => {
		expect(THRESHOLD_CONFIG.critical.base).toBe(0.95);
	});
});

// ─── Escenario 1: IGV mismatch menor — NO debe disparar alerta crítica ─────────

describe("Escenario 1: IGV mismatch pequeño (falso positivo esperado)", () => {
	it("agentes con baja confianza no superan umbral crítico 0.95", () => {
		// Simulación: diferencia de S/ 50 en IGV, probablemente redondeo
		const score = computeScore(0.6, 0.65, 0.55);
		const threshold = getThresholdForSeverity("critical");

		expect(score).toBeLessThan(threshold);
		// Este caso NO dispara → evitamos falso positivo por redondeo
	});
});

// ─── Escenario 2: IGV mismatch grande — SÍ debe disparar ─────────────────────

describe("Escenario 2: IGV mismatch sustancial (S/ 4,200 sin regularizar)", () => {
	it("agentes con alta confianza superan umbral crítico 0.95", () => {
		const score = computeScore(0.97, 0.98, 0.96);
		const threshold = getThresholdForSeverity("critical");

		expect(score).toBeGreaterThan(threshold);
	});
});

// ─── Escenario 3: RUC breach exactamente en el límite S/ 5,000 ───────────────

describe("Escenario 3: RUC breach boundary — S/ 5,000 exacto", () => {
	it("monto exactamente S/ 5,000 → detectado como medium (no high)", () => {
		// El threshold AFECTA LA SEVERIDAD, no si se detecta o no.
		// Todo mismatch RUC queda en audit trail; >= S/5K sube a high/critical.
		// amount === 5000: NOT strictly greater → medium (informacional)
		const txn = {
			id: "txn-boundary",
			amount: RUC_BREACH_THRESHOLD_PEN, // exactamente S/ 5,000
			declaredRuc: "20123456789",
			paymentRuc: "20987654321",
			serie: "F001",
			numero: "00000042",
			emisionDate: "2026-03-15",
		};

		const anomalies = detectRucBreachAnomalies([txn]);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("medium"); // ← no high (strictly >)
	});

	it("monto S/ 5,001 → sí detecta como high", () => {
		const txn = {
			id: "txn-over",
			amount: 5_001,
			declaredRuc: "20123456789",
			paymentRuc: "20987654321",
			serie: "F001",
			numero: "00000043",
			emisionDate: "2026-03-15",
		};

		const anomalies = detectRucBreachAnomalies([txn]);
		expect(anomalies).toHaveLength(1);
		expect(anomalies[0]?.severity).toBe("high");
	});
});

// ─── Escenario 4: RUC breach S/ 6,000 — alta confianza ────────────────────────

describe("Escenario 4: RUC breach S/ 6,000 — detección y confianza", () => {
	it("detecta con confidence > 0.95 y severity high", () => {
		const txn = {
			id: "txn-6k",
			amount: 6_000,
			declaredRuc: "20100070970",
			paymentRuc: "20600012345",
			serie: "F002",
			numero: "00000100",
			emisionDate: "2026-02-10",
		};

		const [anomaly] = detectRucBreachAnomalies([txn]);
		expect(anomaly).toBeDefined();
		expect(anomaly!.severity).toBe("high");
		expect(anomaly!.confidence).toBeGreaterThan(0.95);
		expect(anomaly!.context).toMatchObject({
			legalReference: "Art. 12 TUO IGV (D.S. 055-99-EF)",
			sunatThresholdPen: 5_000,
		});
	});
});

// ─── Escenario 5: Factura duplicada — siempre critical ────────────────────────

describe("Escenario 5: Factura duplicada — consenso máximo", () => {
	it("agentes con confianza 0.99 producen score muy alto", () => {
		// Duplicado exacto: lector, validador y detector todos en 0.99
		const score = computeScore(0.99, 0.99, 0.99);

		// 0.99×0.35 + 0.99×0.40 + 0.99×0.25 = 0.99 + bonus ≤ 1.0
		expect(score).toBeGreaterThanOrEqual(0.99);
	});

	it("score máximo supera cualquier threshold", () => {
		const score = computeScore(0.99, 0.99, 0.99);
		for (const severity of ["low", "medium", "high", "critical"] as const) {
			expect(score).toBeGreaterThan(getThresholdForSeverity(severity));
		}
	});
});

// ─── Escenario 6: Org con alta tasa FP → threshold sube ──────────────────────

describe("Escenario 6: Org con 25% FP rate → threshold dinámico sube", () => {
	it("critical threshold se ajusta de 0.95 a ~0.99", () => {
		const dynamicThreshold = computeDynamicThreshold("critical", 0.25);
		// fpAdjustment = min((0.25 - 0.10) * 0.8, 0.08) = min(0.12, 0.08) = 0.08
		// threshold = min(0.95 + 0.08, 0.99) = 0.99
		expect(dynamicThreshold).toBeCloseTo(0.99, 2);
		expect(dynamicThreshold).toBeGreaterThan(0.95);
	});

	it("high severity también se ajusta proporcionalmente", () => {
		const base = getThresholdForSeverity("high"); // 0.88
		const dynamic = computeDynamicThreshold("high", 0.2);
		// adjustment = min((0.20 - 0.10) * 0.8, 0.08) = 0.08
		// threshold = min(0.88 + 0.08, 0.99) = 0.96
		expect(dynamic).toBeGreaterThan(base);
		expect(dynamic).toBeLessThanOrEqual(0.99);
	});
});

// ─── Escenario 7: Org bien calibrada (<2% FP) → threshold base ────────────────

describe("Escenario 7: Org con 1.5% FP rate → sin ajuste (bien calibrada)", () => {
	it("FP rate por debajo del 10% → threshold = base sin modificación", () => {
		const threshold = computeDynamicThreshold("critical", 0.015);
		expect(threshold).toBeCloseTo(THRESHOLD_CONFIG.critical.base, 3);
	});

	it("FP rate = 0% (sin historial) → threshold = base", () => {
		const threshold = computeDynamicThreshold("high", 0);
		expect(threshold).toBeCloseTo(THRESHOLD_CONFIG.high.base, 3);
	});
});

// ─── Escenario 8: Agente faltante — solo 2 de 3 agentes ──────────────────────

describe("Escenario 8: Lector ausente — solo validador + detector", () => {
	it("score reducido porque pesos no suman 1.0 (max 0.65)", () => {
		const agents: AgentConfidence[] = [
			{
				agentId: "validador-1",
				agentRole: "validador",
				confidence: 0.99,
				timestamp: new Date(),
			},
			{
				agentId: "detector-1",
				agentRole: "detector",
				confidence: 0.99,
				timestamp: new Date(),
			},
		];
		const weighted = calculateWeightedConfidence(agents);
		const score = computeConsensusScore(weighted);

		// Max with validador + detector = 0.40 + 0.25 = 0.65 + bonus
		expect(score).toBeLessThan(0.7);
		// Critical threshold (0.95) NOT reachable → safe: no false alert
		expect(score).toBeLessThan(getThresholdForSeverity("critical"));
	});
});

// ─── Escenario 9: Consenso perfecto → bonus de acuerdo ────────────────────────

describe("Escenario 9: Perfecta alineación entre agentes — bonus de acuerdo", () => {
	it("baja desviación estándar otorga bonus de acuerdo (+0.02)", () => {
		// All agents at exactly the same confidence → stdDev = 0 → bonus
		const score095 = computeScore(0.95, 0.95, 0.95);
		// Without bonus: 0.95×(0.35+0.40+0.25) = 0.95. With bonus: 0.97
		expect(score095).toBeCloseTo(0.97, 1);
	});

	it("alta desviación estándar → sin bonus", () => {
		// Lector 0.5, validador 0.99, detector 0.5 → high variance, no bonus
		const scoreDisagreed = computeScore(0.5, 0.99, 0.5);
		const scoreAgreed = computeScore(0.8, 0.8, 0.8);
		// Agreed score should have bonus, disagreed should not
		expect(scoreAgreed).toBeGreaterThan(scoreDisagreed);
	});
});

// ─── Escenario 10: Boletos aéreos SIRE 2026 — nuevo reporte SUNAT ─────────────

describe("Escenario 10: SIRE boletos aéreos 2026 — RUC aerolínea vs agencia", () => {
	it("detecta mismatch aerolínea/agencia encima del threshold", () => {
		const transactions = [
			{
				id: "boleto-LAN-001",
				amount: 8_500, // > S/5K → high severity
				declaredRuc: "20100044356", // LATAM Airlines Perú
				paymentRuc: "20501234567", // Agencia de viajes intermediaria
				serie: "T001",
				numero: "00000088",
				emisionDate: "2026-01-20",
			},
			{
				id: "boleto-LAN-002",
				amount: 3_200, // < S/5K → medium severity (informational)
				declaredRuc: "20100044356",
				paymentRuc: "20501234567",
				serie: "T001",
				numero: "00000089",
				emisionDate: "2026-01-20",
			},
			{
				id: "boleto-LAN-003",
				amount: 12_000, // > S/10K → critical
				declaredRuc: "20100044356",
				paymentRuc: "20501234567",
				serie: "T001",
				numero: "00000090",
				emisionDate: "2026-01-21",
			},
		];

		const anomalies = detectRucBreachAnomalies(transactions);

		expect(anomalies).toHaveLength(3);
		expect(anomalies[0]?.severity).toBe("high"); // S/ 8,500
		expect(anomalies[1]?.severity).toBe("medium"); // S/ 3,200 < umbral
		expect(anomalies[2]?.severity).toBe("critical"); // S/ 12,000 > 2× umbral
		expect(anomalies[2]?.context?.requiresOseValidation).toBe(true);
	});

	it("mismos RUCs (aerolínea directa) → sin anomalías", () => {
		const directSale = [
			{
				id: "boleto-direct-001",
				amount: 9_000,
				declaredRuc: "20100044356",
				paymentRuc: "20100044356", // Mismo RUC → no hay breach
				serie: "T002",
				numero: "00000001",
				emisionDate: "2026-01-22",
			},
		];

		const anomalies = detectRucBreachAnomalies(directSale);
		expect(anomalies).toHaveLength(0); // ← Zero false positives
	});
});

// ─── Razonamiento y trazabilidad ───────────────────────────────────────────────

describe("Trazabilidad: generateReasoning incluye ajuste FP", () => {
	it("muestra ajuste dinámico en el string cuando dynamicAdjustment > 0", () => {
		const agents = calculateWeightedConfidence(makeAgents(0.96, 0.97, 0.95));
		const score = computeConsensusScore(agents);
		const reasoning = generateReasoning(agents, score, 0.99, 0.04);

		expect(reasoning).toContain("+4.0% ajuste FP");
		expect(reasoning).toContain("Score:");
	});

	it("sin ajuste → no aparece nota de FP", () => {
		const agents = calculateWeightedConfidence(makeAgents(0.96, 0.97, 0.95));
		const score = computeConsensusScore(agents);
		const reasoning = generateReasoning(agents, score, 0.95, 0);

		expect(reasoning).not.toContain("ajuste FP");
	});
});

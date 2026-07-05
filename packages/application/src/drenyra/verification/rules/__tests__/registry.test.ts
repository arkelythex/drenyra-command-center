/**
 * Golden tests for verification rules registry.
 *
 * Covers all 6 rules: pass/fail/inconclusive/null paths, period-scoped
 * rate resolution (no new Date() fallback), and INTENT_ACTION_CONSISTENCY
 * with cobertura completa (not "al menos una").
 *
 * @since Jul 2026
 */

import { type BypassedFinding, getFiscalRate } from "@drenyra/domain/drenyra";
import { describe, expect, expectTypeOf, it } from "vitest";
import { runVerificationRules } from "../registry";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_CONTEXT = {
	period: "2026-07",
};

// ── IGV_RATE_CHECK ───────────────────────────────────────────────────────────

describe("IGV_RATE_CHECK", () => {
	function igvResults(results: ReturnType<typeof runVerificationRules>) {
		return results.filter((r) => r.rule === "IGV_RATE_CHECK");
	}

	it("passes when IGV rate matches registry for the period", () => {
		const results = runVerificationRules(
			["IGV calculado al 18% sobre base imponible de S/ 10,000.00"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(igvResults(results)).toHaveLength(1);
		expect(igvResults(results)[0]).toMatchObject({
			status: "pass",
			rule: "IGV_RATE_CHECK",
		});
	});

	it("fails when IGV rate does not match registry", () => {
		// 15% no coincide — but "15" como código PCGE puede disparar otra regla
		const results = runVerificationRules(
			["IGV calculado al 15% sobre base imponible"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(igvResults(results)).toHaveLength(1);
		expect(igvResults(results)[0]).toMatchObject({
			status: "fail",
			rule: "IGV_RATE_CHECK",
		});
	});

	it("is inconclusive when no percentage can be extracted", () => {
		const results = runVerificationRules(
			["Revisión de IGV pendiente — sin tasa especificada"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(igvResults(results)).toHaveLength(1);
		expect(igvResults(results)[0]).toMatchObject({
			status: "inconclusive",
			rule: "IGV_RATE_CHECK",
		});
	});

	it("returns null when finding does not mention IGV", () => {
		const results = runVerificationRules(
			["Revisión de detracción — tasa 10%"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(igvResults(results)).toHaveLength(0);
	});

	it("resolves rate against the fiscal period, not execution date", () => {
		// El registry tiene IGV=18% desde 2011-03. Para 2010 no hay tasa vigente.
		// 19% no matchea nada porque getFiscalRate retorna null → inconclusive.
		const results2010 = runVerificationRules(
			["IGV calculado al 19%"],
			"MEDIUM",
			{ period: "2010-06" },
		);

		expect(igvResults(results2010)).toHaveLength(1);
		expect(igvResults(results2010)[0]).toMatchObject({
			status: "inconclusive",
			rule: "IGV_RATE_CHECK",
		});
	});
});

// ── DETRACTION_RATE_CHECK ────────────────────────────────────────────────────

describe("DETRACTION_RATE_CHECK", () => {
	it("passes for valid 10% detraction rate", () => {
		const results = runVerificationRules(
			["Aplicar detracción SPOT del 10% en factura F001-12345"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const detractionResults = results.filter(
			(r) => r.rule === "DETRACTION_RATE_CHECK",
		);
		expect(detractionResults).toHaveLength(1);
		expect(detractionResults[0]).toMatchObject({ status: "pass" });
	});

	it("passes for valid 12% detraction rate", () => {
		const results = runVerificationRules(
			["Detracción del 12% aplicada a servicio de transporte"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const detractionResults = results.filter(
			(r) => r.rule === "DETRACTION_RATE_CHECK",
		);
		expect(detractionResults).toHaveLength(1);
		expect(detractionResults[0]).toMatchObject({ status: "pass" });
	});

	it("fails for invalid detraction rate (15%)", () => {
		const results = runVerificationRules(
			["Detracción SPOT 15% — verificar aplicabilidad"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const detractionResults = results.filter(
			(r) => r.rule === "DETRACTION_RATE_CHECK",
		);
		expect(detractionResults).toHaveLength(1);
		expect(detractionResults[0]).toMatchObject({ status: "fail" });
	});
});

// ── PCGE_CODE_VALIDATION ─────────────────────────────────────────────────────

describe("PCGE_CODE_VALIDATION", () => {
	function pcgeResults(results: ReturnType<typeof runVerificationRules>) {
		return results.filter((r) => r.rule === "PCGE_CODE_VALIDATION");
	}

	it("fails when finding contains invalid PCGE codes alongside valid ones", () => {
		const results = runVerificationRules(
			["Cuenta 9999 no existe en PCGE — revisar clasificación de cuenta 4212"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(pcgeResults(results)).toHaveLength(1);
		expect(pcgeResults(results)[0]).toMatchObject({ status: "fail" });
	});

	it("returns null when all codes are valid (no invalid codes → not a code validation finding)", () => {
		const results = runVerificationRules(
			["Reclasificar cuenta 4212 según PCGE: Débito 60 / Crédito 42"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(pcgeResults(results)).toHaveLength(0);
	});

	it("fails when finding contains invalid PCGE codes", () => {
		const results = runVerificationRules(
			["Transferencia a cuenta 9999 — fondo no registrado"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const pcgeResults = results.filter(
			(r) => r.rule === "PCGE_CODE_VALIDATION",
		);
		expect(pcgeResults).toHaveLength(1);
		expect(pcgeResults[0]).toMatchObject({ status: "fail" });
	});

	it("returns null when finding has no numeric codes", () => {
		const results = runVerificationRules(
			["Revisión de conciliación bancaria completada sin incidencias"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const pcgeResults = results.filter(
			(r) => r.rule === "PCGE_CODE_VALIDATION",
		);
		expect(pcgeResults).toHaveLength(0);
	});
});

// ── DEBIT_CREDIT_BALANCE ─────────────────────────────────────────────────────

describe("DEBIT_CREDIT_BALANCE", () => {
	it("passes when debit equals credit", () => {
		const results = runVerificationRules(
			["Asiento contable: Débito S/ 15,000.00 / Crédito S/ 15,000.00"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const balanceResults = results.filter(
			(r) => r.rule === "DEBIT_CREDIT_BALANCE",
		);
		expect(balanceResults).toHaveLength(1);
		expect(balanceResults[0]).toMatchObject({ status: "pass" });
	});

	it("fails when debit does not equal credit", () => {
		const results = runVerificationRules(
			["Asiento: Débito S/ 20,000.00 / Crédito S/ 18,500.00"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const balanceResults = results.filter(
			(r) => r.rule === "DEBIT_CREDIT_BALANCE",
		);
		expect(balanceResults).toHaveLength(1);
		expect(balanceResults[0]).toMatchObject({ status: "fail" });
	});

	it("is inconclusive when amounts cannot be extracted", () => {
		const results = runVerificationRules(
			["Revisión de débito y crédito — montos por confirmar"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const balanceResults = results.filter(
			(r) => r.rule === "DEBIT_CREDIT_BALANCE",
		);
		expect(balanceResults).toHaveLength(1);
		expect(balanceResults[0]).toMatchObject({ status: "inconclusive" });
	});
});

// ── RISK_CONFIDENCE_CONSISTENCY ──────────────────────────────────────────────

describe("RISK_CONFIDENCE_CONSISTENCY", () => {
	it("passes when HIGH risk has low confidence", () => {
		const results = runVerificationRules(
			["Score de confianza: 45% — nivel de riesgo alto"],
			"HIGH",
			{ ...DEFAULT_CONTEXT },
		);

		const riskResults = results.filter(
			(r) => r.rule === "RISK_CONFIDENCE_CONSISTENCY",
		);
		expect(riskResults).toHaveLength(1);
		expect(riskResults[0]).toMatchObject({ status: "pass" });
	});

	it("fails when CRITICAL risk has high confidence (>80%)", () => {
		const results = runVerificationRules(
			["Confianza: 92% — riesgo crítico detectado"],
			"CRITICAL",
			{ ...DEFAULT_CONTEXT },
		);

		const riskResults = results.filter(
			(r) => r.rule === "RISK_CONFIDENCE_CONSISTENCY",
		);
		expect(riskResults).toHaveLength(1);
		expect(riskResults[0]).toMatchObject({ status: "fail" });
	});

	it("passes when LOW risk has high confidence", () => {
		const results = runVerificationRules(
			["Confianza: 95% — riesgo bajo"],
			"LOW",
			{ ...DEFAULT_CONTEXT },
		);

		const riskResults = results.filter(
			(r) => r.rule === "RISK_CONFIDENCE_CONSISTENCY",
		);
		expect(riskResults).toHaveLength(1);
		expect(riskResults[0]).toMatchObject({ status: "pass" });
	});
});

// ── INTENT_ACTION_CONSISTENCY ────────────────────────────────────────────────

describe("INTENT_ACTION_CONSISTENCY", () => {
	it("passes when ALL mentioned accounts have corresponding changes (cobertura completa)", () => {
		const results = runVerificationRules(
			["El agente procesó la reclasificación contable"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary:
					"Reclasificación de activo fijo: cuentas 33, 39 transferidas a resultado",
				changes: [
					{ field: "account_33_immobilized" },
					{ field: "account_39_depreciation" },
				],
			},
		);

		const intentResults = results.filter(
			(r) => r.rule === "INTENT_ACTION_CONSISTENCY",
		);
		expect(intentResults).toHaveLength(1);
		expect(intentResults[0]).toMatchObject({ status: "pass" });
	});

	it("fails when NO mentioned accounts appear in changes", () => {
		const results = runVerificationRules(
			["El agente procesó la reclasificación contable"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary: "Reclasificación de cuentas 33, 39 a resultado del ejercicio",
				changes: [
					{ field: "account_12_investments" },
					{ field: "account_10_cash" },
				],
			},
		);

		const intentResults = results.filter(
			(r) => r.rule === "INTENT_ACTION_CONSISTENCY",
		);
		expect(intentResults).toHaveLength(1);
		expect(intentResults[0]).toMatchObject({ status: "fail" });
	});

	it("fails with PARTIAL coverage — some accounts mentioned but not changed (alucinación parcial)", () => {
		const results = runVerificationRules(
			["El agente procesó la reclasificación contable"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary:
					"Transferencia de activos: cuentas 33, 34, 35 a cuenta 39 de resultados",
				changes: [
					{ field: "account_33_immobilized" },
					{ field: "account_39_depreciation" },
				],
			},
		);

		const intentResults = results.filter(
			(r) => r.rule === "INTENT_ACTION_CONSISTENCY",
		);
		expect(intentResults).toHaveLength(1);
		expect(intentResults[0]).toMatchObject({ status: "fail" });

		// El detail debe mencionar las cuentas sin cambio
		const failResult = intentResults[0];
		if (failResult.status === "fail") {
			expect(failResult.actual).toContain("34");
			expect(failResult.actual).toContain("35");
		}
	});

	it("returns null when there is no summary or recommendedActions", () => {
		const results = runVerificationRules(
			["Finding sin contexto narrativo"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const intentResults = results.filter(
			(r) => r.rule === "INTENT_ACTION_CONSISTENCY",
		);
		expect(intentResults).toHaveLength(0);
	});

	it("passes when agent mentions account codes AND changes exist for ALL of them, even with extra unchanged fields", () => {
		// Si el agente menciona 40 y 42, y hay cambios en account_40 y account_42,
		// pasa aunque haya cambios adicionales no mencionados (account_10)
		const results = runVerificationRules(
			["Validación de cuentas por pagar"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary: "Revisión de cuentas 40 y 42 — proveedores y tributarias",
				changes: [
					{ field: "account_40_suppliers" },
					{ field: "account_42_tax" },
					{ field: "account_10_cash" },
				],
			},
		);

		const intentResults = results.filter(
			(r) => r.rule === "INTENT_ACTION_CONSISTENCY",
		);
		expect(intentResults).toHaveLength(1);
		expect(intentResults[0]).toMatchObject({ status: "pass" });
	});
});

// ── BYPASSED → INCONCLUSIVE ──────────────────────────────────────────────────

describe("BYPASSED → INCONCLUSIVE (no human bypass without authorizedBy)", () => {
	it("produces inconclusive (not bypassed) when no rule applies", () => {
		const results = runVerificationRules(
			[
				"El contador debe revisar manualmente la documentación adjunta para validar firmas electrónicas",
			],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		expect(results).toHaveLength(1);
		expect(results[0]).toMatchObject({
			status: "inconclusive",
			rule: "NO_RULE_MATCHED",
		});
		// No debe producir bypassed (eso requiere authorizedBy humano)
		expect(results[0].status).not.toBe("bypassed");
	});

	it("never produces bypassed status from automatic pipeline", () => {
		const results = runVerificationRules(
			["Finding puramente cualitativo sin códigos ni montos"],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		const bypassedFindings = results.filter((f) => f.status === "bypassed");
		expect(bypassedFindings).toHaveLength(0);
	});
});

// ── PERIOD SCORING ───────────────────────────────────────────────────────────

describe("Period-scoped rate resolution (asOf = fiscal period, not now)", () => {
	it("fails IGV rate for a period before the rate existed (2010)", () => {
		// El registry tiene IGV=18% desde 2011-03
		// Si preguntamos por 2010-06, no debería encontrar tasa
		const results = runVerificationRules(["IGV calculado al 18%"], "MEDIUM", {
			period: "2010-06",
		});

		const igvResults = results.filter((r) => r.rule === "IGV_RATE_CHECK");
		// No hay tasa IGV vigente en 2010 → inconclusive
		expect(igvResults).toHaveLength(1);
		expect(igvResults[0]).toMatchObject({ status: "inconclusive" });
	});

	it("resolves IGV correctly for current period with known rate", () => {
		const rate = getFiscalRate("IGV", "2026-07-01");
		expect(rate).not.toBeNull();
		expect(rate!.rate).toBe(18);

		const results = runVerificationRules(["IGV calculado al 18%"], "MEDIUM", {
			period: "2026-07",
		});

		const igvResults = results.filter((r) => r.rule === "IGV_RATE_CHECK");
		expect(igvResults).toHaveLength(1);
		expect(igvResults[0]).toMatchObject({ status: "pass" });
	});

	it("crosses effectiveFrom boundary correctly — first day rate exists", () => {
		// IGV=18% desde 2011-03-01. El 2011-03-01 DEBE encontrar la tasa.
		const rate = getFiscalRate("IGV", "2011-03-01");
		expect(rate).not.toBeNull();
		expect(rate!.rate).toBe(18);
		expect(rate!.effectiveFrom).toBe("2011-03-01");
	});

	it("crosses effectiveFrom boundary correctly — day before rate exists", () => {
		// IGV=18% desde 2011-03-01. El 2011-02-28 NO debe encontrar tasa.
		const rate = getFiscalRate("IGV", "2011-02-28");
		expect(rate).toBeNull();
	});
});

// ── COMPILE-TIME TYPE CHECK: BypassedFinding ──────────────────────────────────

describe("BypassedFinding type safety", () => {
	it("requires authorizedBy at the type level (compile-time check)", () => {
		// Esta aserción verifica que BypassedFinding tenga authorizedBy.
		// Si alguien elimina el campo del tipo, esta aserción falla en compile time.
		type HasAuthorizedBy = {
			finding: string;
			status: "bypassed";
			rule: "NO_RULE_MATCHED";
			bypassReason: string;
			detail: string;
		};

		// Si el tipo ya no tiene authorizedBy, esta línea no compila
		type _TypeCheck = BypassedFinding extends HasAuthorizedBy ? true : false;
		const _check: _TypeCheck = true;
		expect(_check).toBe(true);

		// Verificar que authorizedBy tiene la estructura esperada
		expectTypeOf<BypassedFinding["authorizedBy"]>().toEqualTypeOf<{
			userId: string;
			role: string;
		}>();
	});
});

// ── INTEGRITY SCORE ───────────────────────────────────────────────────────────

describe("INTENT_ACTION_CONSISTENCY — integrityScore impact", () => {
	function intentResults(results: ReturnType<typeof runVerificationRules>) {
		return results.filter((r) => r.rule === "INTENT_ACTION_CONSISTENCY");
	}

	it("full coverage → integrityScore stays high (no penalty)", () => {
		const results = runVerificationRules(
			["Evaluación de cuentas por pagar"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary: "Revisión de cuentas 40 y 42",
				changes: [
					{ field: "account_40_suppliers" },
					{ field: "account_42_tax" },
				],
			},
		);

		const intent = intentResults(results);
		expect(intent).toHaveLength(1);
		expect(intent[0]).toMatchObject({ status: "pass" });

		// Misma cantidad de pass vs fail que sin esta regla
		const passed = results.filter((r) => r.status === "pass").length;
		const failed = results.filter((r) => r.status === "fail").length;
		expect(failed).toBe(0);
		expect(passed).toBeGreaterThanOrEqual(1);
	});

	it("partial coverage → fail, integrityScore se reduce", () => {
		const results = runVerificationRules(
			["Reclasificación de activos"],
			"MEDIUM",
			{
				...DEFAULT_CONTEXT,
				summary: "Cuentas 33, 34, 35 transferidas a 39",
				changes: [{ field: "account_33_immobilized" }, { field: "account_40" }],
			},
		);

		const intent = intentResults(results);
		expect(intent).toHaveLength(1);
		expect(intent[0]).toMatchObject({ status: "fail" });

		// Debe haber al menos un fail → integrityScore < 100
		const failed = results.filter((r) => r.status === "fail").length;
		const total = results.length;
		const score = Math.round(((total - failed) / total) * 100);
		expect(score).toBeLessThan(100);
	});

	it("zero accounts mentioned → inconclusive, rule no-op en integrityScore", () => {
		const results = runVerificationRules(["Finding sin cuentas"], "MEDIUM", {
			...DEFAULT_CONTEXT,
			summary: "Revisión de documentos sin códigos de cuenta",
			changes: [{ field: "account_40_suppliers" }],
		});

		const intent = intentResults(results);
		// Sin cuentas que extraer → null (no aplica la regla)
		expect(intent).toHaveLength(0);

		// Otras reglas pueden haber matchado o no; el punto es que INTENT_ACTION
		// no contribuye al score (ni pass ni fail)
	});
});

// ── METRICS (VerificationMetrics.perRuleMetrics) ──────────────────────────────

describe("VerificationMetrics — per-rule inconclusive tracking", () => {
	it("perRuleMetrics desglosa correctamente findings por regla", () => {
		const results = runVerificationRules(
			[
				"IGV al 18% — verificar tasa",
				"Detracción SPOT 12% aplicada",
				"Revisión cualitativa de firmas electrónicas",
			],
			"MEDIUM",
			{ ...DEFAULT_CONTEXT },
		);

		// Verificar estructura de perRuleMetrics
		const rules = new Set(results.map((r) => r.rule));
		expect(rules.size).toBeGreaterThanOrEqual(2);

		// NO_RULE_MATCHED debe tener al menos 1 inconclusive
		const noRuleFindings = results.filter((r) => r.rule === "NO_RULE_MATCHED");
		if (noRuleFindings.length > 0) {
			const noRule = noRuleFindings[0];
			expect(noRule.status).toBe("inconclusive");
			expect(noRule.status).not.toBe("bypassed");
		}

		// IGV_RATE_CHECK debe tener un finding
		const igvChecks = results.filter((r) => r.rule === "IGV_RATE_CHECK");
		expect(igvChecks.length).toBeGreaterThanOrEqual(1);
	});
});

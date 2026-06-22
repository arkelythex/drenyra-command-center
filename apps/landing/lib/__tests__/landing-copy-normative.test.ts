import { describe, expect, it } from "vitest";

import { DRENYRA_SUBAGENTS } from "@arkelythex/drenyra-core";
import { V2_LANDING_COPY } from "@/lib/constants/copy";
import { DRENYRA_ENGINE_COPY } from "@/lib/landing/copy";

/**
 * Guardrails mínimos: copy público no debe reintroducir formulaciones vetadas en
 * NORMATIVE_TRACE.md / claim-register (p. ej. "Fusiodo" como enlace SUNAT en vivo).
 */
describe("V2_LANDING_COPY normative guardrails", () => {
	it("FAQ declara trámite portal salvo integraciones acordadas", () => {
		const detail = V2_LANDING_COPY.faqSection.quickSignals[0]?.detail ?? "";
		expect(detail.toLowerCase()).toContain("portal sunat");
	});

	it("copy público Drenyra de home evita autonomía absoluta y cierres invulnerables", () => {
		const corpus = JSON.stringify(V2_LANDING_COPY.drenyraEngine).toLowerCase();
		expect(corpus).not.toMatch(
			/agente aut[oó]nomo|autonom[ií]a total|invulnerable/,
		);
		expect(corpus).toContain("revisión humana");
	});
});

describe("DRENYRA_ENGINE_COPY compliance and subagent catalog", () => {
	it("incluye los 8 subagentes funcionales derivados del canonical DRENYRA_SUBAGENTS", () => {
		const names = DRENYRA_ENGINE_COPY.features.items.map((item) => item.title);
		const canonicalNames = DRENYRA_SUBAGENTS.map((a) => a.name);
		expect(names).toEqual(canonicalNames);
		expect(names).toHaveLength(8);
	});

	it("evita claims absolutos de cumplimiento autónomo y métricas públicas sin sustento", () => {
		const corpus = JSON.stringify(DRENYRA_ENGINE_COPY).toLowerCase();
		const bannedPatterns = [
			/cumplimiento autom[aá]tico/,
			/aut[oó]nomo/,
			/sin revisi[oó]n humana/,
			/garantiza/,
			/aceptaci[oó]n sunat garantizada/,
			/presenta autom[aá]ticamente/,
			/\b\d+(?:[.,]\d+)?%/,
			/\b\d+k\+?/,
			/\b\d+\+\s*(?:empresas|clientes|documentos)/,
		];

		for (const pattern of bannedPatterns) {
			expect(pattern.test(corpus)).toBe(false);
		}

		expect(corpus).toContain("prevalid");
		expect(corpus).toContain("aprobación humana");
	});
});

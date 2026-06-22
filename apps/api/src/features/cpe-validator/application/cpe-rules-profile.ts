/**
 * CPE_RULES_PROFILE const.
 *
 * @example
 * ```ts
 * console.log(CPE_RULES_PROFILE);
 * ```
 */
export const CPE_RULES_PROFILE = {
	source: "SUNAT CPE - Reglas de Validacion",
	lastOfficialReviewDate: "2026-02-09",
	coverage: {
		offlineUblStructure: "partial",
		fullXsdValidation: true,
		sunatApiModes: ["sandbox", "replay", "real"] as const,
	},
	notes: [
		"Arkelythex tracks the SUNAT ruleset published as updated on 2026-02-09.",
		"Current enforcement is partial but stronger: well-formedness, required UBL structure, Feb 2026 structural checks, product classification observations (OBS-3496), expanded IGV percentage baseline, and SUNAT API status checks.",
		"Full parity with the complete SUNAT validation matrix still requires XSD/schema coverage and explicit regression fixtures for new rule codes.",
	],
} as const;

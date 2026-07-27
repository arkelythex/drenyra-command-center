/**
 * Risk tiers and jurisdictions for fiscal agents.
 */

/**
 * Fiscal risk tiers — aligned with Drenyra's R0-R3 model.
 */
export type RiskTier = "R0" | "R1" | "R2" | "R3";

/**
 * Jurisdictions for fiscal agents.
 * ISO 3166-1 alpha-2 country codes, plus special codes.
 */
export type Jurisdiction =
	| "PE" // Peru
	| "CL" // Chile
	| "CO" // Colombia
	| "MX" // Mexico
	| "AR" // Argentina
	| "BR" // Brazil
	| "GLOBAL"
	| string; // Extensible

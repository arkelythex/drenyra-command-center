/** U3c.2 — C7 gate (criterion 13): C7 is closed by default (`not-required`) and opens only through ONE atomic
 * decision requiring all seven proofs plus core-owner authority evidence; C7 is at most `planning` from the
 * umbrella (never executable — the core owner owns the child SDD); partial opening is forbidden
 * (`C7_TRIGGER_INCOMPLETE`); cleanup/migration/speculative-reuse/freshness/convenience/shim-aesthetics triggers
 * are rejected; a safe consumer-local correction stays with the consumer. Whole integers only — no monetary floats. */
import {
	BEYOND_PLANNING,
	dedupeSorted,
	isRecord,
	passedEvidenceEntries,
} from "./validation-utils.js";

const SEVEN_PROOFS = [
	"reproducible-case",
	"contract-behavior",
	"ownership-rationale",
	"smallest-correction",
	"independent-child-sdd",
	"versioning-policy",
	"release-pin-verify",
] as const;
const REJECTED_TRIGGERS = [
	"cleanup",
	"migration",
	"speculative-reuse",
	"freshness",
	"convenience",
	"shim-aesthetics",
] as const;
const CORE_OWNER_AUTHORITY = "c7-authority: core-owner";
export interface C7GateData {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
}
function c7ClaimTokens(data: C7GateData): string {
	const tokens: string[] = [];
	for (const { entry } of passedEvidenceEntries(data.evidence)) {
		if (entry.child !== "C7" || typeof entry.check_result !== "string")
			continue;
		tokens.push(entry.check_result);
	}
	return tokens.join(" ");
}
export function c7GateErrors(data: C7GateData): string[] {
	const c7 = isRecord(data.children) ? data.children.C7 : undefined;
	if (!isRecord(c7)) return [];
	const errors: string[] = [];
	const state = typeof c7.program_state === "string" ? c7.program_state : "";
	const tokens = c7ClaimTokens(data);
	for (const trigger of REJECTED_TRIGGERS)
		if (tokens.includes(`c7-trigger: ${trigger}`))
			errors.push(`resolver: c7 gate: rejected trigger class ${trigger}`);
	if (tokens.includes("c7-resolution: consumer-local"))
		errors.push(
			"resolver: c7 gate: safe consumer-local correction stays with the consumer",
		);
	if ((BEYOND_PLANNING as readonly string[]).includes(state))
		errors.push(
			"resolver: c7 gate: C7 at most planning from the umbrella — never executable",
		);
	if (state === "planning") {
		const missing: string[] = SEVEN_PROOFS.filter(
			(proof) => !tokens.includes(`c7-proof: ${proof}`),
		);
		if (!tokens.includes(CORE_OWNER_AUTHORITY))
			missing.push("core-owner-authority");
		if (missing.length > 0)
			errors.push(
				`resolver: c7 gate: C7_TRIGGER_INCOMPLETE — missing ${missing.join(", ")}`,
			);
	}
	return dedupeSorted(errors);
}

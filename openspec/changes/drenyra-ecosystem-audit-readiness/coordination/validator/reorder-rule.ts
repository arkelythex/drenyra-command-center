/** U2c.2 — reorder-rule hardening (criterion 8): a C2/C3 reorder passes only with valid no-overlap dependency evidence plus a ledger decision event; reorder without proof fails closed; C1 precedence never bypassable. Whole integers only — no monetary floats. */
import {
	dedupeSorted,
	isRecord,
	MUTABLE_REVISION,
} from "./validation-utils.js";
export interface ReorderData {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	events?: unknown[];
}
function recordedC2Deps(data: ReorderData): string[] {
	const c2 = data.children?.C2;
	if (isRecord(c2) && Array.isArray(c2.dependencies)) {
		const deps = (c2.dependencies as unknown[]).filter(
			(d): d is string => typeof d === "string",
		);
		if (deps.length > 0) return deps;
	}
	return ["C1"];
}
function reorderDecisionEvent(
	data: ReorderData,
): Record<string, unknown> | null {
	if (!Array.isArray(data.events)) return null;
	for (const event of data.events) {
		if (!isRecord(event) || event.kind !== "decision") continue;
		if (event.child !== "C2" && event.child !== "C3") continue;
		if (
			typeof event.reason === "string" &&
			event.reason.toLowerCase().includes("reorder")
		)
			return event;
	}
	return null;
}
function hasNoOverlapEvidence(
	data: ReorderData,
	decision: Record<string, unknown>,
): boolean {
	const refs = Array.isArray(decision.evidence_refs)
		? (decision.evidence_refs as unknown[]).filter(
				(ref): ref is string => typeof ref === "string",
			)
		: [];
	if (refs.length === 0) return false;
	const evidence = isRecord(data.evidence) ? data.evidence : {};
	for (const ref of refs) {
		const entry = evidence[ref];
		if (
			!isRecord(entry) ||
			entry.kind !== "dependency" ||
			entry.result !== "passed"
		)
			continue;
		if (
			typeof entry.check_result !== "string" ||
			!entry.check_result.toLowerCase().includes("no-overlap")
		)
			continue;
		if (
			typeof entry.revision !== "string" ||
			MUTABLE_REVISION.includes(entry.revision)
		)
			continue;
		return true;
	}
	return false;
}
export function reorderRuleErrors(data: ReorderData): string[] {
	const errors: string[] = [];
	const decision = reorderDecisionEvent(data);
	const c2Deps = recordedC2Deps(data);
	if (decision !== null) {
		if (!hasNoOverlapEvidence(data, decision))
			errors.push(
				"resolver: reorder rule: C2/C3 reorder decision without no-overlap evidence",
			);
		if (!c2Deps.includes("C1"))
			errors.push(
				"resolver: reorder rule: C2/C3 reorder bypasses C1 precedence (C2)",
			);
	} else if (c2Deps.includes("C3")) {
		errors.push(
			"resolver: reorder rule: C2/C3 reorder without ledger decision event",
		);
	}
	return dedupeSorted(errors);
}

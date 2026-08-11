/** U3a.2 — H02/C1 guard (criteria 4-5): while H02 is review-pending, C1 and its dependents (C2, C3, C4, C6)
 * can never be recorded executable-family — any such claim fails the ledger closed. After H02 advances, C1
 * still needs exact-unit forecast evidence plus pre-apply gate evidence. Alternate/duplicate C1 authority
 * stays rejected by graph-safety (U2b). Whole integers only — no monetary floats. */
import {
	dedupeSorted,
	EXECUTABLE_FAMILY,
	isRecord,
	passedEvidenceEntries,
} from "./validation-utils.js";

const C1_DEPENDENTS = ["C2", "C3", "C4", "C6"] as const;
export interface H02C1Data {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
}
function h02ReviewPending(children: Record<string, unknown>): boolean {
	const c1 = children.C1;
	return isRecord(c1) && c1.observed_status === "review-pending";
}
function claimsExecutableFamily(child: Record<string, unknown>): boolean {
	return (
		typeof child.program_state === "string" &&
		(EXECUTABLE_FAMILY as readonly string[]).includes(child.program_state)
	);
}
function pendingExecutableClaims(children: Record<string, unknown>): string[] {
	const errors: string[] = [];
	for (const id of ["C1", ...C1_DEPENDENTS]) {
		const child = children[id];
		if (isRecord(child) && claimsExecutableFamily(child))
			errors.push(
				`resolver: h02/c1 guard: ${id} executable while H02 review-pending`,
			);
	}
	return errors;
}
function validEvidence(
	data: H02C1Data,
	kind: string,
	check: (entry: Record<string, unknown>) => boolean,
): boolean {
	for (const { entry } of passedEvidenceEntries(data.evidence)) {
		if (entry.kind !== kind || entry.child !== "C1") continue;
		if (check(entry)) return true;
	}
	return false;
}
function hasExactUnitForecast(data: H02C1Data): boolean {
	return validEvidence(
		data,
		"forecast",
		(entry) => typeof entry.unit === "string" && entry.unit.length > 0,
	);
}
function hasPreApplyGates(data: H02C1Data): boolean {
	return validEvidence(
		data,
		"verification",
		(entry) =>
			typeof entry.check_result === "string" && entry.check_result.length > 0,
	);
}
export function h02C1GuardErrors(data: H02C1Data): string[] {
	if (!isRecord(data.children)) return [];
	const errors: string[] = [];
	if (h02ReviewPending(data.children)) {
		errors.push(...pendingExecutableClaims(data.children));
	} else {
		const c1 = data.children.C1;
		if (
			isRecord(c1) &&
			claimsExecutableFamily(c1) &&
			(!hasExactUnitForecast(data) || !hasPreApplyGates(data))
		)
			errors.push(
				"resolver: h02/c1 guard: C1 executable without exact-unit forecast and pre-apply gates",
			);
	}
	return dedupeSorted(errors);
}

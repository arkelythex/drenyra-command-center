/** U4.2 — rollback recomputation (criterion 15). Fail-closed and deterministic: the ledger appends `rolled-back`
 * without deleting history; a rollback event requires verifiable proof (passed rollback-kind evidence at an
 * immutable revision referenced by evidence_refs); a child recorded rolled-back without a rollback event cannot
 * produce a false rolled-back state; descendants relying solely on reverted proof derive
 * blocked/ROLLBACK_INVALIDATED_DEPENDENCY (resolver wiring). No sibling is changed as compensation. Revisions are
 * whole integers only — no monetary floats. */
import {
	dedupeSorted,
	eventEntries,
	isRecord,
	MUTABLE_REVISION,
} from "./validation-utils.js";

const ROLLBACK_KIND = "rollback";
export interface RollbackData {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	events?: unknown[];
}
function referencedEvidence(
	data: RollbackData,
	event: Record<string, unknown>,
): Record<string, unknown>[] {
	const refs = Array.isArray(event.evidence_refs)
		? event.evidence_refs.filter((r): r is string => typeof r === "string")
		: [];
	const evidence = isRecord(data.evidence) ? data.evidence : {};
	const out: Record<string, unknown>[] = [];
	for (const ref of refs) {
		const entry = isRecord(evidence[ref]) ? evidence[ref] : null;
		if (entry !== null) out.push(entry);
	}
	return out;
}
function isVerifiableRollbackProof(
	childId: string,
	entry: Record<string, unknown>,
): boolean {
	return (
		entry.kind === ROLLBACK_KIND &&
		entry.child === childId &&
		entry.result === "passed" &&
		typeof entry.revision === "string" &&
		!(MUTABLE_REVISION as readonly string[]).includes(entry.revision)
	);
}
function rollbackEventErrors(data: RollbackData): string[] {
	const errors: string[] = [];
	for (const event of eventEntries(data.events, ROLLBACK_KIND)) {
		if (typeof event.child !== "string" || event.child === "") continue;
		const proof = referencedEvidence(data, event).filter((entry) =>
			isVerifiableRollbackProof(event.child as string, entry),
		);
		if (proof.length === 0)
			errors.push(
				`rollback: unverifiable rollback proof for ${event.child} (no passed rollback evidence at an immutable revision)`,
			);
	}
	return errors;
}
function recordedRollbackErrors(data: RollbackData): string[] {
	const errors: string[] = [];
	if (!isRecord(data.children)) return errors;
	const rolledBackChildren = new Set(
		eventEntries(data.events, ROLLBACK_KIND).map((event) =>
			typeof event.child === "string" ? event.child : "",
		),
	);
	for (const [id, raw] of Object.entries(data.children)) {
		const child = isRecord(raw) ? raw : null;
		if (
			child !== null &&
			child.program_state === "rolled-back" &&
			!rolledBackChildren.has(id)
		)
			errors.push(
				`rollback: ${id} recorded rolled-back without a rollback event (cannot produce a false rolled-back state)`,
			);
	}
	return errors;
}
export function rollbackRecomputeErrors(data: RollbackData): string[] {
	return dedupeSorted([
		...rollbackEventErrors(data),
		...recordedRollbackErrors(data),
	]);
}

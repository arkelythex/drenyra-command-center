/** U1d.1/U2d.1/U3g.1 — shared validator/resolver helpers. Deterministic error normalization shared by
 * schema-validator (U1b) and semantic-validator (U1c); resolver-family constants (isRecord, HARD_EDGES,
 * MUTABLE_REVISION) shared by resolver (U2a), graph-safety (U2b), and reorder-rule (U2c). U3g.1 adds the
 * guard/contract family helpers shared by the H02/C1 guard (U3a), line policy (U3b), C7 gate (U3c),
 * evidence/research contract (U3d), handoff protocol (U3e), and compatibility import (U3f): readToken
 * (event-reason token extraction), passedEvidenceEntries (passed + immutable-revision evidence filter),
 * eventEntries (events of one kind), H02_CHANGE_ID, and the state-family constants (EXECUTABLE_FAMILY,
 * BEYOND_PLANNING, BEYOND_BLOCKED). No behavior change. */
export function dedupeSorted(errors: string[]): string[] {
	return [...new Set(errors)].sort((left, right) => left.localeCompare(right));
}
export function isRecord(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === "object" && !Array.isArray(input);
}
export const HARD_EDGES: Record<string, readonly string[]> = {
	C2: ["C1"],
	C3: ["C2"],
	C4: ["C3"],
	C6: ["C1", "C5"],
};
export const MUTABLE_REVISION: readonly string[] = [
	"",
	"unlinked",
	"pending",
	"mutable",
	"latest",
	"head",
];
export const H02_CHANGE_ID = "drenyra-h02-tenant-isolation";
export const EXECUTABLE_FAMILY = [
	"executable",
	"executing",
	"verified",
	"delivered",
	"closed",
] as const;
export const BEYOND_PLANNING = ["eligible", ...EXECUTABLE_FAMILY] as const;
export const BEYOND_BLOCKED = ["planning", ...BEYOND_PLANNING] as const;
export function readToken(reason: string, token: string): string {
	const prefix = `${token}=`;
	const start = reason.indexOf(prefix);
	if (start < 0) return "";
	const after = start + prefix.length;
	const stop = reason.indexOf(";", after);
	return reason.slice(after, stop < 0 ? undefined : stop).trim();
}
export function passedEvidenceEntries(
	evidence: unknown,
): Array<{ id: string; entry: Record<string, unknown> }> {
	const entries: Array<{ id: string; entry: Record<string, unknown> }> = [];
	for (const [id, raw] of Object.entries(isRecord(evidence) ? evidence : {})) {
		const entry = isRecord(raw) ? raw : null;
		if (
			entry === null ||
			entry.result !== "passed" ||
			typeof entry.revision !== "string" ||
			(MUTABLE_REVISION as readonly string[]).includes(entry.revision)
		)
			continue;
		entries.push({ id, entry });
	}
	return entries;
}
export function eventEntries(
	events: unknown,
	kind: string,
): Record<string, unknown>[] {
	const records: Record<string, unknown>[] = [];
	for (const event of Array.isArray(events) ? events : [])
		if (isRecord(event) && event.kind === kind) records.push(event);
	return records;
}

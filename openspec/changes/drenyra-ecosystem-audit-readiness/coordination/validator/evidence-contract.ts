/** U3d.2 — evidence + research contracts (criteria 12, 14). Fail-closed and deterministic: bare
 * green/ready/compatible labels, mutable revisions, contradictory proof (same child/unit/kind recording both
 * passed and failed/blocked), cross-repository units (evidence owner not matching the child owner; authority
 * path outside the owning repository's allowed prefix), unknown children, and passed claims carrying failed
 * test counts advance ZERO gates; research without a primary source is unresolved risk, never a factual claim
 * (confirmed/changed claims require primary_source_url + affected_requirement); unresolved research never
 * advances a gate. Whole integers only — no monetary floats. */
import {
	dedupeSorted,
	isRecord,
	MUTABLE_REVISION,
} from "./validation-utils.js";

const BARE_LABELS = ["green", "ready", "compatible"] as const;
const CLAIMING_EFFECTS = ["confirmed", "changed"] as const;
const BLOCKING_RESULTS = ["failed", "blocked"] as const;
export interface EvidenceContractData {
	children?: Record<string, unknown>;
	repositories?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	research?: Record<string, unknown>;
}
function childOwner(
	data: EvidenceContractData,
	childId: string,
): string | null {
	const child = isRecord(data.children) ? data.children[childId] : undefined;
	if (!isRecord(child) || typeof child.owner !== "string") return null;
	return child.owner;
}
function labelDefect(id: string, checkResult: unknown): string | null {
	const label =
		typeof checkResult === "string" ? checkResult.trim().toLowerCase() : "";
	return (BARE_LABELS as readonly string[]).includes(label)
		? `resolver: evidence contract: evidence ${id}: bare "${label}" label cannot advance any gate`
		: null;
}
function revisionDefect(id: string, revision: unknown): string | null {
	return typeof revision === "string" &&
		(MUTABLE_REVISION as readonly string[]).includes(revision)
		? `resolver: evidence contract: evidence ${id}: mutable revision "${revision}" cannot advance any gate`
		: null;
}
function ownershipDefects(
	data: EvidenceContractData,
	id: string,
	child: string,
	owner: string,
	authorityPath: unknown,
): string[] {
	const errors: string[] = [];
	const expectedOwner = childOwner(data, child);
	if (child === "" || expectedOwner === null)
		errors.push(
			`resolver: evidence contract: evidence ${id}: references unknown child ${child}`,
		);
	else if (owner !== expectedOwner)
		errors.push(
			`resolver: evidence contract: evidence ${id}: cross-repository unit (owner ${owner} does not match child ${child} owner ${expectedOwner})`,
		);
	const repo = isRecord(data.repositories)
		? data.repositories[owner]
		: undefined;
	const prefix =
		isRecord(repo) && typeof repo.allowed_child_prefix === "string"
			? repo.allowed_child_prefix
			: "";
	if (
		prefix === "" ||
		typeof authorityPath !== "string" ||
		!authorityPath.startsWith(prefix)
	)
		errors.push(
			`resolver: evidence contract: evidence ${id}: authority path outside owning repository (${owner})`,
		);
	return errors;
}
function countsDefect(
	id: string,
	result: unknown,
	counts: unknown,
): string | null {
	const tc = isRecord(counts) ? counts : null;
	return result === "passed" &&
		tc !== null &&
		typeof tc.failed === "number" &&
		tc.failed > 0
		? `resolver: evidence contract: evidence ${id}: passed claim with failed test counts (${tc.failed} failed)`
		: null;
}
function recordDefects(
	data: EvidenceContractData,
	id: string,
	entry: Record<string, unknown>,
): string[] {
	const errors: string[] = [];
	const label = labelDefect(id, entry.check_result);
	if (label !== null) errors.push(label);
	const revision = revisionDefect(id, entry.revision);
	if (revision !== null) errors.push(revision);
	errors.push(
		...ownershipDefects(
			data,
			id,
			typeof entry.child === "string" ? entry.child : "",
			typeof entry.owner === "string" ? entry.owner : "",
			entry.authority_path,
		),
	);
	const counts = countsDefect(id, entry.result, entry.test_counts);
	if (counts !== null) errors.push(counts);
	return errors;
}
function evidenceGroupKey(entry: Record<string, unknown>): string {
	return [entry.child, entry.unit, entry.kind]
		.map((v) => (typeof v === "string" ? v : ""))
		.join("\u0000");
}
function recordGroupOutcome(
	groups: Map<string, { passed: boolean; blocked: boolean }>,
	key: string,
	result: unknown,
): void {
	const prior = groups.get(key) ?? { passed: false, blocked: false };
	if (result === "passed") groups.set(key, { ...prior, passed: true });
	else if (
		typeof result === "string" &&
		(BLOCKING_RESULTS as readonly string[]).includes(result)
	)
		groups.set(key, { ...prior, blocked: true });
}
function contradictionErrors(data: EvidenceContractData): string[] {
	const errors: string[] = [];
	const groups = new Map<string, { passed: boolean; blocked: boolean }>();
	for (const entry of Object.values(
		isRecord(data.evidence) ? data.evidence : {},
	))
		if (isRecord(entry))
			recordGroupOutcome(groups, evidenceGroupKey(entry), entry.result);
	for (const [key, group] of groups) {
		if (!group.passed || !group.blocked) continue;
		const [child, unit, kind] = key.split("\u0000");
		errors.push(
			`resolver: evidence contract: contradictory proof for ${child}${unit ? ` ${unit}` : ""} (${kind}): passed and failed/blocked recorded`,
		);
	}
	return errors;
}
function researchDefects(id: string, entry: Record<string, unknown>): string[] {
	const errors: string[] = [];
	const effect =
		typeof entry.decision_effect === "string" ? entry.decision_effect : "";
	if (!(CLAIMING_EFFECTS as readonly string[]).includes(effect)) return errors;
	const source =
		typeof entry.primary_source_url === "string"
			? entry.primary_source_url.trim()
			: "";
	if (source === "")
		errors.push(
			`resolver: evidence contract: research ${id}: no primary source for a ${effect} claim — unresolved risk, never a factual claim`,
		);
	const requirement =
		typeof entry.affected_requirement === "string"
			? entry.affected_requirement.trim()
			: "";
	if (requirement === "")
		errors.push(
			`resolver: evidence contract: research ${id}: ${effect} claim without an affected requirement — repository-established facts cite repo evidence, not browsed facts`,
		);
	return errors;
}
export function evidenceContractErrors(data: EvidenceContractData): string[] {
	const errors: string[] = [];
	for (const [id, entry] of Object.entries(
		isRecord(data.evidence) ? data.evidence : {},
	))
		if (isRecord(entry)) errors.push(...recordDefects(data, id, entry));
	errors.push(...contradictionErrors(data));
	for (const [id, entry] of Object.entries(
		isRecord(data.research) ? data.research : {},
	))
		if (isRecord(entry)) errors.push(...researchDefects(id, entry));
	return dedupeSorted(errors);
}

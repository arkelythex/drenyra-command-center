/** U4.3/U4.4 — operational readback + status output (criteria 2, 3; capability-scoped readiness). The ledger is the
 * ONLY mutable program state; readback status is derived. Fail-closed and deterministic: schema + semantic checks
 * first (stale concurrent writes / non-monotonic revisions rejected — criterion 2), then the deterministic resolver
 * for per-child derived state, then consistency checks rejecting unsupported claims (ecosystem_ready true while
 * derived false; children_derived mismatch; program_status.revision mismatch). readiness_scope stays capability-
 * scoped while any mandatory child is unclosed; next_safe_action names the first blocker. Revisions are whole
 * integers only — no monetary floats. */
import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";
import { type ResolvedChild, resolveLedger } from "../validator/resolver.js";
import { validateLedgerYaml } from "../validator/schema-validator.js";
import { validateLedgerSemantics } from "../validator/semantic-validator.js";
import { dedupeSorted, isRecord } from "../validator/validation-utils.js";
export interface ReadbackReport {
	valid: boolean;
	errors: string[];
	revision: number;
	ecosystem_ready: boolean;
	readiness_scope: string;
	next_safe_action: string;
	children: Record<string, ResolvedChild>;
}
function statusRecord(data: Record<string, unknown>): Record<string, unknown> {
	return isRecord(data.program_status) ? data.program_status : {};
}
function revisionOf(data: Record<string, unknown>): number {
	return typeof data.ledger_revision === "number" ? data.ledger_revision : 0;
}
function sortedChildIds(children: Record<string, ResolvedChild>): string[] {
	return Object.keys(children).sort((left, right) => left.localeCompare(right));
}
function scopeLine(children: Record<string, ResolvedChild>): string {
	const parts = sortedChildIds(children).map(
		(id) => `${id}=${children[id].state}`,
	);
	return `capability-scoped: ${parts.join("; ")}; ecosystem-wide readiness not claimed`;
}
function nextAction(
	children: Record<string, ResolvedChild>,
	ecosystemReady: boolean,
): string {
	if (children.C1?.blockers.includes("H02_REVIEW_PENDING"))
		return "Resume H02 review within drenyra-h02-tenant-isolation (its own lifecycle)";
	const blocked = Object.keys(children)
		.filter((id) => children[id].state === "blocked")
		.sort((left, right) => left.localeCompare(right));
	if (blocked.length > 0) return `Resolve blockers for ${blocked.join(", ")}`;
	if (ecosystemReady)
		return "All mandatory children closed; proceed to closure archive";
	return "Continue dependency-ordered units";
}
function consistencyErrors(
	data: Record<string, unknown>,
	resolved: ReturnType<typeof resolveLedger>,
): string[] {
	const errors: string[] = [];
	const status = statusRecord(data);
	if (status.ecosystem_ready === true && resolved.ecosystem_ready === false)
		errors.push(
			"readback: unsupported ecosystem-ready claim (C1–C6 not all closed, or C7 not closed/not-required)",
		);
	const recorded = isRecord(status.children_derived)
		? status.children_derived
		: {};
	for (const [id, state] of Object.entries(recorded))
		if (typeof state === "string" && resolved.children[id]?.state !== state)
			errors.push(
				`readback: children_derived mismatch (recorded ${id}=${state}, derived ${resolved.children[id]?.state ?? "absent"})`,
			);
	if (status.revision !== undefined && status.revision !== revisionOf(data))
		errors.push(
			`readback: program_status.revision ${status.revision} does not match ledger_revision ${revisionOf(data)}`,
		);
	return errors;
}
export function readbackStatus(yamlText: string): ReadbackReport {
	const schema = validateLedgerYaml(yamlText);
	const semantic = validateLedgerSemantics(yamlText);
	const validityErrors = dedupeSorted([...schema.errors, ...semantic.errors]);
	if (schema.valid === false || semantic.valid === false)
		return {
			valid: false,
			errors: validityErrors,
			revision: 0,
			ecosystem_ready: false,
			readiness_scope: "invalid ledger",
			next_safe_action: "fix ledger validity",
			children: {},
		};
	const parsed = parseDocument(yamlText).toJS();
	const data = isRecord(parsed) ? parsed : {};
	const resolved = resolveLedger(yamlText);
	if (resolved.valid === false)
		return {
			valid: false,
			errors: dedupeSorted([...validityErrors, ...resolved.errors]),
			revision: revisionOf(data),
			ecosystem_ready: false,
			readiness_scope: "invalid ledger",
			next_safe_action: "fix ledger validity",
			children: {},
		};
	const errors = dedupeSorted(consistencyErrors(data, resolved));
	return {
		valid: errors.length === 0,
		errors,
		revision: revisionOf(data),
		ecosystem_ready: resolved.ecosystem_ready,
		readiness_scope: scopeLine(resolved.children),
		next_safe_action: nextAction(resolved.children, resolved.ecosystem_ready),
		children: resolved.children,
	};
}
export function formatReadback(report: ReadbackReport): string {
	const lines = [
		`ledger revision ${report.revision}`,
		`status: ${report.valid ? "valid" : "INVALID"}`,
		`ecosystem_ready: ${report.ecosystem_ready}`,
		`readiness_scope: ${report.readiness_scope}`,
		`next_safe_action: ${report.next_safe_action}`,
	];
	for (const id of sortedChildIds(report.children))
		lines.push(
			`  ${id}: ${report.children[id].state}${report.children[id].blockers.length > 0 ? ` (${report.children[id].blockers.join(", ")})` : ""}`,
		);
	for (const error of report.errors) lines.push(`error: ${error}`);
	return lines.join("\n");
}
const CLI = process.argv[1]?.endsWith("readback.ts");
if (CLI) {
	const path =
		process.argv[2] ?? new URL("../ledger.yaml", import.meta.url).pathname;
	const report = readbackStatus(readFileSync(path, "utf8"));
	console.log(formatReadback(report));
	process.exit(report.valid ? 0 : 1);
}

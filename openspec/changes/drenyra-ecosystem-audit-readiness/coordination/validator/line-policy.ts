/** U3b.2 — line policy + exceptions (criteria 10-11): 300 passes; 301-400 blocked despite the 400 config
 * convention; >400 blocked by both policies. Exceptions: exact child/unit + scope digest, full field set,
 * program-owner approval, unexpired; waive only the size gate; blanket/cross-repository are invalid.
 * Forecast/ceiling counts are whole integers only — no monetary floats. */
import {
	dedupeSorted,
	isRecord,
	passedEvidenceEntries,
} from "./validation-utils.js";

const REQUIRED_EXC = [
	"child",
	"unit",
	"scope_digest",
	"proposed_ceiling",
	"rationale",
	"alternatives",
	"reviewer_impact_mitigation",
	"approval",
	"ledger_revision",
	"expires_at",
] as const;
const BLANKET_UNITS = ["*", "all"] as const;
export interface LinePolicyData {
	policy?: Record<string, unknown>;
	children?: Record<string, unknown>;
	repositories?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	exceptions?: Record<string, unknown>;
	events?: unknown[];
}
export function exceptionScopeDigest(child: unknown): string {
	if (!isRecord(child)) return "";
	const parts = [
		child.change_id,
		child.state_path,
		child.units,
		child.acceptance_refs,
		child.dependencies,
	].map((v) =>
		Array.isArray(v)
			? (v as unknown[]).sort().join(",")
			: typeof v === "string"
				? v
				: "",
	);
	let hash = 0x811c9dc5;
	for (const part of parts.join("|"))
		hash = Math.imul(hash ^ part.charCodeAt(0), 0x01000193) >>> 0;
	return hash.toString(16).padStart(8, "0");
}
function latestEventTime(data: LinePolicyData): number {
	let latest = 0;
	for (const event of Array.isArray(data.events) ? data.events : [])
		if (isRecord(event) && typeof event.timestamp === "string")
			latest = Math.max(latest, Date.parse(event.timestamp) || latest);
	return latest;
}
function forecastUnits(
	data: LinePolicyData,
): Array<{ child: string; unit: string; lines: number }> {
	const units: Array<{ child: string; unit: string; lines: number }> = [];
	for (const { entry } of passedEvidenceEntries(data.evidence)) {
		if (
			entry.kind !== "forecast" ||
			typeof entry.child !== "string" ||
			typeof entry.unit !== "string" ||
			typeof entry.check_result !== "string"
		)
			continue;
		const match = /\bforecast[=:]\s*(\d+)/.exec(entry.check_result);
		if (match !== null)
			units.push({
				child: entry.child,
				unit: entry.unit,
				lines: Number(match[1]),
			});
	}
	return units;
}
function missingFields(exc: Record<string, unknown>): string[] {
	return REQUIRED_EXC.filter(
		(f) =>
			!(f in exc) || exc[f] === undefined || exc[f] === null || exc[f] === "",
	);
}
function scopedException(
	childId: string,
	exc: Record<string, unknown>,
): boolean {
	return (
		/^C[1-7]$/.test(childId) &&
		typeof exc.unit === "string" &&
		exc.unit !== "" &&
		!(BLANKET_UNITS as readonly string[]).includes(exc.unit) &&
		typeof exc.scope_digest === "string" &&
		exc.scope_digest !== ""
	);
}
function blanketDefect(
	id: string,
	childId: string,
	exc: Record<string, unknown>,
): string | null {
	return scopedException(childId, exc)
		? null
		: `resolver: line policy: exception ${id} is a blanket exception`;
}
function authorityDefect(
	data: LinePolicyData,
	id: string,
	childId: string,
): string | null {
	const child = isRecord(data.children) ? data.children[childId] : undefined;
	if (!isRecord(child))
		return `resolver: line policy: exception ${id} is a cross-repository exception`;
	const owner = typeof child.owner === "string" ? child.owner : "";
	const repo = isRecord(data.repositories)
		? data.repositories[owner]
		: undefined;
	if (!isRecord(repo) || repo.authority_kind !== "umbrella-owner")
		return `resolver: line policy: exception ${id} is a cross-repository exception`;
	return null;
}
function scopeDefect(
	id: string,
	exc: Record<string, unknown>,
	child: unknown,
): string | null {
	return exc.scope_digest === exceptionScopeDigest(child)
		? null
		: `resolver: line policy: exception ${id} scope changed (digest mismatch)`;
}
function approvalDefect(
	id: string,
	exc: Record<string, unknown>,
	programOwner: unknown,
): string | null {
	const approval = isRecord(exc.approval) ? exc.approval : null;
	if (
		approval !== null &&
		approval.approved === true &&
		typeof approval.approver === "string" &&
		approval.approver === programOwner
	)
		return null;
	return `resolver: line policy: exception ${id} not approved by the program owner`;
}
function expiryDefect(
	id: string,
	exc: Record<string, unknown>,
	data: LinePolicyData,
): string | null {
	if (
		typeof exc.expires_at !== "string" ||
		Number.isNaN(Date.parse(exc.expires_at)) ||
		Date.parse(exc.expires_at) > latestEventTime(data)
	)
		return null;
	return `resolver: line policy: exception ${id} expired`;
}
function scopeAuthorityDefects(
	data: LinePolicyData,
	id: string,
	exc: Record<string, unknown>,
): string[] {
	const childId = typeof exc.child === "string" ? exc.child : "";
	const blanket = blanketDefect(id, childId, exc);
	if (blanket !== null) return [blanket];
	const authority = authorityDefect(data, id, childId);
	if (authority !== null) return [authority];
	const scope = scopeDefect(
		id,
		exc,
		isRecord(data.children) ? data.children[childId] : undefined,
	);
	return scope !== null ? [scope] : [];
}
function gateDefects(
	data: LinePolicyData,
	id: string,
	exc: Record<string, unknown>,
): string[] {
	const defects: string[] = [];
	const approval = approvalDefect(
		id,
		exc,
		isRecord(data.policy) ? data.policy.program_owner : undefined,
	);
	if (approval !== null) defects.push(approval);
	const expiry = expiryDefect(id, exc, data);
	if (expiry !== null) defects.push(expiry);
	return defects;
}
function exceptionDefects(
	data: LinePolicyData,
	id: string,
	exc: Record<string, unknown>,
): string[] {
	const defects: string[] = [];
	const missing = missingFields(exc);
	if (missing.length > 0)
		defects.push(
			`resolver: line policy: exception ${id} missing required fields: ${missing.join(", ")}`,
		);
	defects.push(...scopeAuthorityDefects(data, id, exc));
	defects.push(...gateDefects(data, id, exc));
	return defects;
}
function exceptionErrors(data: LinePolicyData): string[] {
	const errors: string[] = [];
	for (const [id, entry] of Object.entries(
		isRecord(data.exceptions) ? data.exceptions : {},
	))
		if (isRecord(entry)) errors.push(...exceptionDefects(data, id, entry));
	return errors;
}
/** Whole-integer coverage check: a valid unexpired exception waives only the size gate. */
function exceptionCovers(
	data: LinePolicyData,
	childId: string,
	unit: string,
	lines: number,
): boolean {
	for (const entry of Object.values(
		isRecord(data.exceptions) ? data.exceptions : {},
	)) {
		if (
			isRecord(entry) &&
			entry.child === childId &&
			entry.unit === unit &&
			exceptionDefects(data, "x", entry).length === 0 &&
			typeof entry.proposed_ceiling === "number" &&
			entry.proposed_ceiling >= lines
		)
			return true;
	}
	return false;
}
function boundaryErrors(
	data: LinePolicyData,
	effective: number,
	config: number,
): string[] {
	const errors: string[] = [];
	for (const { child, unit, lines } of forecastUnits(data)) {
		if (lines <= effective) continue;
		if (lines > config)
			errors.push(
				`resolver: line policy: unit ${unit} forecast ${lines} exceeds both the ${effective}-line program limit and the ${config}-line repository convention`,
			);
		else if (!exceptionCovers(data, child, unit, lines))
			errors.push(
				`resolver: line policy: unit ${unit} forecast ${lines} exceeds the ${effective}-line limit without a valid exception`,
			);
	}
	return errors;
}
export function linePolicyErrors(data: LinePolicyData): string[] {
	const effective =
		isRecord(data.policy) &&
		typeof data.policy.effective_unit_limit === "number"
			? data.policy.effective_unit_limit
			: 300;
	const config =
		isRecord(data.policy) &&
		typeof data.policy.config_default_unit_limit === "number"
			? data.policy.config_default_unit_limit
			: 400;
	return dedupeSorted([
		...exceptionErrors(data),
		...boundaryErrors(data, effective, config),
	]);
}

/** U2a.2 — deterministic, fail-closed resolver core for the umbrella ledger. Derives per-child program states via topological hard-edge resolution (canonical + recorded edges, inherent cycle rejection), classifies evidence valid/stale/contradictory/unverifiable (read-only — history preserved), applies fail-closed lifecycle compatibility (C1 review-pending → H02_REVIEW_PENDING) and least-advanced safe state (blockers override optimistic summaries), and never treats missing dependency evidence as not-applicable. Revision/ledger fields are whole integers only — no monetary floats. Graph-safety (U2b) and reorder-rule (U2c) checks are wired as early-reject gates; shared helpers (isRecord, HARD_EDGES, MUTABLE_REVISION) come from validation-utils. H02/C1 guard (U3a), line-policy (U3b), and C7 gate (U3c), and evidence/research contract (U3d), and handoff protocol (U3e), and compatibility import adapter (U3f) are wired as early-reject gates. */
import { parseDocument } from "yaml";
import { c7GateErrors } from "./c7-gate.js";
import { compatibilityImportErrors } from "./compatibility-import.js";
import { evidenceContractErrors } from "./evidence-contract.js";
import { graphSafetyErrors } from "./graph-safety.js";
import { h02C1GuardErrors } from "./h02-c1-guard.js";
import { handoffProtocolErrors } from "./handoff-protocol.js";
import { linePolicyErrors } from "./line-policy.js";
import { reorderRuleErrors } from "./reorder-rule.js";
import { rollbackRecomputeErrors } from "./rollback-recompute.js";
import {
	dedupeSorted,
	HARD_EDGES,
	isRecord,
	MUTABLE_REVISION,
} from "./validation-utils.js";
export interface LedgerData {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	events?: unknown[];
}
const STATES = [
	"declared",
	"planning",
	"blocked",
	"eligible",
	"executable",
	"executing",
	"verified",
	"delivered",
	"closed",
	"rolled-back",
	"superseded",
	"not-required",
] as const;
const CHILD_IDS = ["C1", "C2", "C3", "C4", "C5", "C6", "C7"] as const;
const BLOCKING_OBSERVED = ["review-pending", "implementation-blocked"] as const;
const EVIDENCE_KINDS = [
	"lifecycle",
	"dependency",
	"forecast",
	"verification",
	"review",
	"delivery",
	"release",
	"rollback",
	"blocker",
] as const;
const EVIDENCE_RESULTS = ["passed", "failed", "blocked", "unresolved"] as const;
export type ResolverState = (typeof STATES)[number];
export type EvidenceClass =
	| "valid"
	| "stale"
	| "contradictory"
	| "unverifiable";
export interface ResolvedChild {
	state: ResolverState;
	blockers: string[];
}
export interface ResolverResult {
	valid: boolean;
	errors: string[];
	children: Record<string, ResolvedChild>;
	ecosystem_ready: boolean;
}
function childRecord(
	data: LedgerData,
	childId: string,
): Record<string, unknown> | null {
	const child = data.children?.[childId];
	return isRecord(child) ? child : null;
}
function recordedDeps(data: LedgerData, childId: string): readonly string[] {
	const child = childRecord(data, childId);
	if (child !== null && Array.isArray(child.dependencies)) {
		const deps = (child.dependencies as unknown[]).filter(
			(d): d is string => typeof d === "string",
		);
		if (deps.length > 0) return deps;
	}
	return HARD_EDGES[childId] ?? [];
}
function hasEvidenceShape(
	entry: Record<string, unknown>,
	data: LedgerData,
): boolean {
	if (
		typeof entry.kind !== "string" ||
		!(EVIDENCE_KINDS as readonly string[]).includes(entry.kind)
	)
		return false;
	if (
		typeof entry.child !== "string" ||
		!(CHILD_IDS as readonly string[]).includes(entry.child) ||
		childRecord(data, entry.child) === null
	)
		return false;
	if (
		typeof entry.revision !== "string" ||
		(MUTABLE_REVISION as readonly string[]).includes(entry.revision)
	)
		return false;
	if (
		typeof entry.result !== "string" ||
		!(EVIDENCE_RESULTS as readonly string[]).includes(entry.result)
	)
		return false;
	return true;
}
function latestEventTime(data: LedgerData): number {
	let latest = 0;
	if (Array.isArray(data.events)) {
		for (const event of data.events) {
			if (!isRecord(event) || typeof event.timestamp !== "string") continue;
			const ts = Date.parse(event.timestamp);
			if (!Number.isNaN(ts) && ts > latest) latest = ts;
		}
	}
	return latest;
}
function isStaleEvidence(
	entry: Record<string, unknown>,
	data: LedgerData,
): boolean {
	if (typeof entry.timestamp !== "string") return false;
	const at = Date.parse(entry.timestamp);
	if (Number.isNaN(at)) return false;
	const latest = latestEventTime(data);
	return latest > 0 && at < latest;
}
export function classifyEvidence(
	entry: unknown,
	data: LedgerData,
): EvidenceClass {
	if (!isRecord(entry)) return "unverifiable";
	if (!hasEvidenceShape(entry, data)) return "unverifiable";
	if (entry.result === "failed" || entry.result === "blocked")
		return "contradictory";
	if (isStaleEvidence(entry, data)) return "stale";
	return "valid";
}
function depSatisfied(
	dep: string,
	data: LedgerData,
	derived: Record<string, ResolvedChild>,
): boolean {
	const depState = derived[dep];
	if (depState === undefined || depState.state === "blocked") return false;
	const evidence = isRecord(data.evidence) ? data.evidence : {};
	for (const entry of Object.values(evidence)) {
		if (classifyEvidence(entry, data) !== "valid" || !isRecord(entry)) continue;
		if (
			entry.kind === "dependency" &&
			entry.child === dep &&
			entry.result === "passed"
		)
			return true;
	}
	return false;
}
function decrementDependents(
	current: string,
	nodes: readonly string[],
	indegree: Record<string, number>,
	data: LedgerData,
	queue: string[],
): void {
	for (const node of nodes) {
		if (indegree[node] > 0 && recordedDeps(data, node).includes(current)) {
			indegree[node] -= 1;
			if (indegree[node] === 0) queue.push(node);
		}
	}
}
function topoOrder(data: LedgerData): { order: string[]; cycle: string[] } {
	const nodes = Object.keys(isRecord(data.children) ? data.children : {})
		.filter((id) => (CHILD_IDS as readonly string[]).includes(id))
		.sort((left, right) => left.localeCompare(right));
	const indegree: Record<string, number> = {};
	for (const node of nodes) indegree[node] = 0;
	for (const node of nodes)
		for (const dep of recordedDeps(data, node))
			if (dep in indegree) indegree[node] += 1;
	const queue = nodes.filter((node) => indegree[node] === 0);
	const order: string[] = [];
	while (queue.length > 0) {
		queue.sort((left, right) => left.localeCompare(right));
		const current = queue.shift() as string;
		order.push(current);
		decrementDependents(current, nodes, indegree, data, queue);
	}
	return { order, cycle: nodes.filter((node) => !order.includes(node)) };
}
function lifecycleBlocker(
	childId: string,
	observedStatus: string,
): string | null {
	if (childId === "C1" && observedStatus === "review-pending")
		return "H02_REVIEW_PENDING";
	if ((BLOCKING_OBSERVED as readonly string[]).includes(observedStatus))
		return "LIFECYCLE_NOT_EXECUTABLE";
	return null;
}
function recordedBlockerTokens(
	child: Record<string, unknown> | null,
): string[] {
	const tokens: string[] = [];
	if (child !== null && Array.isArray(child.blockers))
		for (const blocker of child.blockers)
			if (typeof blocker === "string") tokens.push(blocker);
	return tokens;
}
function deriveChild(
	childId: string,
	data: LedgerData,
	derived: Record<string, ResolvedChild>,
): ResolvedChild {
	const child = childRecord(data, childId);
	const blockers: string[] = [];
	const observedStatus =
		typeof child?.observed_status === "string" ? child.observed_status : "";
	const lifecycle = lifecycleBlocker(childId, observedStatus);
	if (lifecycle !== null) blockers.push(lifecycle);
	blockers.push(...recordedBlockerTokens(child));
	for (const dep of recordedDeps(data, childId))
		if (derived[dep]?.state === "rolled-back")
			blockers.push("ROLLBACK_INVALIDATED_DEPENDENCY");
		else if (!depSatisfied(dep, data, derived))
			blockers.push("DEPENDENCY_UNSATISFIED");
	const unique = dedupeSorted(blockers);
	const baseline =
		child !== null &&
		typeof child.program_state === "string" &&
		(STATES as readonly string[]).includes(child.program_state)
			? child.program_state
			: "declared";
	return {
		state: unique.length > 0 ? "blocked" : (baseline as ResolverState),
		blockers: unique,
	};
}
function earlyRejectErrors(data: Record<string, unknown>): string[] | null {
	const graphErrors = graphSafetyErrors(data);
	if (graphErrors.length > 0) return graphErrors;
	const guardErrors = h02C1GuardErrors(data);
	if (guardErrors.length > 0) return guardErrors;
	const reorderErrors = reorderRuleErrors(data);
	if (reorderErrors.length > 0) return reorderErrors;
	const lineErrors = linePolicyErrors(data);
	if (lineErrors.length > 0) return lineErrors;
	const c7Errors = c7GateErrors(data);
	if (c7Errors.length > 0) return c7Errors;
	const contractErrors = evidenceContractErrors(data);
	if (contractErrors.length > 0) return contractErrors;
	const handoffErrors = handoffProtocolErrors(data);
	if (handoffErrors.length > 0) return handoffErrors;
	const importErrors = compatibilityImportErrors(data);
	if (importErrors.length > 0) return importErrors;
	const rollbackErrors = rollbackRecomputeErrors(data);
	if (rollbackErrors.length > 0) return rollbackErrors;
	return null;
}
export function resolveLedger(yamlText: string): ResolverResult {
	const doc = parseDocument(yamlText);
	const parseErrors = doc.errors.map(
		(error) => `yaml parse error: ${error.message}`,
	);
	if (parseErrors.length > 0)
		return {
			valid: false,
			errors: dedupeSorted(parseErrors),
			children: {},
			ecosystem_ready: false,
		};
	const data: unknown = doc.toJS();
	if (!isRecord(data) || !isRecord(data.children))
		return {
			valid: false,
			errors: ["resolver: children map missing"],
			children: {},
			ecosystem_ready: false,
		};
	const rejected = earlyRejectErrors(data);
	if (rejected !== null)
		return {
			valid: false,
			errors: rejected,
			children: {},
			ecosystem_ready: false,
		};
	const { order, cycle } = topoOrder(data);
	if (cycle.length > 0)
		return {
			valid: false,
			errors: [`resolver: dependency cycle detected: ${cycle.join(", ")}`],
			children: {},
			ecosystem_ready: false,
		};
	const derived: Record<string, ResolvedChild> = {};
	for (const childId of order)
		derived[childId] = deriveChild(childId, data, derived);
	const children = Object.fromEntries(
		Object.keys(derived)
			.sort((left, right) => left.localeCompare(right))
			.map((id) => [id, derived[id]]),
	) as Record<string, ResolvedChild>;
	let ecosystemReady = true;
	for (const childId of Object.keys(children)) {
		const child = childRecord(data, childId);
		const state = children[childId].state;
		if (child !== null && child.mandatory === true && state !== "closed")
			ecosystemReady = false;
		if (childId === "C7" && state !== "not-required" && state !== "closed")
			ecosystemReady = false;
	}
	return { valid: true, errors: [], children, ecosystem_ready: ecosystemReady };
}

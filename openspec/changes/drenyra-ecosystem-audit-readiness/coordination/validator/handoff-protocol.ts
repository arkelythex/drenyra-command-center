/** U3e.2 — two-party child-handoff protocol (design "Safe umbrella-to-child handoff"): the umbrella appends a
 * child-handoff-requested event carrying the full payload (child ID, owner, baseline defect, scope/non-goals,
 * dependencies, current executability, acceptance/evidence contracts, effective 300-line policy, suggested change
 * ID, collision requirement, expiry) and makes NO claim the child exists or can apply; the owning repository
 * resumes existing authority (H02 always takes the resume path) or accepts, returning repository-relative
 * references at an immutable revision; accepted handoffs are at most planning, declined handoffs stay blocked,
 * incomplete children stay planning, ID collisions return to the owner, unverifiable authority blocks, and no
 * local surrogate child is created for sibling owners. Whole integers only — no monetary floats. */
import {
	BEYOND_BLOCKED,
	BEYOND_PLANNING,
	dedupeSorted,
	EXECUTABLE_FAMILY,
	eventEntries,
	H02_CHANGE_ID,
	isRecord,
	MUTABLE_REVISION,
	readToken,
} from "./validation-utils.js";

const SIBLING_OWNERS = ["drenyra-pi", "drenyra-ai", "drenyra-engram"] as const;
const HANDOFF_TOKENS = [
	"baseline-defect",
	"scope",
	"non-goals",
	"dependencies",
	"executability",
	"acceptance",
	"evidence-contract",
	"unit-limit",
	"suggested-change-id",
	"collision",
	"expiry",
] as const;
const OUTCOMES = [
	"accepted",
	"resumed",
	"declined",
	"incomplete",
	"collision",
] as const;
export interface HandoffData {
	children?: Record<string, unknown>;
	repositories?: Record<string, unknown>;
	events?: unknown[];
}
interface HandoffRequest {
	child: string;
	reason: string;
}
interface HandoffDecision {
	child: string;
	outcome: string;
}
function handoffRequests(data: HandoffData): HandoffRequest[] {
	const requests: HandoffRequest[] = [];
	for (const event of eventEntries(data.events, "child-handoff-requested"))
		requests.push({
			child: typeof event.child === "string" ? event.child : "",
			reason: typeof event.reason === "string" ? event.reason : "",
		});
	return requests;
}
function handoffDecisions(data: HandoffData): HandoffDecision[] {
	const decisions: HandoffDecision[] = [];
	for (const event of eventEntries(data.events, "decision")) {
		const reason = typeof event.reason === "string" ? event.reason : "";
		const outcome = (OUTCOMES as readonly string[]).find((o) =>
			reason.includes(`handoff: ${o}`),
		);
		if (outcome === undefined) continue;
		decisions.push({
			child: typeof event.child === "string" ? event.child : "",
			outcome,
		});
	}
	return decisions;
}
function completenessErrors(requests: HandoffRequest[]): string[] {
	const errors: string[] = [];
	for (const req of requests) {
		const missing = HANDOFF_TOKENS.filter(
			(token) => readToken(req.reason, token) === "",
		);
		if (missing.length > 0)
			errors.push(
				`resolver: handoff protocol: ${req.child} handoff request incomplete — missing ${missing.join(", ")}`,
			);
	}
	return errors;
}
function executabilityErrors(requests: HandoffRequest[]): string[] {
	const errors: string[] = [];
	for (const req of requests) {
		const exec = readToken(req.reason, "executability");
		if ((EXECUTABLE_FAMILY as readonly string[]).includes(exec))
			errors.push(
				`resolver: handoff protocol: ${req.child} handoff makes no claim the child exists or can apply (executability=${exec})`,
			);
	}
	return errors;
}
function unitLimitErrors(requests: HandoffRequest[]): string[] {
	const errors: string[] = [];
	for (const req of requests) {
		const limit = readToken(req.reason, "unit-limit");
		if (limit !== "300")
			errors.push(
				`resolver: handoff protocol: ${req.child} handoff must carry the effective 300-line policy (unit-limit=${limit || "missing"})`,
			);
	}
	return errors;
}
function resumeH02Errors(
	requests: HandoffRequest[],
	children: Record<string, unknown> | undefined,
): string[] {
	const errors: string[] = [];
	for (const req of requests) {
		if (req.child !== "C1") continue;
		const c1 = isRecord(children) ? children.C1 : undefined;
		const suggested = readToken(req.reason, "suggested-change-id");
		if (
			!isRecord(c1) ||
			suggested !== H02_CHANGE_ID ||
			c1.change_id !== H02_CHANGE_ID ||
			c1.authority_mode !== "existing"
		)
			errors.push(
				"resolver: handoff protocol: H02 must always take the resume path — duplicate tenant authority rejected",
			);
	}
	return errors;
}
function collisionDefect(
	child: Record<string, unknown>,
	id: string,
	seen: Map<string, string>,
): string | null {
	const changeId = typeof child.change_id === "string" ? child.change_id : "";
	if (changeId === "" || changeId === "pending") return null;
	const prior = seen.get(changeId);
	if (prior !== undefined)
		return `resolver: handoff protocol: ID collision between ${prior} and ${id} (${changeId}) returns to the owner`;
	seen.set(changeId, id);
	return null;
}
function idCollisionErrors(
	children: Record<string, unknown> | undefined,
): string[] {
	const errors: string[] = [];
	const byOwner = new Map<string, Map<string, string>>();
	for (const [id, child] of Object.entries(
		isRecord(children) ? children : {},
	)) {
		if (!isRecord(child)) continue;
		const owner = typeof child.owner === "string" ? child.owner : "";
		const seen = byOwner.get(owner) ?? new Map<string, string>();
		const defect = collisionDefect(child, id, seen);
		if (defect !== null) errors.push(defect);
		byOwner.set(owner, seen);
	}
	return errors;
}
function outcomeDefect(
	outcome: string,
	child: Record<string, unknown>,
	id: string,
): string | null {
	const state =
		typeof child.program_state === "string" ? child.program_state : "";
	const beyondBlocked = (BEYOND_BLOCKED as readonly string[]).includes(state);
	const beyondPlanning = (BEYOND_PLANNING as readonly string[]).includes(state);
	if (outcome === "accepted" && beyondPlanning)
		return `resolver: handoff protocol: accepted handoff ${id} is at most planning — not executable`;
	if (outcome === "resumed" && child.authority_mode !== "existing")
		return `resolver: handoff protocol: resume for ${id} requires existing authority`;
	if (outcome === "declined" && state !== "blocked")
		return `resolver: handoff protocol: declined handoff ${id} stays blocked`;
	if (outcome === "incomplete" && beyondPlanning)
		return `resolver: handoff protocol: incomplete child ${id} stays planning`;
	if (outcome === "collision" && beyondBlocked)
		return `resolver: handoff protocol: ID collision ${id} returns to the owner`;
	return null;
}
function decisionOutcomeErrors(
	decisions: HandoffDecision[],
	children: Record<string, unknown> | undefined,
): string[] {
	const errors: string[] = [];
	for (const decision of decisions) {
		const child = isRecord(children) ? children[decision.child] : undefined;
		if (!isRecord(child)) continue;
		const defect = outcomeDefect(decision.outcome, child, decision.child);
		if (defect !== null) errors.push(defect);
	}
	return errors;
}
function authorityDefect(
	child: Record<string, unknown>,
	id: string,
	repositories: Record<string, unknown>,
): string | null {
	const state =
		typeof child.program_state === "string" ? child.program_state : "";
	if (!(BEYOND_BLOCKED as readonly string[]).includes(state)) return null;
	const revision = typeof child.revision === "string" ? child.revision : "";
	const owner = typeof child.owner === "string" ? child.owner : "";
	const repo = isRecord(repositories) ? repositories[owner] : undefined;
	const prefix =
		isRecord(repo) && typeof repo.allowed_child_prefix === "string"
			? repo.allowed_child_prefix
			: "";
	const path = typeof child.state_path === "string" ? child.state_path : "";
	if ((MUTABLE_REVISION as readonly string[]).includes(revision))
		return `resolver: handoff protocol: unverifiable authority for ${id} (mutable revision "${revision}") blocks`;
	if (prefix === "" || !path.startsWith(prefix))
		return `resolver: handoff protocol: unverifiable authority for ${id} (authority path outside ${owner}) blocks`;
	return null;
}
function unverifiableAuthorityErrors(
	requests: HandoffRequest[],
	data: HandoffData,
): string[] {
	const errors: string[] = [];
	const requested = new Set(requests.map((req) => req.child));
	const repositories = isRecord(data.repositories) ? data.repositories : {};
	for (const [id, child] of Object.entries(
		isRecord(data.children) ? data.children : {},
	)) {
		if (!requested.has(id) || !isRecord(child)) continue;
		const defect = authorityDefect(child, id, repositories);
		if (defect !== null) errors.push(defect);
	}
	return errors;
}
function siblingSurrogateErrors(
	children: Record<string, unknown> | undefined,
): string[] {
	const errors: string[] = [];
	for (const [id, child] of Object.entries(
		isRecord(children) ? children : {},
	)) {
		if (
			isRecord(child) &&
			(SIBLING_OWNERS as readonly string[]).includes(
				typeof child.owner === "string" ? child.owner : "",
			) &&
			child.authority_mode === "new-local"
		)
			errors.push(
				`resolver: handoff protocol: no local surrogate child created for sibling owner ${child.owner} — external-reference only (${id})`,
			);
	}
	return errors;
}
export function handoffProtocolErrors(data: HandoffData): string[] {
	const requests = handoffRequests(data);
	return dedupeSorted([
		...completenessErrors(requests),
		...executabilityErrors(requests),
		...unitLimitErrors(requests),
		...resumeH02Errors(requests, data.children),
		...idCollisionErrors(data.children),
		...decisionOutcomeErrors(handoffDecisions(data), data.children),
		...unverifiableAuthorityErrors(requests, data),
		...siblingSurrogateErrors(data.children),
	]);
}

/** U1c.2 — semantic hardening for the umbrella ledger. Fail-closed and deterministic (sorted, deduplicated errors). Revision/ledger fields are whole integers only — no monetary floats are ever used. Schema-level checks stay in schema-validator.ts (U1b, untouched). */
import { parseDocument } from "yaml";
import { dedupeSorted } from "./validation-utils.js";
export interface SemanticValidationResult {
	valid: boolean;
	errors: string[];
}
const EXPECTED_OWNER: Record<string, readonly string[]> = {
	C1: ["drenyra"],
	C2: ["drenyra"],
	C3: ["drenyra"],
	C4: ["drenyra"],
	C5: ["drenyra-pi"],
	C6: ["drenyra"],
	C7: ["drenyra-ai", "drenyra-engram"],
};
function isRecord(input: unknown): input is Record<string, unknown> {
	return input !== null && typeof input === "object" && !Array.isArray(input);
}
function isAbsoluteOrTraversal(pathText: unknown): boolean {
	if (typeof pathText !== "string") return true;
	return (
		pathText.startsWith("/") ||
		pathText.includes("\\") ||
		/^[A-Za-z]:[\\/]/.test(pathText) ||
		/(^|[\\/])\.\.([\\/]|$)/.test(pathText)
	);
}
function checkRepositoryPath(
	pathText: unknown,
	where: string,
	errors: string[],
): void {
	if (isAbsoluteOrTraversal(pathText)) {
		errors.push(
			`${where}: repository-relative path rejected (absolute or traversal path)`,
		);
	}
}
function ownerMismatchError(
	childId: string,
	child: Record<string, unknown>,
): string | null {
	const allowed = EXPECTED_OWNER[childId];
	if (
		typeof child.owner === "string" &&
		allowed &&
		!allowed.includes(child.owner)
	) {
		return `children.${childId}.owner: owner mismatch (expected ${allowed.join(" or ")}, got ${child.owner})`;
	}
	return null;
}
function collectChildrenErrors(
	data: Record<string, unknown>,
	errors: string[],
): void {
	const children = isRecord(data.children) ? data.children : {};
	for (const [childId, child] of Object.entries(children)) {
		if (!EXPECTED_OWNER[childId]) {
			errors.push(`children.${childId}: unknown child id`);
			continue;
		}
		if (!isRecord(child)) continue;
		checkRepositoryPath(
			child.state_path,
			`children.${childId}.state_path`,
			errors,
		);
		const ownerError = ownerMismatchError(childId, child);
		if (ownerError !== null) errors.push(ownerError);
	}
}
function collectEvidenceErrors(
	data: Record<string, unknown>,
	errors: string[],
): void {
	const evidence = isRecord(data.evidence) ? data.evidence : {};
	for (const [evidenceId, entry] of Object.entries(evidence)) {
		if (isRecord(entry))
			checkRepositoryPath(
				entry.authority_path,
				`evidence.${evidenceId}.authority_path`,
				errors,
			);
	}
}
interface EventScanState {
	seen: Set<string>;
	previous: number;
	max: number;
}
function scanEventId(
	event: Record<string, unknown>,
	index: number,
	state: EventScanState,
): string | null {
	if (typeof event.id !== "string") return null;
	if (state.seen.has(event.id))
		return `events[${index}].id: duplicate event id "${event.id}"`;
	state.seen.add(event.id);
	return null;
}
function scanEventRevision(
	event: Record<string, unknown>,
	index: number,
	state: EventScanState,
): string | null {
	if (typeof event.revision !== "number") return null;
	if (event.revision < state.previous)
		return `events[${index}].revision: event revisions must be monotonic (non-decreasing)`;
	state.previous = event.revision;
	if (event.revision > state.max) state.max = event.revision;
	return null;
}
function collectEventErrors(events: unknown, ledgerRevision: number): string[] {
	const errors: string[] = [];
	if (!Array.isArray(events)) return errors;
	const state: EventScanState = { seen: new Set(), previous: 0, max: 0 };
	for (let index = 0; index < events.length; index += 1) {
		const event = events[index];
		if (!isRecord(event)) continue;
		const idError = scanEventId(event, index, state);
		if (idError !== null) errors.push(idError);
		const revError = scanEventRevision(event, index, state);
		if (revError !== null) errors.push(revError);
	}
	if (state.max > ledgerRevision) {
		errors.push(
			`ledger_revision: stale concurrent write (event revision ${state.max} exceeds ledger_revision ${ledgerRevision})`,
		);
	}
	return errors;
}
export function validateLedgerSemantics(
	yamlText: string,
): SemanticValidationResult {
	const doc = parseDocument(yamlText);
	const parseErrors = doc.errors.map(
		(error) => `yaml parse error: ${error.message}`,
	);
	if (parseErrors.length > 0)
		return { valid: false, errors: dedupeSorted(parseErrors) };
	const data: unknown = doc.toJS();
	if (!isRecord(data))
		return { valid: false, errors: ["ledger root must be a YAML mapping"] };
	const errors: string[] = [];
	collectChildrenErrors(data, errors);
	collectEvidenceErrors(data, errors);
	const ledgerRevision =
		typeof data.ledger_revision === "number" ? data.ledger_revision : 0;
	errors.push(...collectEventErrors(data.events, ledgerRevision));
	const status = isRecord(data.program_status) ? data.program_status : {};
	if (
		typeof status.revision === "number" &&
		status.revision !== ledgerRevision
	) {
		errors.push(
			`program_status.revision: stale concurrent write (revision ${status.revision} does not match ledger_revision ${ledgerRevision})`,
		);
	}
	return { valid: errors.length === 0, errors: dedupeSorted(errors) };
}

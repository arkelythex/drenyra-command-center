/** U3f.2 — read-only compatibility import adapter (design "Migration and compatibility"): bootstrap imports of
 * legacy child states are marked `legacy-import` and map observed legacy state to program interpretation exactly
 * per the design table (no state.yaml → planning/non-executable; review-pending → blocked; implementation-blocked
 * → blocked; planning → planning; apply-permitting → eligible; implemented/verified/completed → observed progress
 * requiring closure proof; archived with acceptance proof → eligible for closure evaluation; unknown → blocked until
 * mapped). H02 is imported by reference preserving review-pending (existing drenyra-h02-tenant-isolation,
 * blocked/H02_REVIEW_PENDING). Unknown source schema versions fail closed unless a migration event records
 * validation=passed (migration events carry source/target/tool/before/after/validation). Import evidence
 * references stay inside the umbrella evidence metadata boundary (sibling OpenSpec/hybrid differences are
 * normalized only there). The adapter is read-only: it never writes child artifacts, and importing H02 never
 * mutates drenyra-h02-tenant-isolation/*. Whole integers only — no monetary floats. */
import {
	dedupeSorted,
	EXECUTABLE_FAMILY,
	eventEntries,
	H02_CHANGE_ID,
	isRecord,
	readToken,
} from "./validation-utils.js";

const KNOWN_SOURCE_VERSION = "1.0.0";
const IMPORT_MARKER = "legacy-import";
const OBSERVED_INTERPRETATION: Record<string, string> = {
	"no-state.yaml": "planning",
	"review-pending": "blocked",
	"implementation-blocked": "blocked",
	planning: "planning",
	"apply-permitting": "eligible",
	implemented: "progress",
	verified: "progress",
	completed: "progress",
	archived: "eligible",
} as const;
const REQUIRED_IMPORT_TOKENS = [
	"observed",
	"interpretation",
	"source-version",
] as const;
const MIGRATION_TOKENS = [
	"source",
	"target",
	"tool",
	"before",
	"after",
	"validation",
] as const;
export interface CompatibilityImportData {
	children?: Record<string, unknown>;
	evidence?: Record<string, unknown>;
	events?: unknown[];
}
interface ImportRecord {
	child: string;
	reason: string;
	refs: string[];
}
function importEvents(data: CompatibilityImportData): ImportRecord[] {
	const records: ImportRecord[] = [];
	for (const event of eventEntries(data.events, "import"))
		records.push({
			child: typeof event.child === "string" ? event.child : "",
			reason: typeof event.reason === "string" ? event.reason : "",
			refs: Array.isArray(event.evidence_refs)
				? event.evidence_refs.filter(
						(ref): ref is string => typeof ref === "string",
					)
				: [],
		});
	return records;
}
function migrationReasons(
	data: CompatibilityImportData,
	child: string,
): string[] {
	const reasons: string[] = [];
	for (const event of eventEntries(data.events, "migration")) {
		if (event.child !== child || typeof event.reason !== "string") continue;
		reasons.push(event.reason);
	}
	return reasons;
}
function childRecord(
	data: CompatibilityImportData,
	childId: string,
): Record<string, unknown> | null {
	const child = isRecord(data.children) ? data.children[childId] : undefined;
	return isRecord(child) ? child : null;
}
function expectedInterpretation(observed: string): string {
	return OBSERVED_INTERPRETATION[observed] ?? "blocked";
}
function stateConforms(expected: string, state: string): boolean {
	if (expected === "blocked") return state === "blocked";
	if (expected === "planning") return state === "planning";
	if (expected === "eligible") return state === "eligible";
	if (expected === "progress")
		return !(EXECUTABLE_FAMILY as readonly string[]).includes(state);
	return false;
}
function markerDefect(record: ImportRecord): string | null {
	return record.reason.startsWith(`${IMPORT_MARKER}:`)
		? null
		: `resolver: compatibility import: ${record.child} import event not marked legacy-import (bootstrap imports require the marker)`;
}
function completenessDefect(record: ImportRecord): string | null {
	const missing = REQUIRED_IMPORT_TOKENS.filter(
		(token) => readToken(record.reason, token) === "",
	);
	return missing.length > 0
		? `resolver: compatibility import: ${record.child} legacy import incomplete — missing ${missing.join(", ")}`
		: null;
}
function observedStatusDefect(
	record: ImportRecord,
	child: Record<string, unknown> | null,
): string | null {
	const observed = readToken(record.reason, "observed");
	const status =
		child !== null && typeof child.observed_status === "string"
			? child.observed_status
			: "";
	return observed !== status
		? `resolver: compatibility import: ${record.child} import observed ${observed} does not match child observed_status ${status}`
		: null;
}
function mappingDefect(
	record: ImportRecord,
	child: Record<string, unknown> | null,
): string | null {
	const observed = readToken(record.reason, "observed");
	const interpretation = readToken(record.reason, "interpretation");
	const expected = expectedInterpretation(observed);
	const state =
		child !== null && typeof child.program_state === "string"
			? child.program_state
			: "";
	const stateOk = stateConforms(expected, state);
	if (interpretation !== expected && !stateOk)
		return `resolver: compatibility import: ${record.child} observed ${observed} maps to ${expected}, but import records interpretation=${interpretation} and program_state ${state}`;
	if (interpretation !== expected)
		return `resolver: compatibility import: ${record.child} observed ${observed} maps to ${expected}, but import records interpretation=${interpretation}`;
	if (!stateOk)
		return `resolver: compatibility import: ${record.child} observed ${observed} maps to ${expected}, but program_state is ${state}`;
	return null;
}
function h02Defect(
	record: ImportRecord,
	child: Record<string, unknown> | null,
): string | null {
	if (record.child !== "C1") return null;
	const observed = readToken(record.reason, "observed");
	if (observed !== "review-pending")
		return `resolver: compatibility import: C1 H02 import must preserve review-pending (observed ${observed})`;
	const c1 = child;
	if (
		c1 === null ||
		c1.authority_mode !== "existing" ||
		c1.change_id !== H02_CHANGE_ID ||
		c1.program_state !== "blocked" ||
		!Array.isArray(c1.blockers) ||
		!c1.blockers.includes("H02_REVIEW_PENDING")
	)
		return "resolver: compatibility import: H02 must be imported by reference as existing drenyra-h02-tenant-isolation preserving blocked/H02_REVIEW_PENDING";
	return null;
}
function acceptanceDefect(record: ImportRecord): string | null {
	const observed = readToken(record.reason, "observed");
	if (observed !== "archived") return null;
	return readToken(record.reason, "acceptance") === "proof"
		? null
		: `resolver: compatibility import: ${record.child} archived legacy import requires acceptance proof (acceptance=proof) before closure evaluation`;
}
function versionDefect(
	record: ImportRecord,
	data: CompatibilityImportData,
): string | null {
	const version = readToken(record.reason, "source-version");
	if (version === KNOWN_SOURCE_VERSION) return null;
	const migrated = migrationReasons(data, record.child).some(
		(reason) =>
			readToken(reason, "validation") === "passed" &&
			readToken(reason, "target") === KNOWN_SOURCE_VERSION,
	);
	if (migrated) return null;
	return `resolver: compatibility import: ${record.child} unknown schema version ${version || "missing"} fails closed — migration event with validation=passed required`;
}
function boundaryDefect(
	record: ImportRecord,
	data: CompatibilityImportData,
): string | null {
	const evidence = isRecord(data.evidence) ? data.evidence : {};
	for (const ref of record.refs)
		if (!(ref in evidence))
			return `resolver: compatibility import: ${record.child} evidence reference ${ref} outside the umbrella evidence metadata boundary`;
	return null;
}
function migrationCompletenessErrors(data: CompatibilityImportData): string[] {
	const errors: string[] = [];
	for (const event of Array.isArray(data.events) ? data.events : []) {
		if (!isRecord(event) || event.kind !== "migration") continue;
		const id = typeof event.id === "string" ? event.id : "";
		const reason = typeof event.reason === "string" ? event.reason : "";
		const missing = MIGRATION_TOKENS.filter(
			(token) => readToken(reason, token) === "",
		);
		if (missing.length > 0)
			errors.push(
				`resolver: compatibility import: migration event ${id} incomplete — missing ${missing.join(", ")}`,
			);
	}
	return errors;
}
function pushDefect(errors: string[], defect: string | null): void {
	if (defect !== null) errors.push(defect);
}
export function compatibilityImportErrors(
	data: CompatibilityImportData,
): string[] {
	const errors: string[] = [];
	for (const record of importEvents(data)) {
		const marker = markerDefect(record);
		if (marker !== null) {
			errors.push(marker);
			continue;
		}
		const incomplete = completenessDefect(record);
		if (incomplete !== null) {
			errors.push(incomplete);
			continue;
		}
		const child = childRecord(data, record.child);
		pushDefect(errors, observedStatusDefect(record, child));
		pushDefect(errors, mappingDefect(record, child));
		pushDefect(errors, h02Defect(record, child));
		pushDefect(errors, acceptanceDefect(record));
		pushDefect(errors, versionDefect(record, data));
		pushDefect(errors, boundaryDefect(record, data));
	}
	errors.push(...migrationCompletenessErrors(data));
	return dedupeSorted(errors);
}

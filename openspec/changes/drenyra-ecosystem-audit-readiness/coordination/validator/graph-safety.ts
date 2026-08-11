/** U2b.2 — graph-safety hardening (criterion 7): C1 hard-bound to drenyra-h02-tenant-isolation; alternate C1 authority, duplicate tenant-isolation authority, and C1 bypass rejected program-wide. Cycles come from U2a.2's topological ordering. Whole integers only — no monetary floats. */
import { dedupeSorted, HARD_EDGES, isRecord } from "./validation-utils.js";

const C1_CHANGE_ID = "drenyra-h02-tenant-isolation";
const C1_STATE_PATH =
	"openspec/changes/drenyra-h02-tenant-isolation/state.yaml";
export interface GraphData {
	children?: Record<string, unknown>;
}
function c1BindingErrors(children: Record<string, unknown>): string[] {
	const c1 = children.C1;
	if (!isRecord(c1)) return [];
	const errors: string[] = [];
	if (c1.change_id !== C1_CHANGE_ID)
		errors.push(
			"resolver: graph safety: alternate C1 authority (C1 change_id must be drenyra-h02-tenant-isolation)",
		);
	if (c1.authority_mode !== "existing")
		errors.push(
			"resolver: graph safety: alternate C1 authority (C1 authority_mode must be existing)",
		);
	return errors;
}
function duplicateAuthorityErrors(children: Record<string, unknown>): string[] {
	const c1 = children.C1;
	if (!isRecord(c1)) return [];
	const errors: string[] = [];
	for (const id of Object.keys(children)) {
		if (id === "C1") continue;
		const child = children[id];
		if (!isRecord(child)) continue;
		if (child.change_id === C1_CHANGE_ID || child.state_path === C1_STATE_PATH)
			errors.push(
				`resolver: graph safety: duplicate tenant-isolation authority (${id})`,
			);
	}
	return errors;
}
function bypassErrors(children: Record<string, unknown>): string[] {
	const errors: string[] = [];
	for (const id of Object.keys(HARD_EDGES)) {
		const child = children[id];
		if (!isRecord(child) || !Array.isArray(child.dependencies)) continue;
		const deps = child.dependencies.filter(
			(d): d is string => typeof d === "string",
		);
		if (deps.length === 0) continue;
		for (const required of HARD_EDGES[id])
			if (!deps.includes(required))
				errors.push(
					`resolver: graph safety: C1 bypass (${id} missing dependency ${required})`,
				);
	}
	return errors;
}
export function graphSafetyErrors(data: GraphData): string[] {
	if (!isRecord(data.children)) return [];
	return dedupeSorted([
		...c1BindingErrors(data.children),
		...duplicateAuthorityErrors(data.children),
		...bypassErrors(data.children),
	]);
}

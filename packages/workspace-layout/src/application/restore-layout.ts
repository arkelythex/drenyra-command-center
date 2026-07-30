import type { WorkspaceLayout } from "../domain/layout";
import { CURRENT_LAYOUT_SCHEMA_VERSION } from "../domain/layout";
import { WORKSPACE_LAYOUT_TEMPLATE } from "../domain/template";
import { getAllViewIds } from "../domain/node";

// ─── Restore Warning ────────────────────────────────────────────────────────

export interface RestoreWarning {
	readonly kind:
		| "missing-view"
		| "unknown-template"
		| "corrupt-ratio"
		| "duplicate-view";
	readonly message: string;
}

// ─── Restore Validation Result ──────────────────────────────────────────────

export interface RestoreValidationResult {
	readonly valid: boolean;
	readonly warnings: readonly RestoreWarning[];
}

// ─── Known templates set ────────────────────────────────────────────────────

const KNOWN_TEMPLATES: Set<string> = new Set(
	Object.values(WORKSPACE_LAYOUT_TEMPLATE),
);

// ─── Restore Check ──────────────────────────────────────────────────────────

export function restoreLayoutCheck(
	layout: WorkspaceLayout,
): RestoreValidationResult {
	const warnings: RestoreWarning[] = [];

	// Check schema version
	if (layout.schemaVersion !== CURRENT_LAYOUT_SCHEMA_VERSION) {
		warnings.push({
			kind: "corrupt-ratio",
			message: `Schema version mismatch: ${layout.schemaVersion} (expected ${CURRENT_LAYOUT_SCHEMA_VERSION})`,
		});
	}

	// Check template is known
	if (!KNOWN_TEMPLATES.has(layout.template)) {
		warnings.push({
			kind: "unknown-template",
			message: `Unknown template: ${layout.template}. Falling back to default.`,
		});
	}

	// Collect all viewIds and check for duplicates
	const allIds = getAllViewIds(layout.root);
	const seen = new Set<string>();
	const duplicates = new Set<string>();

	for (const id of allIds) {
		if (seen.has(id)) {
			duplicates.add(id);
		} else {
			seen.add(id);
		}
	}

	if (duplicates.size > 0) {
		warnings.push({
			kind: "duplicate-view",
			message: `Duplicate viewIds found: ${Array.from(duplicates).join(", ")}`,
		});
	}

	// Validate split ratios in the tree
	const ratioWarnings = validateRatiosInTree(layout.root);
	warnings.push(...ratioWarnings);

	return {
		valid: warnings.length === 0,
		warnings,
	};
}

// ─── Ratio Validation ──────────────────────────────────────────────────────

function validateRatiosInTree(
	node: import("../domain/node").LayoutNode,
): RestoreWarning[] {
	const w: RestoreWarning[] = [];

	function walk(n: import("../domain/node").LayoutNode): void {
		if (n.kind === "split") {
			if (n.ratio < 0.1 || n.ratio > 0.9) {
				w.push({
					kind: "corrupt-ratio",
					message: `Corrupt ratio ${n.ratio} in split ${n.splitId}. Will normalize to 0.5.`,
				});
			}
			walk(n.first);
			walk(n.second);
		} else if (n.kind === "tab-group") {
			for (const tab of n.tabs) {
				walk(tab);
			}
		}
	}

	walk(node);
	return w;
}

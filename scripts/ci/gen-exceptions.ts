#!/usr/bin/env bun
/**
 * Generate forbidden-terms exceptions baseline.
 * Scans all codebase files, runs the same checks as check-forbidden-terms.ts,
 * and outputs an --exceptions-file compatible JSON.
 *
 * Usage: bun scripts/ci/gen-exceptions.ts > scripts/ci/forbidden-terms-exceptions.json
 */
import { globSync } from "glob";
import { readFileSync } from "fs";

const FORBIDDEN_TERMS = [
	{ term: "Swarm", context: "code" as const, message: "" },
	{ term: "swarm", context: "code" as const, message: "" },
	{ term: "Cognitive", context: "code" as const, message: "" },
	{ term: "cognitive", context: "code" as const, message: "" },
	{ term: "Orchestrator", context: "code" as const, message: "" },
	{ term: "orchestrator", context: "code" as const, message: "" },
	{ term: "Pipeline", context: "code" as const, message: "" },
	{ term: "pipeline", context: "code" as const, message: "" },
	{ term: "Hub", context: "code" as const, message: "" },
	{ term: "hub", context: "code" as const, message: "" },
	{ term: "idle", context: "display" as const, message: "" },
	{ term: "Idle", context: "display" as const, message: "" },
	{ term: "Gateway", context: "code" as const, message: "" },
	{ term: "gateway", context: "code" as const, message: "" },
	{ term: "Worktree", context: "code" as const, message: "" },
	{ term: "worktree", context: "code" as const, message: "" },
];

const ALLOWED_PATTERNS: RegExp[] = [
	/\/drenyra\/control-tower/,
	/\/drenyra\/hub/,
	/routeTree/,
	/i18n/,
	/\.test\./,
	/\.spec\./,
	/__tests__/,
	/__mocks__/,
	/__snapshots__/,
	/\/packages\/agents\/src\//,
];

function isCommentLine(line: string): boolean {
	const trimmed = line.trimStart();
	return (
		trimmed.startsWith("//") ||
		trimmed.startsWith("*") ||
		trimmed.startsWith("/*") ||
		trimmed.startsWith("*")
	);
}

function scanFile(filePath: string): Array<{ term: string; line: number }> {
	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");
	const violations: Array<{ term: string; line: number }> = [];

	for (const allowed of ALLOWED_PATTERNS) {
		if (allowed.test(filePath)) return [];
	}

	for (let i = 0; i < lines.length; i++) {
		if (isCommentLine(lines[i])) continue;

		const lineLower = lines[i].toLowerCase();

		for (const { term, context } of FORBIDDEN_TERMS) {
			if (!lineLower.includes(term.toLowerCase())) continue;

			const trimmed = lines[i].trim();
			if (context === "display" && trimmed.startsWith("//")) continue;

			if (context === "display") {
				// Only flag display-context idle terms that appear as rendered text
				// (not in string comparisons, state machine values, etc.)
				const trimmed = lines[i].trim();
				if (
					trimmed.startsWith("//") ||
					trimmed.startsWith("/*") ||
					trimmed.startsWith("*") ||
					trimmed.startsWith('"idle"') ||
					trimmed.startsWith("'idle'") ||
					trimmed.startsWith("`idle`") ||
					trimmed.includes('=== "idle"') ||
					trimmed.includes("=== 'idle'") ||
					trimmed.includes('!== "idle"') ||
					trimmed.includes("!== 'idle'") ||
					trimmed.includes('"idle" :') ||
					trimmed.includes("'idle' :") ||
					trimmed.includes('"idle" |') ||
					trimmed.includes("'idle' |") ||
					trimmed.includes("idle:") ||
					trimmed.startsWith("const") ||
					trimmed.startsWith("let ") ||
					trimmed.startsWith("type ") ||
					trimmed.startsWith("interface ") ||
					trimmed.startsWith("initial:") ||
					trimmed.includes("? ")
				) {
					continue;
				}
			}
		}
	}

	return violations;
}

const files = globSync("{apps/web/src,packages/agents/src}/**/*.{tsx,ts}", {
	ignore: ["**/node_modules/**"],
});

const exceptions: Record<
	string,
	Array<{ term: string; line: number; reason: string }>
> = {};

for (const file of files) {
	const violations = scanFile(file);
	if (violations.length === 0) continue;

	exceptions[file] = violations.map((v) => ({
		term: v.term,
		line: v.line,
		reason: "pre-existing",
	}));
}

console.log(JSON.stringify(exceptions, null, 2));

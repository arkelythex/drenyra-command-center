#!/usr/bin/env bun
/**
 * check-forbidden-terms.ts
 *
 * CI guardrail: scans apps/web/src/ for forbidden English/orchestration-internal
 * terms in JSX string literals. Fails the build if any are found outside
 * allowed locations (route paths, code comments, test files, copy registry).
 */

import { readFileSync } from "node:fs";
import { globSync } from "glob";

const FORBIDDEN_TERMS = [
	// English status labels that expose orchestration internals
	{
		term: "idle",
		context: "jsx-string",
		message:
			"Use Spanish equivalent ('inactivo', 'esperando', or a progress-based label)",
	},
	{ term: "Idle", context: "jsx-string", message: "Use Spanish equivalent" },
	// Internal component names leaking to UI
	{
		term: "Swarm",
		context: "code",
		message: "Internal orchestration concept — do not expose in UI",
	},
	{ term: "swarm", context: "code", message: "Internal orchestration concept" },
	{
		term: "Worktree",
		context: "code",
		message: "Developer concept — not for user UI",
	},
	{
		term: "worktree",
		context: "code",
		message: "Developer concept — not for user UI",
	},
	{
		term: "Cognitive",
		context: "code",
		message:
			"Internal component name — use 'Inteligencia' or context-specific term",
	},
	{ term: "cognitive", context: "code", message: "Internal component name" },
	{ term: "Orchestrator", context: "code", message: "Internal system concept" },
	{ term: "orchestrator", context: "code", message: "Internal system concept" },
	{
		term: "Pipeline",
		context: "code",
		message: "Technical concept — not for user UI",
	},
	{
		term: "pipeline",
		context: "code",
		message: "Technical concept — not for user UI",
	},
	{ term: "Hub", context: "code", message: "Internal component name" },
	{ term: "hub", context: "code", message: "Internal component name" },
	{ term: "Gateway", context: "code", message: "Internal component name" },
	{ term: "gateway", context: "code", message: "Internal component name" },
] as const;

const ALLOWED_PATTERNS = [
	// Route paths — allowed to contain these as URL segments
	/\/drenyra\/control-tower/,
	/\/drenyra\/hub/,
	/routeTree/,
	// Copy registry file — central location for approved translations
	/i18n/,
	/locales/,
	/translations/,
	// Test files — orchestration terms may appear in test descriptions
	/\.test\./,
	/\.spec\./,
	/__tests__/,
	// Type definitions — orchestration types are allowed in .ts
	/\.d\.ts$/,
	// The CI script itself
	/check-forbidden-terms\.ts$/,
];

interface Violation {
	file: string;
	line: number;
	term: string;
	message: string;
}

function isAllowed(path: string): boolean {
	return ALLOWED_PATTERNS.some((pattern) => pattern.test(path));
}

function scanFile(filePath: string): Violation[] {
	const violations: Violation[] = [];
	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		// Skip comments
		if (
			line.trimStart().startsWith("//") ||
			line.trimStart().startsWith("/*") ||
			line.trimStart().startsWith("*")
		) {
			continue;
		}

		for (const { term, context, message } of FORBIDDEN_TERMS) {
			if (!line.includes(term)) continue;

			// For JSX context terms, verify we're in a display context (not code)
			if (context === "jsx-string") {
				const inDisplayContext =
					line.includes(`>${term}<`) ||
					line.includes(`{${term}}`) ||
					line.includes(`"${term}"`) ||
					line.includes(`'${term}'`);
				if (!inDisplayContext) continue;
			}

			violations.push({ file: filePath, line: lineNum, term, message });
		}
	}

	return violations;
}

function main(): void {
	const files = globSync("apps/web/src/**/*.{tsx,ts}", {
		ignore: [
			"**/node_modules/**",
			"**/routeTree.gen.ts",
			"**/routeTree.gen.ts/*",
		],
	});

	let allViolations: Violation[] = [];

	for (const file of files) {
		if (isAllowed(file)) continue;
		const violations = scanFile(file);
		allViolations = allViolations.concat(violations);
	}

	if (allViolations.length > 0) {
		console.error("❌ Forbidden terms found in user-facing code:\n");
		for (const v of allViolations) {
			console.error(`  ${v.file}:${v.line} — "${v.term}"`);
			console.error(`    ${v.message}`);
		}
		console.error(`\nTotal: ${allViolations.length} violation(s)`);
		process.exit(1);
	}

	console.log("✅ No forbidden terms found in user-facing code.");
	process.exit(0);
}

main();

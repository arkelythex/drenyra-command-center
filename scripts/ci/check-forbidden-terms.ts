#!/usr/bin/env bun
/**
 * check-forbidden-terms.ts
 *
 * CI guardrail: scans apps/web/src/ for forbidden English/orchestration-internal
 * terms in JSX string literals. Fails the build if any are found outside
 * allowed locations (route paths, code comments, test files, copy registry).
 *
 * Flags:
 *   --exceptions-file <path>   Path to JSON exceptions file (relative to project root)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { globSync } from "glob";

const FORBIDDEN_TERMS = [
	{
		term: "idle",
		context: "jsx-string",
		message:
			"Use Spanish equivalent ('inactivo', 'esperando', or a progress-based label)",
	},
	{ term: "Idle", context: "jsx-string", message: "Use Spanish equivalent" },
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
	/\/drenyra\/control-tower/,
	/\/drenyra\/hub/,
	/routeTree/,
	/i18n/,
	/locales/,
	/translations/,
	/\.test\./,
	/\.spec\./,
	/__tests__/,
	/\.d\.ts$/,
	/check-forbidden-terms\.ts$/,
];

interface Violation {
	file: string;
	line: number;
	term: string;
	message: string;
}

interface ExceptionEntry {
	term: string;
	line?: number;
	reason: string;
}

interface ExceptionsFile {
	[filePath: string]: ExceptionEntry[];
}

function parseArgs(): { exceptionsFile?: string } {
	const args = process.argv.slice(2);
	const result: { exceptionsFile?: string } = {};
	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--exceptions-file" && args[i + 1]) {
			result.exceptionsFile = args[i + 1];
			i++;
		}
	}
	return result;
}

function loadExceptions(path: string | undefined): ExceptionsFile {
	if (!path) return {};
	try {
		const content = readFileSync(resolve(process.cwd(), path), "utf-8");
		return JSON.parse(content);
	} catch (err) {
		console.error(`⚠️  Could not load exceptions file "${path}":`, err);
		return {};
	}
}

function isAllowed(path: string): boolean {
	return ALLOWED_PATTERNS.some((pattern) => pattern.test(path));
}

function scanFile(filePath: string, exceptions: ExceptionsFile): Violation[] {
	const violations: Violation[] = [];
	const fileExceptions = exceptions[filePath] ?? [];
	const exceptionKeys = new Set(
		fileExceptions.map((e) => (e.line ? `${e.term}:${e.line}` : e.term)),
	);
	const bareTermExceptions = new Set(
		fileExceptions.filter((e) => !e.line).map((e) => e.term),
	);
	const content = readFileSync(filePath, "utf-8");
	const lines = content.split("\n");

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNum = i + 1;

		if (
			line.trimStart().startsWith("//") ||
			line.trimStart().startsWith("/*") ||
			line.trimStart().startsWith("*")
		) {
			continue;
		}

		for (const { term, context, message } of FORBIDDEN_TERMS) {
			if (!line.includes(term)) continue;

			if (context === "jsx-string") {
				const inDisplayContext =
					line.includes(`>${term}<`) ||
					line.includes(`{${term}}`) ||
					line.includes(`"${term}"`) ||
					line.includes(`'${term}'`);
				if (!inDisplayContext) continue;
			}

			const key = lineNum ? `${term}:${lineNum}` : term;
			if (exceptionKeys.has(key) || bareTermExceptions.has(term)) continue;

			violations.push({ file: filePath, line: lineNum, term, message });
		}
	}

	return violations;
}

function main(): void {
	const { exceptionsFile } = parseArgs();
	const exceptions = loadExceptions(exceptionsFile);

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
		const violations = scanFile(file, exceptions);
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

if (import.meta.main) {
	main();
}

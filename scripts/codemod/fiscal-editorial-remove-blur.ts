#!/usr/bin/env bun
/**
 * Mechanical codemod — remove decorative backdrop-blur (Fiscal Editorial v3).
 * Usage: bun scripts/codemod/fiscal-editorial-remove-blur.ts [glob-root...]
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const DEFAULT_ROOTS = [
	"apps/web/src/features",
	"apps/web/src/components",
	"apps/web/src/context",
];

const SKIP_SUBSTRINGS = [
	"glass-card.tsx",
	"liquid-glass.tsx",
	"visual-tokens.ts",
	"fiscal-editorial.test.tsx",
	"ComponentsSection.tsx",
	"agentic/README.md",
	"agentic/EXAMPLES.md",
];

const OVERLAY_REPLACEMENTS: ReadonlyArray<[RegExp, string]> = [
	[/bg-black\/60\s+backdrop-blur-sm/g, "ui-overlay"],
	[/bg-black\/50\s+backdrop-blur-sm/g, "ui-overlay"],
	[/bg-background\/70\s+p-6\s+backdrop-blur-sm/g, "ui-overlay p-6"],
	[/bg-background\/70\s+p-4\s+backdrop-blur-md/g, "ui-overlay p-4"],
	[/bg-background\/55\s+backdrop-blur-\[2px\]/g, "bg-[var(--surface-1)]/80"],
];

const BLUR_PATTERNS: ReadonlyArray<RegExp> = [
	/\bbackdrop-blur-sm\b/g,
	/\bbackdrop-blur-md\b/g,
	/\bbackdrop-blur-lg\b/g,
	/\bbackdrop-blur-xl\b/g,
	/\bbackdrop-blur-2xl\b/g,
	/\bbackdrop-blur-3xl\b/g,
	/\bbackdrop-blur-\[2px\]\b/g,
	/\bbackdrop-blur-\[20px\]\b/g,
	/\bbackdrop-blur-\[22px\]\b/g,
];

/** @param content Raw file source */
function transform(content: string): string {
	let out = content;
	for (const [pattern, replacement] of OVERLAY_REPLACEMENTS) {
		out = out.replace(pattern, replacement);
	}
	for (const pattern of BLUR_PATTERNS) {
		out = out.replace(pattern, "");
	}
	return out;
}

function walk(dir: string, files: string[]): void {
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) {
			walk(path, files);
			continue;
		}
		if (!/\.(tsx|ts)$/.test(entry)) continue;
		if (SKIP_SUBSTRINGS.some((skip) => path.includes(skip))) continue;
		files.push(path);
	}
}

const roots =
	process.argv.slice(2).length > 0 ? process.argv.slice(2) : DEFAULT_ROOTS;
const files: string[] = [];
for (const root of roots) walk(root, files);

let changed = 0;
for (const file of files) {
	const before = readFileSync(file, "utf8");
	const after = transform(before);
	if (after !== before) {
		writeFileSync(file, after);
		changed += 1;
		console.log(relative(process.cwd(), file));
	}
}

console.log(`\nUpdated ${changed} file(s).`);

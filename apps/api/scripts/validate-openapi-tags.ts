/**
 * OpenAPI Tag Coverage Validator.
 *
 * Scans all route files for `tags: [...]` usage and compares against
 * the tag definitions registered in `app-core.ts`. Reports:
 *
 * - Tags used in routes but NOT registered in swagger config
 * - Tags registered in swagger config but NOT used in any route
 *
 * Run via: `bun run apps/api/scripts/validate-openapi-tags.ts`
 *
 * @module scripts/validate-openapi-tags
 */

import { readFileSync, readdirSync } from "fs";
import { join, relative } from "path";

const API_SRC = join(import.meta.dir, "..", "src");
const APP_CORE = join(API_SRC, "app-core.ts");
const FEATURES_DIR = join(API_SRC, "features");

// ─── Helpers ───────────────────────────────────────────────────────

/** Extract all tag names from swagger `tags: [{ name: "X", ... }, ...]` in app-core.ts */
function extractRegisteredTags(): string[] {
	const content = readFileSync(APP_CORE, "utf-8");
	// Match `name: "..."` inside `tags: [...]` array
	const regex = /tags:\s*\[([\s\S]*?)\]/;
	const match = content.match(regex);
	if (!match) return [];

	const nameRegex = /name:\s*"([^"]+)"/g;
	const names: string[] = [];
	let m: RegExpExecArray | null;
	while ((m = nameRegex.exec(match[1])) !== null) {
		names.push(m[1]);
	}
	return names;
}

/** Recursively find all .ts files in a directory (excluding __tests__ and .d.ts) */
function collectRouteFiles(dir: string): string[] {
	const files: string[] = [];
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "__tests__" || entry.name === "node_modules") continue;
			files.push(...collectRouteFiles(full));
		} else if (
			entry.isFile() &&
			entry.name.endsWith(".ts") &&
			!entry.name.endsWith(".d.ts") &&
			!entry.name.endsWith(".test.ts")
		) {
			files.push(full);
		}
	}
	return files;
}

/** Extract tag names from `tags: ["X", "Y"]` patterns in a file */
function extractUsedTags(filePath: string): string[] {
	const content = readFileSync(filePath, "utf-8");
	// Match tags: ["TagName"] or tags: ["TagName1", "TagName2"]
	const regex = /tags:\s*\[([^\]]+)\]/g;
	const tags = new Set<string>();
	let match: RegExpExecArray | null;
	while ((match = regex.exec(content)) !== null) {
		const inner = match[1];
		const tagRegex = /"([^"]+)"/g;
		let m: RegExpExecArray | null;
		while ((m = tagRegex.exec(inner)) !== null) {
			tags.add(m[1]);
		}
	}
	return [...tags];
}

// ─── Main ──────────────────────────────────────────────────────────

function main(): { code: number } {
	const registered = new Set(extractRegisteredTags());
	const routeFiles = collectRouteFiles(FEATURES_DIR);

	// Collect all tags used across routes
	const usedTags = new Set<string>();
	const tagUsage: Record<string, string[]> = {};

	for (const file of routeFiles) {
		const tags = extractUsedTags(file);
		for (const tag of tags) {
			usedTags.add(tag);
			if (!tagUsage[tag]) tagUsage[tag] = [];
			tagUsage[tag].push(relative(API_SRC, file));
		}
	}

	// Remove known non-route tags (zod schemas, entity tags, etc.)
	const _knownDataFields = [
		"tags", // zod `tags: z.array(...)`
		"tags: body.tags", // entity field
		"tags: cmd.tags",
		"tags: data.tags",
		"tags: bill.tags",
		"tags: command.tags",
		"tags: input.tags",
	];

	let issues = 0;

	// Find used tags not registered
	const unregistered = [...usedTags].filter((t) => !registered.has(t));
	if (unregistered.length > 0) {
		console.log("❌ Tags used in routes but NOT registered in swagger config:");
		for (const tag of unregistered.sort()) {
			const files = tagUsage[tag]?.slice(0, 3) ?? [];
			console.log(`   - "${tag}" (used in ${files.length} file(s))`);
			for (const f of files) {
				console.log(`       ${f}`);
			}
		}
		issues += unregistered.length;
	} else {
		console.log("✅ All used tags are registered in swagger config.");
	}

	// Find registered tags not used anywhere
	const orphaned = [...registered].filter(
		(t) => !usedTags.has(t) && t !== "Observability",
	);
	// Observability is used by frontend-telemetry which is registered but may not match exactly
	if (orphaned.length > 0) {
		console.log(
			"\n⚠️  Tags registered in swagger config but NOT used in any route:",
		);
		for (const tag of orphaned.sort()) {
			console.log(`   - "${tag}"`);
		}
	}

	const totalTags = registered.size;
	const usedCount = [...usedTags].filter((t) => registered.has(t)).length;

	console.log(
		`\n📊  ${totalTags} tags registered · ${usedCount} tags in use · ${unregistered.length} unregistered`,
	);

	return { code: issues > 0 ? 1 : 0 };
}

const { code } = main();
process.exit(code);

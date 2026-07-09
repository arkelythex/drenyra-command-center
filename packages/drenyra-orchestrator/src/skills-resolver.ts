/**
 * Drenyra Orchestrator — Skills Resolver
 *
 * Reads the skill registry, matches tasks against triggers,
 * and returns exact SKILL.md paths for subagent loading.
 */

import type { SkillEntry, SkillRegistry, SkillResolution } from "./types";

const REGISTRY_PATH = ".atl/skill-registry.md";
const SKILL_DIRS = [".agent/skills", ".pi/skills"];

// ============================================================================
// Markdown Registry Parser
// ============================================================================

/**
 * Parse a markdown skill registry file.
 * Expected format:
 * ```markdown
 * | skill-name | Description | Trigger pattern | path/to/SKILL.md |
 * ```
 */
export function parseSkillRegistry(markdown: string): SkillRegistry {
	const lines = markdown.split("\n");
	const skills: SkillEntry[] = [];

	for (const line of lines) {
		const trimmed = line.trim();

		if (!trimmed.startsWith("|") || trimmed.includes("---")) {
			continue;
		}

		const cells = trimmed
			.split("|")
			.map((c) => c.trim())
			.filter(Boolean);

		if (cells.length >= 4) {
			const name = cells[0]!;
			// Skip header rows (common header labels: Skill, Name, Task, etc.)
			const isHeader = ["skill", "name", "task", "lens", "phase"].includes(
				name.toLowerCase(),
			);
			if (isHeader) continue;

			skills.push({
				name,
				description: cells[1]!,
				trigger: cells[2]!,
				path: cells[3]!,
				scope: cells[3]?.startsWith(".") ? "project" : "global",
			});
		}
	}

	return {
		version: "1.0",
		updatedAt: new Date().toISOString(),
		skills,
	};
}

// ============================================================================
// File System Resolver
// ============================================================================

/**
 * Resolve the skill registry from the filesystem.
 * Checks `.atl/skill-registry.md` first, then known skill directories.
 */
export async function resolveRegistry(
	rootDir: string,
): Promise<{ registry: SkillRegistry | null; resolution: SkillResolution }> {
	try {
		const registryPath = `${rootDir}/${REGISTRY_PATH}`;
		const content = await readFileSafe(registryPath);
		if (content) {
			return {
				registry: parseSkillRegistry(content),
				resolution: "paths-injected",
			};
		}
	} catch {
		/* empty — fall through to fallback paths */
	}

	// Fallback: scan known skill directories
	for (const dir of SKILL_DIRS) {
		const dirPath = `${rootDir}/${dir}`;
		try {
			const entries = await readDirSafe(dirPath);
			if (entries.length > 0) {
				const skills: SkillEntry[] = entries
					.filter((e) => e.endsWith(".md"))
					.map((name) => ({
						name: name.replace(".md", ""),
						description: `Skill from ${dir}/${name}`,
						trigger: "manual",
						path: `${dir}/${name}`,
						scope: "project" as const,
					}));

				return {
					registry: {
						version: "1.0",
						updatedAt: new Date().toISOString(),
						skills,
					},
					resolution: "fallback-path",
				};
			}
		} catch {
			/* empty — skip inaccessible dir */
		}
	}

	return { registry: null, resolution: "none" };
}

// ============================================================================
// Task Matching
// ============================================================================

export interface TaskContext {
	/** Code file extensions the subagent will touch. */
	fileExtensions: string[];
	/** Target file paths or patterns. */
	targetPaths: string[];
	/** Task intent keywords. */
	intent: string[];
	/** Specific skill names requested. */
	skillNames?: string[];
}

/**
 * Match a task context against the skill registry.
 * Returns the exact SKILL.md paths that should be loaded.
 */
export function matchSkills(
	context: TaskContext,
	registry: SkillRegistry,
): { paths: string[]; names: string[] } {
	const matched = new Set<SkillEntry>();

	for (const skill of registry.skills) {
		// Direct name match wins
		if (context.skillNames?.includes(skill.name)) {
			matched.add(skill);
			continue;
		}

		// Trigger pattern matching
		const triggerLower = skill.trigger.toLowerCase();

		// Check intent keywords
		const intentMatch = context.intent.some((i) =>
			triggerLower.includes(i.toLowerCase()),
		);
		if (intentMatch) {
			matched.add(skill);
			continue;
		}

		// Check file extension match
		const extMatch = context.fileExtensions.some((ext) =>
			triggerLower.includes(ext),
		);
		if (extMatch) {
			matched.add(skill);
			continue;
		}

		// Check path match: does any target path contain the skill name or trigger keywords
		const pathMatch = context.targetPaths.some((p) => {
			const pathLower = p.toLowerCase();
			return (
				pathLower.includes(skill.name) ||
				skill.trigger
					.split(/[,\s]+/)
					.some((t) => t.length > 2 && pathLower.includes(t))
			);
		});
		if (pathMatch) {
			matched.add(skill);
		}
	}

	return {
		paths: Array.from(matched).map((s) => s.path),
		names: Array.from(matched).map((s) => s.name),
	};
}

// ============================================================================
// Helpers
// ============================================================================

async function readFileSafe(_path: string): Promise<string | null> {
	try {
		// In Pi runtime, use the read tool
		return await Promise.resolve().then(() => {
			// This is a stub for type-safe usage;
			// at runtime, the orchestrator calls the FS read tool directly.
			return null;
		});
	} catch {
		return null;
	}
}

async function readDirSafe(_path: string): Promise<string[]> {
	try {
		// Stub — runtime uses bash `ls` or file system tools
		return [];
	} catch {
		return [];
	}
}

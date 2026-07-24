/**
 * SDD-009C — Fiscal classifier, determinist, no model calls.
 *
 * Examines paths + diff content. No HTTP, no LLM, no API calls.
 * Bootstrap config validated against rg --files, imports, and dependency graph.
 */

import type { AuthorityLevel } from "../runtime/budget";

// ============================================================================
// Types
// ============================================================================

export interface ClassifierConfig {
	version: string;
	/** R3 paths — always blocked; take precedence over R2 */
	r3Paths: string[];
	/** R3 content patterns — destructive ops */
	r3ContentPatterns: string[];
	/** R2 fiscal paths */
	paths: string[];
	/** R2 fiscal content patterns */
	contentPatterns: string[];
	/** Level when classification is ambiguous */
	fallbackLevel: AuthorityLevel;
	/** Paths excluded from path-based matching (NOT from content matching) */
	excludedPaths: string[];
}

export interface DiffEntry {
	addedLines: string[];
	modifiedFiles: string[];
	renamedFiles: string[];
	deletedFiles: string[];
}

export interface ClassifierResult {
	level: AuthorityLevel;
	matchedPaths: string[];
	matchedContentPatterns: string[];
	blocked: boolean;
	ambiguous: boolean;
	failClosed: boolean;
	evaluatedAt: string;
	reason: string;
	diffStats: {
		addedLines: number;
		modifiedFiles: number;
		renamedFiles: string[];
		deletedFiles: string[];
	};
}

// ============================================================================
// Default bootstrap config (v1.0.0)
// Validated against rg --files, imports, and dependency graph during impl.
// ============================================================================

export const DEFAULT_CLASSIFIER_CONFIG: ClassifierConfig = {
	version: "1.0.0",
	// R3 — always blocked, requires explicit human authorization
	r3Paths: [
		"**/migrations/production/**",
		"**/deploy/production/**",
		"**/infrastructure/production/**",
		"**/secrets/**",
		"**/config/production/**",
		"packages/infrastructure/src/external/sunat/live/**",
		"packages/infrastructure/src/external/sire/live/**",
		"packages/infrastructure/src/transport/sunat/",
		"packages/infrastructure/src/transport/sire/",
	],
	r3ContentPatterns: [
		"\\bDROP\\s+(TABLE|DATABASE|SCHEMA|COLUMN|INDEX|VIEW|PROCEDURE|FUNCTION|TRIGGER|CONSTRAINT|SEQUENCE|TYPE|POLICY|ROLE)\\b",
		"\\bALTER\\s+TABLE\\b.*\\bDROP\\b",
		"\\bTRUNCATE\\b",
		"\\bproduction.*(?:migrate|deploy|push)\\b",
		"\\blive.*(?:sunat|sire)\\b",
		"\\b(?:POST|PUT|DELETE|PATCH)\\b.*\\b(?:sunat|sire)\\b",
		"\\bapi\\.sunat\\.gob\\.pe\\b",
		"\\bapi\\.sire\\.gob\\.pe\\b",
	],
	paths: [
		"packages/fiscal/",
		"packages/domain/src/fiscal/",
		"packages/domain/src/types/fiscal/",
		"packages/application/src/fiscal/",
		"apps/api/src/routes/fiscal/",
		"apps/data-engine/**/fiscal/",
		"packages/persistence/**/sunat/",
		"packages/persistence/**/sire/",
		"packages/infrastructure/**/external/sunat/",
		"packages/infrastructure/**/external/sire/",
		"packages/domain/src/rates/",
		"packages/domain/src/compliance/",
		"packages/domain/src/retention/",
		"packages/domain/src/detraction/",
		"packages/domain/src/perception/",
		"packages/application/src/compliance/",
		// Self-modification — changing the classifier, its config, or the hook is R2 minimum
		"packages/drenyra-orchestrator/src/classifier/",
		".githooks/",
	],
	contentPatterns: [
		"\\bRUC\\b",
		"\\bIGV\\b",
		"\\bISC\\b",
		"\\bdetraccion",
		"\\bdetracción",
		"\\bretencion",
		"\\bretención",
		"\\bpercepcion",
		"\\bpercepción",
		"\\bSUNAT\\b",
		"\\bSIRE\\b",
		"\\bUBL\\b",
		"\\bCDR\\b",
		"\\bidempotency_key\\b",
		"\\bnatural_uniqueness\\b",
		"\\bUNKNOWN\\b",
		"\\btenant_id\\b",
		"\\btasa\\b.*\\b\\d+%\\b",
		"\\bthreshold\\b.*\\bfiscal\\b",
	],
	fallbackLevel: "R2",
	// excludedPaths only skips PATH-based matching, NOT content-pattern matching.
	// Fiscal content inside test or doc files is still caught by contentPatterns.
	excludedPaths: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
};

// ============================================================================
// Config loader
// ============================================================================

export function loadClassifierConfig(
	source: Record<string, unknown> | undefined,
): ClassifierConfig {
	if (!source) return { ...DEFAULT_CLASSIFIER_CONFIG };

	return {
		version: String(source.version ?? DEFAULT_CLASSIFIER_CONFIG.version),
		r3Paths: Array.isArray(source.r3Paths)
			? (source.r3Paths as string[])
			: [...DEFAULT_CLASSIFIER_CONFIG.r3Paths],
		r3ContentPatterns: Array.isArray(source.r3ContentPatterns)
			? (source.r3ContentPatterns as string[])
			: [...DEFAULT_CLASSIFIER_CONFIG.r3ContentPatterns],
		paths: Array.isArray(source.paths)
			? (source.paths as string[])
			: [...DEFAULT_CLASSIFIER_CONFIG.paths],
		contentPatterns: Array.isArray(source.contentPatterns)
			? (source.contentPatterns as string[])
			: [...DEFAULT_CLASSIFIER_CONFIG.contentPatterns],
		fallbackLevel:
			(source.fallbackLevel as AuthorityLevel) ??
			DEFAULT_CLASSIFIER_CONFIG.fallbackLevel,
		excludedPaths: Array.isArray(source.excludedPaths)
			? (source.excludedPaths as string[])
			: [...DEFAULT_CLASSIFIER_CONFIG.excludedPaths],
	};
}

// ============================================================================
// Glob matching helper (simple, no ext deps)
// ============================================================================

function matchGlob(filePath: string, pattern: string): boolean {
	// **/.../** — directory glob at both ends
	if (pattern.startsWith("**/") && pattern.endsWith("/**")) {
		const inner = pattern.slice(3, -3);
		return filePath.includes(`/${inner}/`);
	}
	// **/... — prefix glob
	if (pattern.startsWith("**/")) {
		const suffix = pattern.slice(3);
		return filePath.endsWith(suffix) || filePath.includes(`/${suffix}`);
	}
	// .../** — suffix glob
	if (pattern.endsWith("/**")) {
		const prefix = pattern.slice(0, -3);
		return filePath.startsWith(prefix);
	}
	return filePath.startsWith(pattern);
}

/** Match files against path patterns, collecting matches. Returns tagged matches. */
function matchFiles(
	files: string[],
	paths: string[],
	excludedPaths: string[],
	tag: string,
): string[] {
	const matches: string[] = [];
	for (const file of files) {
		if (excludedPaths.some((excl) => matchGlob(file, excl))) continue;
		for (const pattern of paths) {
			if (matchGlob(file, pattern)) {
				matches.push(tag ? `${tag} ${file}` : file);
				break;
			}
		}
	}
	return matches;
}

/** Scan added lines for content patterns. Returns matched pattern strings. */
function matchContentPatterns(lines: string[], patterns: string[]): string[] {
	const matches: string[] = [];
	for (const line of lines) {
		for (const raw of patterns) {
			try {
				if (new RegExp(raw, "i").test(line)) {
					matches.push(raw);
				}
			} catch {
				// skip invalid regex
			}
		}
	}
	return [...new Set(matches)];
}

/**
 * Determine authority level with R3 > R2 > R1 > R0 precedence.
 * If both R3 and R2 match, R3 wins.
 */
function determineLevel(
	r3Found: boolean,
	r2Found: boolean,
	diff: DiffEntry,
	fallback: AuthorityLevel,
): { level: AuthorityLevel; ambiguous: boolean; failClosed: boolean } {
	if (r3Found) return { level: "R3", ambiguous: false, failClosed: false };
	if (r2Found) return { level: "R2", ambiguous: false, failClosed: false };
	if (diff.modifiedFiles.length === 0 && diff.addedLines.length > 0) {
		return { level: fallback, ambiguous: true, failClosed: true };
	}
	return { level: "R1", ambiguous: false, failClosed: false };
}

function buildReason(
	level: AuthorityLevel,
	ambiguous: boolean,
	failClosed: boolean,
	r3Paths: string[],
	r3Patterns: string[],
	r2Paths: string[],
	r2Patterns: string[],
): string {
	if (level === "R3") {
		let r = "Operación restringida (R3)";
		if (r3Paths.length > 0) r += ` — path: ${r3Paths[0]}`;
		if (r3Patterns.length > 0) r += ` — patrón: ${r3Patterns[0]}`;
		return r;
	}
	if (level === "R2" && !ambiguous) {
		let r = "Contenido fiscal material";
		if (r2Paths.length > 0) r += ` — path: ${r2Paths[0]}`;
		if (r2Patterns.length > 0) r += ` — patrón: ${r2Patterns[0]}`;
		return r;
	}
	if (ambiguous && failClosed) {
		return "Clasificación ambigua — modo fail-closed";
	}
	return "Sin riesgo fiscal detectado";
}

/**
 * Classifier — deterministic, no model calls.
 * Precedence: R3 > R2 > fail-closed R2 > R1.
 */
export function classifyDiff(
	diff: DiffEntry,
	config?: ClassifierConfig,
): ClassifierResult {
	const cfg = config ?? DEFAULT_CLASSIFIER_CONFIG;

	// === R3 check (highest precedence) ===
	const r3MatchedPaths = [
		...matchFiles(diff.modifiedFiles, cfg.r3Paths, [], ""),
		...matchFiles(diff.renamedFiles, cfg.r3Paths, [], "[RENAMED]"),
		...matchFiles(diff.deletedFiles, cfg.r3Paths, [], "[DELETED]"),
	];
	const r3MatchedPatterns = matchContentPatterns(
		diff.addedLines,
		cfg.r3ContentPatterns,
	);
	const r3Found = r3MatchedPaths.length > 0 || r3MatchedPatterns.length > 0;

	// === R2 check ===
	const r2MatchedPaths = [
		...matchFiles(diff.modifiedFiles, cfg.paths, cfg.excludedPaths, ""),
		...matchFiles(diff.renamedFiles, cfg.paths, cfg.excludedPaths, "[RENAMED]"),
		...matchFiles(diff.deletedFiles, cfg.paths, cfg.excludedPaths, "[DELETED]"),
	];
	const r2MatchedPatterns = matchContentPatterns(
		diff.addedLines,
		cfg.contentPatterns,
	);
	const r2Found = r2MatchedPaths.length > 0 || r2MatchedPatterns.length > 0;

	// === Determine level with precedence ===
	const { level, ambiguous, failClosed } = determineLevel(
		r3Found,
		r2Found,
		diff,
		cfg.fallbackLevel,
	);

	// Return ALL matches, tagged by level
	const allPaths =
		level === "R3" ? [...r3MatchedPaths, ...r2MatchedPaths] : r2MatchedPaths;
	const allPatterns =
		level === "R3"
			? [...new Set([...r3MatchedPatterns, ...r2MatchedPatterns])]
			: r2MatchedPatterns;

	const reason = buildReason(
		level,
		ambiguous,
		failClosed,
		r3MatchedPaths,
		r3MatchedPatterns,
		allPaths,
		allPatterns,
	);

	return {
		level,
		matchedPaths: allPaths,
		matchedContentPatterns: allPatterns,
		blocked: level === "R2" || level === "R3",
		ambiguous,
		failClosed,
		evaluatedAt: new Date().toISOString(),
		reason,
		diffStats: {
			addedLines: diff.addedLines.length,
			modifiedFiles: diff.modifiedFiles.length,
			renamedFiles: [...diff.renamedFiles],
			deletedFiles: [...diff.deletedFiles],
		},
	};
}

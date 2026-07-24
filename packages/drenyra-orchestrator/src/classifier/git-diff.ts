/**
 * Git Diff Parser — extracts DiffEntry from git diff --staged.
 *
 * SDD-009C. Deterministic, no model calls. Uses only git CLI.
 * Produces structured DiffEntry for the classifier.
 *
 * Security: reads ONLY the staged index via `git diff --staged`.
 * Never reads working tree or untracked files.
 */

import { execSync } from "node:child_process";
import type { DiffEntry } from "./classifier";

// ============================================================================
// Types
// ============================================================================

export interface GitDiffError {
	code: string;
	message: string;
	raw?: string;
}

export interface GitDiffWarning {
	field: string;
	message: string;
}

export interface ParsedGitDiff {
	entry: DiffEntry;
	errors: GitDiffError[];
	warnings: GitDiffWarning[];
	binaryFiles: string[];
	/** true if any error forced fail-closed fallback */
	hadCriticalError: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DIFF_NAME_STATUS_ARGS = [
	"diff",
	"--staged",
	"--name-status",
	"-z",
	"--diff-filter=AMDR",
];

const DIFF_UNIFIED_ARGS = [
	"diff",
	"--staged",
	"-U0",
];

// ============================================================================
// Git helpers
// ============================================================================

function git(args: string[], cwd?: string): string {
	const opts: { cwd?: string; encoding: string; stdio: ["pipe", "pipe", "pipe"] } = {
		encoding: "utf-8",
		stdio: ["pipe", "pipe", "pipe"],
	};
	if (cwd) opts.cwd = cwd;
	return execSync(`git ${args.join(" ")}`, opts as never) as string;
}

// ============================================================================
// Status character → meaning
// ============================================================================

type GitStatus = "A" | "M" | "D" | "R" | "C" | "T" | "U" | "X";

function parseStatusChar(ch: string): GitStatus | null {
	switch (ch) {
		case "A": return "A";
		case "M": return "M";
		case "D": return "D";
		case "R": return "R";
		case "C": return "C"; // treated as added
		case "T": return "M"; // type change = modified
		default: return null;
	}
}

// ============================================================================
// Parse --name-status -z output
// ============================================================================

function parseNameStatusZ(
	raw: string,
): {
	modifiedFiles: string[];
	renamedFiles: string[];
	deletedFiles: string[];
	binaryFiles: string[];
	warnings: GitDiffWarning[];
} {
	const modifiedFiles: string[] = [];
	const renamedFiles: string[] = [];
	const deletedFiles: string[] = [];
	const binaryFiles: string[] = [];
	const warnings: GitDiffWarning[] = [];

	// -z output: fields separated by NUL, records separated by NUL
	// Each record: <status><NUL><path1><NUL>[<path2><NUL>] for R/C
	const parts = raw.split("\0");

	let i = 0;
	while (i < parts.length) {
		const statusField = parts[i];
		if (!statusField || statusField.trim() === "") {
			i++;
			continue;
		}

		const statusChar = statusField[0];
		if (!statusChar) {
			warnings.push({
				field: "status",
				message: "Empty status character",
			});
			i++;
			continue;
		}

		const status = parseStatusChar(statusChar);
		if (status === null) {
			warnings.push({
				field: "status",
				message: `Unknown git status character: '${statusChar}'`,
			});
			i++;
			continue;
		}

		if (status === "R" || statusChar === "C") {
			// Renamed/copied: <status><NUL><src><NUL><dst><NUL>
			const src = parts[i + 1];
			const dst = parts[i + 2];
			if (src !== undefined && dst !== undefined) {
				renamedFiles.push(src);
				modifiedFiles.push(dst);
			} else {
				warnings.push({
					field: "rename",
					message: `Incomplete rename entry: '${statusField}'`,
				});
			}
			i += 3;
		} else if (status === "D") {
			const path = parts[i + 1];
			if (path !== undefined) {
				deletedFiles.push(path);
			}
			i += 2;
		} else {
			// A or M
			const path = parts[i + 1];
			if (path !== undefined) {
				// Detect binary by checking for common binary extensions
				if (isLikelyBinary(path)) {
					binaryFiles.push(path);
				} else {
					modifiedFiles.push(path);
				}
			}
			i += 2;
		}
	}

	return { modifiedFiles, renamedFiles, deletedFiles, binaryFiles, warnings };
}

// ============================================================================
// Binary file detection by extension
// ============================================================================

const BINARY_EXTENSIONS = new Set([
	".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".avif",
	".pdf", ".doc", ".docx", ".xls", ".xlsx",
	".zip", ".tar", ".gz", ".bz2", ".7z", ".rar",
	".exe", ".dll", ".so", ".dylib", ".wasm",
	".mp3", ".mp4", ".avi", ".mov", ".wav", ".flac",
	".woff", ".woff2", ".ttf", ".eot",
	".pyc", ".class", ".o", ".a", ".lib",
	".db", ".sqlite", ".mdb",
]);

function isLikelyBinary(path: string): boolean {
	const lower = path.toLowerCase();
	for (const ext of BINARY_EXTENSIONS) {
		if (lower.endsWith(ext)) return true;
	}
	return false;
}

// ============================================================================
// Parse unified diff for added lines
// ============================================================================

function parseAddedLines(raw: string): string[] {
	const lines: string[] = [];
	for (const line of raw.split("\n")) {
		// Only capture added lines (prefixed with +, but not +++ (file header))
		if (line.startsWith("+") && !line.startsWith("+++")) {
			// Strip the leading +
			lines.push(line.slice(1));
		}
	}
	return lines;
}

// ============================================================================
// Check for binary files in real diff output
// ============================================================================

function findBinaryFilesInDiff(raw: string): string[] {
	const binaries: string[] = [];
	const binaryRegex = /^Binary\s+files\s+([ab]\/.+?)\s+and\s+([ab]\/.+?)\s+differ$/gmi;
	for (const line of raw.split("\n")) {
		const match = binaryRegex.exec(line);
		if (match?.[2]) {
			// Extract path from b/<path>
			const bPath = match[2].replace(/^b\//, "");
			if (bPath) binaries.push(bPath);
		}
	}
	return binaries;
}

// ============================================================================
// Main parser
// ============================================================================

/**
 * Parse `git diff --staged` into a DiffEntry.
 *
 * @param cwd - optional working directory (defaults to process.cwd())
 * @returns ParsedGitDiff with the DiffEntry, errors, warnings
 */
export function parseStagedDiff(cwd?: string): ParsedGitDiff {
	const errors: GitDiffError[] = [];
	const warnings: GitDiffWarning[] = [];

	try {
		// --- Step 1: Check if there's anything staged ---
		let hasStaged = false;
		try {
			const stagedCount = git(["diff", "--staged", "--name-only"], cwd).trim();
			hasStaged = stagedCount.length > 0;
		} catch {
			// No staged changes
			hasStaged = false;
		}

		if (!hasStaged) {
			return {
				entry: {
					addedLines: [],
					modifiedFiles: [],
					renamedFiles: [],
					deletedFiles: [],
				},
				errors: [],
				warnings: [],
				binaryFiles: [],
				hadCriticalError: false,
			};
		}

		// --- Step 2: Get file statuses via --name-status -z ---
		let nameStatusRaw: string;
		try {
			nameStatusRaw = git(DIFF_NAME_STATUS_ARGS, cwd);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			errors.push({
				code: "GIT_NAME_STATUS_FAILED",
				message: `Failed to get git name-status: ${msg}`,
				raw: msg,
			});
			return {
				entry: { addedLines: [], modifiedFiles: [], renamedFiles: [], deletedFiles: [] },
				errors,
				warnings,
				binaryFiles: [],
				hadCriticalError: true,
			};
		}

		// --- Step 3: Parse name-status ---
		let modifiedFiles: string[];
		let renamedFiles: string[];
		let deletedFiles: string[];
		let binaryFilesFromExtensions: string[];

		try {
			const parsed = parseNameStatusZ(nameStatusRaw);
			modifiedFiles = parsed.modifiedFiles;
			renamedFiles = parsed.renamedFiles;
			deletedFiles = parsed.deletedFiles;
			binaryFilesFromExtensions = parsed.binaryFiles;
			warnings.push(...parsed.warnings);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			errors.push({
				code: "NAME_STATUS_PARSE_FAILED",
				message: `Failed to parse name-status output: ${msg}`,
				raw: nameStatusRaw,
			});
			return {
				entry: { addedLines: [], modifiedFiles: [], renamedFiles: [], deletedFiles: [] },
				errors,
				warnings,
				binaryFiles: [],
				hadCriticalError: true,
			};
		}

		// --- Step 4: Get unified diff for content ---
		let diffRaw: string;
		try {
			diffRaw = git(DIFF_UNIFIED_ARGS, cwd);
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			errors.push({
				code: "GIT_DIFF_FAILED",
				message: `Failed to get git diff: ${msg}`,
				raw: msg,
			});
			// Non-critical — we can still classify with just the file list
			return {
				entry: {
					addedLines: [],
					modifiedFiles,
					renamedFiles,
					deletedFiles,
				},
				errors,
				warnings,
				binaryFiles: binaryFilesFromExtensions,
				hadCriticalError: false,
			};
		}

		// --- Step 5: Detect binary files in diff output ---
		const binaryFilesFromDiff = findBinaryFilesInDiff(diffRaw);
		const allBinaryFiles = [...new Set([...binaryFilesFromExtensions, ...binaryFilesFromDiff])];

		// --- Step 6: Parse added lines ---
		const addedLines = parseAddedLines(diffRaw);

		// --- Step 7: Filter binary files out of modifiedFiles ---
		const binarySet = new Set(allBinaryFiles);
		const textModifiedFiles = modifiedFiles.filter((f) => !binarySet.has(f));

		return {
			entry: {
				addedLines,
				modifiedFiles: textModifiedFiles,
				renamedFiles,
				deletedFiles,
			},
			errors,
			warnings,
			binaryFiles: allBinaryFiles,
			hadCriticalError: false,
		};
	} catch (err) {
		// Top-level catch — critical error
		const msg = err instanceof Error ? err.message : String(err);
		errors.push({
			code: "PARSE_STAGED_DIFF_CRITICAL",
			message: `Critical error parsing staged diff: ${msg}`,
			raw: msg,
		});
		return {
			entry: { addedLines: [], modifiedFiles: [], renamedFiles: [], deletedFiles: [] },
			errors,
			warnings,
			binaryFiles: [],
			hadCriticalError: true,
		};
	}
}

/**
 * Parse git diff --staged output from raw text (for testing).
 * Useful for testing the parser logic without running git.
 */
export function parseDiffFromText(rawNameStatus: string, rawDiff: string): ParsedGitDiff {
	const errors: GitDiffError[] = [];
	const warnings: GitDiffWarning[] = [];

	try {
		const parsed = parseNameStatusZ(rawNameStatus);
		const binaryFilesFromDiff = findBinaryFilesInDiff(rawDiff);
		const allBinaryFiles = [...new Set([...parsed.binaryFiles, ...binaryFilesFromDiff])];
		const addedLines = parseAddedLines(rawDiff);

		const binarySet = new Set(allBinaryFiles);
		const textModifiedFiles = parsed.modifiedFiles.filter((f) => !binarySet.has(f));

		return {
			entry: {
				addedLines,
				modifiedFiles: textModifiedFiles,
				renamedFiles: parsed.renamedFiles,
				deletedFiles: parsed.deletedFiles,
			},
			errors,
			warnings,
			binaryFiles: allBinaryFiles,
			hadCriticalError: false,
		};
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		errors.push({
			code: "PARSE_FROM_TEXT_FAILED",
			message: `Failed to parse diff from text: ${msg}`,
		});
		return {
			entry: { addedLines: [], modifiedFiles: [], renamedFiles: [], deletedFiles: [] },
			errors,
			warnings,
			binaryFiles: [],
			hadCriticalError: true,
		};
	}
}

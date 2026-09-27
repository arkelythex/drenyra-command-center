#!/usr/bin/env bun
/// <reference types="bun" />
/// <reference types="node" />

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const FAILURE_EXIT_CODE = 1;
const INVALID_USAGE_EXIT_CODE = 2;
const ZERO_LENGTH = 0;
export const DEFAULT_MAX_LINES = 2500n;

export interface MaxLinesOptions {
	help: boolean;
	maxLines: bigint;
}

export interface MaxLinesViolation {
	filePath: string;
	lineCount: bigint;
}

export interface MaxLinesScanResult {
	filesScanned: bigint;
	violations: MaxLinesViolation[];
}

const SOURCE_EXTENSIONS = new Set([
	".c",
	".cc",
	".cpp",
	".cjs",
	".cs",
	".css",
	".cts",
	".go",
	".h",
	".hpp",
	".html",
	".java",
	".js",
	".jsx",
	".kt",
	".kts",
	".mjs",
	".mts",
	".php",
	".py",
	".rb",
	".rs",
	".scss",
	".sh",
	".sql",
	".svelte",
	".swift",
	".ts",
	".tsx",
	".vue",
]);
const EXCLUDED_DIRECTORY_NAMES = new Set([
	".cache",
	".codegraph",
	".git",
	".next",
	".nuxt",
	".output",
	".parcel-cache",
	".incident",
	".svelte-kit",
	".turbo",
	".venv",
	".vercel",
	"__generated__",
	"archives",
	"archived",
	"build",
	"cache",
	"coverage",
	"dist",
	"drizzle",
	"generated",
	"migrations",
	"node_modules",
	"out",
	"target",
	"tmp",
	"vendor",
	"venv",
	"worktrees",
]);
const EXCLUDED_FILE_NAMES = new Set([
	"bun.lock",
	"bun.lockb",
	"composer.lock",
	"package-lock.json",
	"pnpm-lock.yaml",
	"yarn.lock",
]);
const ARCHIVE_EXTENSIONS = [
	".7z",
	".br",
	".bz2",
	".gz",
	".rar",
	".tar",
	".tgz",
	".xz",
	".zip",
];

export function parseArguments(args: readonly string[]): MaxLinesOptions {
	let maxLines = DEFAULT_MAX_LINES;
	let help = false;
	let expectsMax = false;
	for (const argument of args) {
		if (expectsMax) {
			maxLines = parseMaxLines(argument);
			expectsMax = false;
			continue;
		}
		if (argument === "--help" || argument === "-h") {
			help = true;
			continue;
		}
		if (argument === "--max") {
			expectsMax = true;
			continue;
		}
		if (argument.startsWith("--max=")) {
			maxLines = parseMaxLines(argument.slice("--max=".length));
			continue;
		}
		throw new Error(`unknown argument: ${argument}`);
	}
	if (expectsMax) throw new Error("--max requires a positive integer");
	return { maxLines, help };
}

function parseMaxLines(value: string): bigint {
	if (!/^\d+$/.test(value)) throw new Error(`invalid --max value: ${value}`);
	const parsed = BigInt(value);
	if (parsed <= 0n) throw new Error(`invalid --max value: ${value}`);
	return parsed;
}

export function isSourceFile(relativePath: string): boolean {
	const normalizedPath = relativePath.replaceAll("\\", "/");
	const segments = normalizedPath.split("/");
	const fileName = segments.pop() ?? "";
	if (segments.some((segment) => EXCLUDED_DIRECTORY_NAMES.has(segment)))
		return false;
	if (
		EXCLUDED_FILE_NAMES.has(fileName) ||
		ARCHIVE_EXTENSIONS.some((extension) => fileName.endsWith(extension))
	)
		return false;
	const lowerFileName = fileName.toLowerCase();
	if (
		lowerFileName.includes(".generated.") ||
		lowerFileName.includes(".gen.") ||
		lowerFileName.endsWith(".min.js") ||
		lowerFileName.endsWith(".min.css")
	)
		return false;
	return SOURCE_EXTENSIONS.has(path.extname(lowerFileName));
}

export function countLines(contents: string): bigint {
	if (contents.length === ZERO_LENGTH) return 0n;
	let newlineCount = 0n;
	for (const character of contents) {
		if (character === "\n") newlineCount += 1n;
	}
	return newlineCount + (contents.endsWith("\n") ? 0n : 1n);
}

export async function scanRepository(
	rootDirectory: string,
	maxLines: bigint,
): Promise<MaxLinesScanResult> {
	const violations: MaxLinesViolation[] = [];
	let filesScanned = 0n;

	async function inspectFile(relativePath: string): Promise<void> {
		if (!isSourceFile(relativePath)) return;
		const contents = await readFile(
			path.join(rootDirectory, relativePath),
			"utf8",
		);
		const lineCount = countLines(contents);
		filesScanned += 1n;
		if (lineCount > maxLines) {
			violations.push({
				filePath: relativePath.replaceAll(path.sep, "/"),
				lineCount,
			});
		}
	}

	async function visit(relativeDirectory: string): Promise<void> {
		const entries = await readdir(path.join(rootDirectory, relativeDirectory), {
			withFileTypes: true,
		});
		entries.sort((left, right) => left.name.localeCompare(right.name, "en"));
		for (const entry of entries) {
			const relativePath = path.join(relativeDirectory, entry.name);
			if (entry.isDirectory()) {
				if (!EXCLUDED_DIRECTORY_NAMES.has(entry.name))
					await visit(relativePath);
			} else if (entry.isFile()) {
				await inspectFile(relativePath);
			}
		}
	}
	await visit("");
	violations.sort((left, right) =>
		left.filePath.localeCompare(right.filePath, "en"),
	);
	return { filesScanned, violations };
}

function writeStdout(message: string): void {
	process.stdout.write(`${message}\n`);
}

function writeStderr(message: string): void {
	process.stderr.write(`${message}\n`);
}

function printUsage(): void {
	writeStdout(
		`Usage: bun scripts/quality/check-max-lines.ts [--max <positive integer>]\n\nChecks non-generated source files and fails when a file exceeds the limit.\nDefault limit: ${DEFAULT_MAX_LINES} lines. Generated, dependency, build, cache, coverage, archive, lock, migration, and minified outputs are excluded.`,
	);
}

async function main(): Promise<void> {
	let options: ReturnType<typeof parseArguments>;
	try {
		const [, , ...argumentsAfterEntryPoint] = Bun.argv;
		options = parseArguments(argumentsAfterEntryPoint);
	} catch (error: unknown) {
		writeStderr(
			`quality:max-lines: ${error instanceof Error ? error.message : String(error)}`,
		);
		printUsage();
		process.exitCode = INVALID_USAGE_EXIT_CODE;
		return;
	}
	if (options.help) {
		printUsage();
		return;
	}
	try {
		const result = await scanRepository(process.cwd(), options.maxLines);
		if (result.violations.length === ZERO_LENGTH) {
			writeStdout(
				`quality:max-lines: passed (${result.filesScanned} source files, max ${options.maxLines} lines; generated/artifact outputs excluded)`,
			);
			return;
		}
		writeStderr(
			`quality:max-lines: ${result.violations.length} file(s) exceed ${options.maxLines} lines:`,
		);
		for (const violation of result.violations) {
			writeStderr(`- ${violation.filePath}: ${violation.lineCount} lines`);
		}
		writeStderr(
			"Split the listed files or rerun with an intentional --max override.",
		);
		process.exitCode = FAILURE_EXIT_CODE;
	} catch (error: unknown) {
		writeStderr(
			`quality:max-lines: scan failed: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exitCode = INVALID_USAGE_EXIT_CODE;
	}
}

if (import.meta.main) await main();

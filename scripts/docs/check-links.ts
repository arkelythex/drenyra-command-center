#!/usr/bin/env bun
/// <reference types="node" />

/**
 * docs:check-links
 * Verifica que todos los enlaces internos .md apunten a archivos existentes.
 *
 * Uso: bun run docs:check-links
 *      bun run docs:check-links --full   (escanear todos los .md del repo)
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";

interface LinkIssue {
	file: string;
	line: number;
	link: string;
	reason: string;
}

const ROOT = process.cwd();
const isFull = process.argv.includes("--full");

const CORE_FILES = [
	"README.md",
	"CODEX-MAP.md",
	"AGENTS.md",
	"docs/00-INDEX.md",
	"docs/01-foundation/README.md",
	"docs/01-foundation/product-philosophy.md",
	"docs/01-foundation/feos-program.md",
	"docs/01-tutorials/README.md",
	"docs/10-development/README.md",
	"docs/11-adr/README.md",
	"docs/12-security/README.md",
	"docs/13-operations/README.md",
	"docs/14-design/README.md",
	"apps/web/MAP.md",
	"apps/cli/MAP.md",
];

const MARKDOWN_LINK_PATTERN = /(?<!!).?\[([^\]]+)\]\(([^)]+)\)/g;

function main(): void {
	const issues: LinkIssue[] = [];
	const filesToCheck = isFull ? findAllMdFiles(ROOT) : CORE_FILES;

	for (const file of filesToCheck) {
		const absolutePath = resolve(ROOT, file);
		if (!existsSync(absolutePath)) {
			if (!isFull) {
				issues.push({
					file,
					line: 1,
					link: file,
					reason: "Configured markdown file is missing",
				});
			}
			continue;
		}

		issues.push(...checkFile(file, absolutePath));
	}

	if (issues.length > 0) {
		console.error(
			`[docs:check-links] ${issues.length} broken internal links found:`,
		);
		for (const issue of issues) {
			console.error(
				`  ${issue.file}:${issue.line} → ${issue.link} — ${issue.reason}`,
			);
		}
		process.exit(1);
	}

	console.log(
		`[docs:check-links] ✅ ${filesToCheck.length} files checked, all internal links valid`,
	);
}

function findAllMdFiles(dir: string): string[] {
	const files: string[] = [];
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (
			entry.name === "node_modules" ||
			entry.name === ".git" ||
			entry.name === ".engram" ||
			entry.name.startsWith(".pi")
		)
			continue;
		if (entry.isDirectory()) {
			files.push(...findAllMdFiles(full));
		} else if (entry.name.endsWith(".md")) {
			files.push(relativePath(full));
		}
	}
	return files;
}

function relativePath(absolute: string): string {
	const rel = normalize(absolute);
	return rel.startsWith(ROOT) ? rel.slice(ROOT.length + 1) : rel;
}

function checkFile(relativeFile: string, absolutePath: string): LinkIssue[] {
	const issues: LinkIssue[] = [];
	const content = readFileSync(absolutePath, "utf-8");
	const lines = content.split("\n");

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index];
		for (const link of extractLinks(line)) {
			if (shouldSkipLink(link)) continue;

			const targetPath = stripAnchor(link);
			if (!targetPath) continue;

			const resolvedPath = normalize(
				resolve(dirname(absolutePath), targetPath),
			);
			if (!resolvedPath.startsWith(ROOT)) continue;

			if (!existsAsFileOrDirectory(resolvedPath)) {
				issues.push({
					file: relativeFile,
					line: index + 1,
					link,
					reason: "Target does not exist",
				});
			}
		}
	}

	return issues;
}

function extractLinks(line: string): string[] {
	const links: string[] = [];
	MARKDOWN_LINK_PATTERN.lastIndex = 0;

	let match = MARKDOWN_LINK_PATTERN.exec(line);
	while (match !== null) {
		const [, , rawLink] = match;
		if (rawLink) links.push(rawLink.trim());
		match = MARKDOWN_LINK_PATTERN.exec(line);
	}

	return links;
}

function shouldSkipLink(link: string): boolean {
	return (
		link.startsWith("http://") ||
		link.startsWith("https://") ||
		link.startsWith("mailto:") ||
		link.startsWith("#")
	);
}

function stripAnchor(link: string): string {
	const [path] = link.split("#", 1);
	return decodeURIComponent(path.trim());
}

function existsAsFileOrDirectory(path: string): boolean {
	if (existsSync(path)) return true;
	if (extname(path) !== "") return false;

	return existsSync(`${path}.md`) || existsSync(join(path, "README.md"));
}

main();

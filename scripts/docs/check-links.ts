#!/usr/bin/env bun
/// <reference types="node" />

import { existsSync, readFileSync } from "node:fs";
import { dirname, extname, join, normalize, resolve } from "node:path";

interface LinkIssue {
	file: string;
	line: number;
	link: string;
	reason: string;
}

const ROOT = process.cwd();
const FILES_TO_CHECK = [
	"AGENTS.md",
	"CODEX-MAP.md",
	"apps/web/MAP.md",
	"apps/cli/MAP.md",
	"docs/products/drenyra-product-philosophy.md",
] as const;

const MARKDOWN_LINK_PATTERN = /(?<!!).?\[([^\]]+)\]\(([^)]+)\)/g;

function main(): void {
	const issues: LinkIssue[] = [];

	for (const file of FILES_TO_CHECK) {
		const absolutePath = resolve(ROOT, file);
		if (!existsSync(absolutePath)) {
			issues.push({
				file,
				line: 1,
				link: file,
				reason: "Configured markdown file is missing",
			});
			continue;
		}

		issues.push(...checkFile(file, absolutePath));
	}

	if (issues.length > 0) {
		console.error("[docs:check-links] Broken internal links found:");
		for (const issue of issues) {
			console.error(
				`${issue.file}:${issue.line} ${issue.link} - ${issue.reason}`,
			);
		}
		process.exit(1);
	}

	console.log("[docs:check-links] Internal links passed");
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
			if (!resolvedPath.startsWith(ROOT)) {
				issues.push({
					file: relativeFile,
					line: index + 1,
					link,
					reason: "Link resolves outside the repository",
				});
				continue;
			}

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

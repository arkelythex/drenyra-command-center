/**
 * Diff utility types and functions extracted from RightPanel.
 *
 * Pure computation — no React dependencies.
 */

import { diffLines, structuredPatch } from "diff";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DiffLineType = "added" | "removed" | "context" | "hunk";

export interface RenderedDiffLine {
	type: DiffLineType;
	oldLine: number | null;
	newLine: number | null;
	content: string;
}

export interface DiffStats {
	added: number;
	removed: number;
}

export interface SplitPair {
	oldLine: { type: "removed" | "context"; content: string } | null;
	newLine: { type: "added" | "context"; content: string } | null;
}

// ─── Diff computation ─────────────────────────────────────────────────────────

export function computeFileDiff(
	oldText: string,
	newText: string,
): { lines: RenderedDiffLine[]; stats: DiffStats } {
	const patch = structuredPatch("file", "file", oldText, newText);
	const lines: RenderedDiffLine[] = [];
	let added = 0;
	let removed = 0;

	for (const hunk of patch.hunks) {
		const header = `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`;
		lines.push({
			type: "hunk",
			oldLine: null,
			newLine: null,
			content: header,
		});

		let oldLine = hunk.oldStart;
		let newLine = hunk.newStart;

		for (const line of hunk.lines) {
			if (line.startsWith("+")) {
				lines.push({
					type: "added",
					oldLine: null,
					newLine: newLine++,
					content: line.slice(1),
				});
				added++;
			} else if (line.startsWith("-")) {
				lines.push({
					type: "removed",
					oldLine: oldLine++,
					newLine: null,
					content: line.slice(1),
				});
				removed++;
			} else if (line.startsWith(" ")) {
				lines.push({
					type: "context",
					oldLine: oldLine++,
					newLine: newLine++,
					content: line.slice(1),
				});
			}
		}
	}

	return { lines, stats: { added, removed } };
}

export function computeSplitPairs(
	oldText: string,
	newText: string,
): SplitPair[] {
	const changes = diffLines(oldText, newText);
	const pairs: SplitPair[] = [];
	let i = 0;

	while (i < changes.length) {
		const change = changes[i];
		if (!change.added && !change.removed) {
			const value = change.value.endsWith("\n")
				? change.value.slice(0, -1)
				: change.value;
			if (value) {
				for (const content of value.split("\n")) {
					pairs.push({
						oldLine: { type: "context", content },
						newLine: { type: "context", content },
					});
				}
			}
			i++;
		} else if (change.removed) {
			const removedLines = change.value.endsWith("\n")
				? change.value.slice(0, -1).split("\n")
				: change.value.split("\n");
			if (i + 1 < changes.length && changes[i + 1].added) {
				const addedLines = changes[i + 1].value.endsWith("\n")
					? changes[i + 1].value.slice(0, -1).split("\n")
					: changes[i + 1].value.split("\n");
				const maxLen = Math.max(removedLines.length, addedLines.length);
				for (let j = 0; j < maxLen; j++) {
					pairs.push({
						oldLine:
							j < removedLines.length
								? { type: "removed" as const, content: removedLines[j] }
								: null,
						newLine:
							j < addedLines.length
								? { type: "added" as const, content: addedLines[j] }
								: null,
					});
				}
				i += 2;
			} else {
				for (const content of removedLines) {
					if (content === "" && removedLines.length === 1) continue;
					pairs.push({ oldLine: { type: "removed", content }, newLine: null });
				}
				i++;
			}
		} else if (change.added) {
			const value = change.value.endsWith("\n")
				? change.value.slice(0, -1)
				: change.value;
			const addedLines = value ? value.split("\n") : [];
			for (const content of addedLines) {
				pairs.push({ oldLine: null, newLine: { type: "added", content } });
			}
			i++;
		}
	}

	return pairs;
}

// ─── JSON syntax highlighting tokens ──────────────────────────────────────────

export const JSON_TOKEN_RE =
	/("(?:[^"\\]|\\.)*")\s*:|("(?:[^"\\]|\\.)*")|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\b(?:true|false|null)\b)|([{}[\](),:])/g;

export function renderJsonTokens(text: string) {
	const elements: React.ReactNode[] = [];
	let lastIndex = 0;
	let m: RegExpExecArray | null;

	const re = new RegExp(JSON_TOKEN_RE.source, "g");
	while ((m = re.exec(text)) !== null) {
		const [full] = m;
		const [, key, str, num] = m;

		if (m.index > lastIndex) {
			elements.push(
				<span key={`t${lastIndex}`}>{text.slice(lastIndex, m.index)}</span>,
			);
		}

		if (key) {
			elements.push(
				<span key={`k${m.index}`} className="text-[var(--color-accent)]">
					{key}
				</span>,
			);
		} else if (str) {
			elements.push(
				<span key={`s${m.index}`} className="text-[var(--color-success)]">
					{str}
				</span>,
			);
		} else if (num) {
			elements.push(
				<span key={`n${m.index}`} className="text-amber-400">
					{num}
				</span>,
			);
		} else {
			elements.push(
				<span key={`o${m.index}`} className="text-[var(--color-primary)]">
					{full}
				</span>,
			);
		}

		lastIndex = re.lastIndex;
	}

	if (lastIndex < text.length) {
		elements.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
	}

	return elements;
}

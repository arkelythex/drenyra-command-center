export interface DiffLine {
	type: "add" | "remove" | "context";
	content: string;
	oldLineNumber?: number;
	newLineNumber?: number;
}

export interface DiffViewerV3Props {
	lines: DiffLine[];
	title?: string;
	className?: string;
}

/**
 * Inline diff viewer — Cursor 3 inspired editorial diff surface.
 */
export function DiffViewerV3({ lines, title, className }: DiffViewerV3Props) {
	return (
		<section
			className={className}
			aria-label={title ?? "Diff viewer"}
			data-component="diff-viewer-v3"
		>
			{title ? (
				<header className="mb-2 border-b border-[var(--border-subtle)] pb-2">
					<h3 className="text-sm font-medium text-[var(--text-primary)]">
						{title}
					</h3>
				</header>
			) : null}
			<pre className="max-h-96 overflow-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-1)] font-mono text-xs leading-relaxed">
				{lines.map((line) => (
					<div
						key={`${line.type}:${line.oldLineNumber ?? "o"}:${line.newLineNumber ?? "n"}:${line.content}`}
						className={
							line.type === "add"
								? "bg-[color-mix(in_oklch,var(--color-success)_12%,transparent)] text-[var(--text-primary)]"
								: line.type === "remove"
									? "bg-[color-mix(in_oklch,var(--color-danger)_12%,transparent)] text-[var(--text-secondary)] line-through"
									: "text-[var(--text-secondary)]"
						}
					>
						<span className="inline-block w-10 select-none border-r border-[var(--border-subtle)] pr-2 text-right text-[var(--text-muted)]">
							{line.newLineNumber ?? line.oldLineNumber ?? ""}
						</span>
						<span className="pl-2">{line.content}</span>
					</div>
				))}
			</pre>
		</section>
	);
}

/** Parse unified diff hunks into DiffLine rows (minimal parser for SIRE pilot). */
export function parseUnifiedDiff(text: string): DiffLine[] {
	return text.split("\n").map((content) => {
		if (content.startsWith("+") && !content.startsWith("+++")) {
			return { type: "add" as const, content: content.slice(1) };
		}
		if (content.startsWith("-") && !content.startsWith("---")) {
			return { type: "remove" as const, content: content.slice(1) };
		}
		return { type: "context" as const, content };
	});
}

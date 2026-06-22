import type { EvidenceItem } from "../api/drenyra-command-center.api";

export function EvidenceCard({ evidence }: { evidence: EvidenceItem }) {
	return (
		<article className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3">
			<p className="text-xs font-bold">{evidence.title}</p>
			<p className="mt-1 text-2xs text-[var(--text-tertiary)]">
				{evidence.source} · {evidence.type}
			</p>
			<p className="mt-2 text-xs text-[var(--text-secondary)]">
				{evidence.summary}
			</p>
			<p className="mt-2 truncate font-mono text-2xs text-[var(--text-tertiary)]">
				sha256:{evidence.contentHash}
			</p>
		</article>
	);
}

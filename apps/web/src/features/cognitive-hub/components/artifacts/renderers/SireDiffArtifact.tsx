import type { HubArtifact } from "@arkelythex/shared/artifacts";
import { Link } from "@tanstack/react-router";
import { ArrowRightLeft } from "lucide-react";

interface SireDiffArtifactProps {
	artifact: HubArtifact;
}

/**
 * Cognitive Hub bridge — routes to the real SIRE Diff page instead of mock data.
 */
export function SireDiffArtifact({ artifact }: SireDiffArtifactProps) {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--surface-1)] p-8 text-center">
			<ArrowRightLeft size={28} className="text-[var(--color-info)]" />
			<div className="space-y-2">
				<h3 className="text-sm font-bold text-[var(--text-primary)]">
					{artifact.title ?? "SIRE three-way diff"}
				</h3>
				<p className="max-w-md text-xs text-[var(--text-secondary)]">
					This hub artifact now opens the live SIRE Diff workspace backed by{" "}
					<code className="text-2xs">POST /api/sire/diff</code>.
				</p>
			</div>
			<Link
				to="/cumplimiento/sire-diff"
				className="rounded-lg bg-[var(--color-info)] px-4 py-2 text-2xs font-semibold text-white"
			>
				Open SIRE Diff
			</Link>
		</div>
	);
}

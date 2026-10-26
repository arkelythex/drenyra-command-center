import type { EvidenceItem } from "@drenyra/mission-domain";
import { CircleCheck, Lock } from "lucide-react";

interface MissionEvidenceBundleProps {
	evidence: EvidenceItem[];
	version: number;
	evidenceHash: string;
}

/** The evidence the agent attached to its proposal; fixed once the proposal version is issued. */
export function MissionEvidenceBundle({
	evidence,
	version,
}: MissionEvidenceBundleProps) {
	if (evidence.length === 0) return null;

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2 text-sm">
				<h4 className="font-medium">Evidencia</h4>
				<span className="font-mono text-xs text-muted-foreground">
					v{version}
				</span>
				<span className="flex items-center gap-1 text-xs text-muted-foreground">
					<Lock aria-hidden="true" className="size-3" />
					inmutable
				</span>
			</div>
			<ul
				aria-label="Evidencia adjunta"
				className="divide-y divide-border rounded-lg border border-border"
			>
				{evidence.map((item) => (
					<li
						key={item.id}
						className="flex items-center gap-2 px-3 py-2 text-sm"
					>
						<CircleCheck
							aria-hidden="true"
							className="size-4 shrink-0 text-success"
						/>
						<span className="min-w-0 flex-1 truncate">{item.label}</span>
						<span className="shrink-0 text-xs text-muted-foreground">
							{item.type}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

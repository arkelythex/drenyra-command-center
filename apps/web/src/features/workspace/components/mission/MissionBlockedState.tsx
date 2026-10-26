import type { MissionBlocker } from "@drenyra/mission-domain";
import { CircleAlert, CircleX, RotateCcw } from "lucide-react";

interface MissionBlockedStateProps {
	blockers: MissionBlocker[];
	onRetry: () => void;
}

interface SeverityStyle {
	label: string;
	tone: string;
	critical: boolean;
}

const WARNING: SeverityStyle = {
	label: "Advertencia",
	tone: "text-warning",
	critical: false,
};

const SEVERITY: Record<string, SeverityStyle> = {
	WARNING,
	ERROR: { label: "Error", tone: "text-destructive", critical: true },
	CRITICAL: { label: "Crítico", tone: "text-destructive", critical: true },
};

export function MissionBlockedState({
	blockers,
	onRetry,
}: MissionBlockedStateProps) {
	if (blockers.length === 0) return null;

	return (
		<section className="w-full max-w-2xl space-y-3">
			<h3 className="text-base font-medium tracking-tight">
				Bloqueos ({blockers.length})
			</h3>
			<ul className="divide-y divide-border rounded-xl border border-border bg-card">
				{blockers.map((blocker) => {
					const severity = SEVERITY[blocker.severity] ?? WARNING;
					const Icon = severity.critical ? CircleX : CircleAlert;
					return (
						<li key={blocker.id} className="flex items-start gap-3 px-4 py-3">
							<Icon
								aria-hidden="true"
								className={`mt-0.5 size-4 shrink-0 ${severity.tone}`}
							/>
							<p className="min-w-0 flex-1 text-sm">{blocker.reason}</p>
							<span className={`shrink-0 text-sm ${severity.tone}`}>
								{severity.label}
							</span>
						</li>
					);
				})}
			</ul>
			<button
				type="button"
				onClick={onRetry}
				className="flex h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
			>
				<RotateCcw aria-hidden="true" className="size-4" />
				Reintentar
			</button>
		</section>
	);
}

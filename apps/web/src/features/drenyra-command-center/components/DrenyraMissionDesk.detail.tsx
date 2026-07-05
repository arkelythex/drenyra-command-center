import { CheckCircle2 } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import type { DocumentMissionResult } from "../api/drenyra-mission.api";
import { AGENT_STAGES } from "./DrenyraMissionDesk.data";
import type { MissionPhase } from "./DrenyraMissionDesk.types";

/* ------------------------------------------------------------------ */
/*  Stage list                                                         */
/* ------------------------------------------------------------------ */

export type DrenyraMissionDeskStageListProps = {
	phase: MissionPhase;
	isBusy: boolean;
	activeLogCount: number;
};

/**
 * Right-rail agent stage indicators reflecting debate progress.
 */
export function DrenyraMissionDeskStageList({
	phase,
	isBusy,
	activeLogCount,
}: DrenyraMissionDeskStageListProps): ReactElement {
	return (
		<ul className="space-y-2 text-2xs">
			{AGENT_STAGES.map((stage, index) => {
				const activeIndex = Math.min(activeLogCount, AGENT_STAGES.length - 1);
				const done = phase === "ready" || index < activeIndex;
				const active = isBusy && index === activeIndex;
				return (
					<li
						key={stage}
						className={cn(
							"flex items-center gap-2 rounded-lg border px-2 py-1.5",
							done
								? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10"
								: active
									? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10"
									: "border-[var(--border-subtle)] bg-[var(--surface-1)]/50",
						)}
					>
						{done ? (
							<CheckCircle2 size={14} className="text-[var(--color-success)]" />
						) : (
							<span className="inline-block h-2 w-2 rounded-full bg-[var(--text-tertiary)]" />
						)}
						{stage}
					</li>
				);
			})}
		</ul>
	);
}

/* ------------------------------------------------------------------ */
/*  Result / completion card                                           */
/* ------------------------------------------------------------------ */

export type DrenyraMissionDeskResultProps = {
	missionResult: DocumentMissionResult | null;
	phase: MissionPhase;
};

/**
 * Green success banner shown once the mission completes.
 */
export function DrenyraMissionDeskResult({
	missionResult,
	phase,
}: DrenyraMissionDeskResultProps): ReactElement {
	if (!missionResult?.agentRun.output || phase !== "ready") {
		return <></>;
	}

	return (
		<div className="mt-4 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 p-4">
			<p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-success)]">
				<CheckCircle2 size={16} />
				Listo para declarar · caso {missionResult.fiscalCase.id}
			</p>
			<p className="mt-2 text-xs text-[var(--text-secondary)]">
				{missionResult.agentRun.output.summary}
			</p>
			<ul className="mt-2 list-inside list-disc text-2xs text-[var(--text-tertiary)]">
				{missionResult.agentRun.output.recommendedActions
					.slice(0, 3)
					.map((action) => (
						<li key={action}>{action}</li>
					))}
			</ul>
		</div>
	);
}

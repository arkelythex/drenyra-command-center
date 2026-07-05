"use client";

import { Bot } from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";
import { INBOX_AGENT_ORDER } from "../inbox.config";
import type {
	AgentStatusEvent,
	InboxStreamEvent,
	InboxUiPhase,
} from "../inbox.schema";

type InboxAgentFeedProps = {
	phase: InboxUiPhase;
	events: InboxStreamEvent[];
	progress: { processed: number; total: number; percent: number } | null;
};

function latestStatusByAgent(
	events: InboxStreamEvent[],
): Map<string, AgentStatusEvent> {
	const map = new Map<string, AgentStatusEvent>();
	for (const event of events) {
		if (event.type !== "agent:status") continue;
		const key = `${event.payload.invoiceId ?? "batch"}:${event.payload.agent}`;
		map.set(key, event.payload);
	}
	return map;
}

export function InboxAgentFeed({
	phase,
	events,
	progress,
}: InboxAgentFeedProps): ReactElement | null {
	if (phase !== "processing" && phase !== "complete" && events.length === 0) {
		return null;
	}

	const statuses = latestStatusByAgent(events);
	const debates = events.filter((event) => event.type === "agent:debate");

	return (
		<section
			className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 p-4"
			aria-live="polite"
		>
			<p className="text-2xs font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
				Agent feed en vivo
			</p>
			<ul className="mt-3 space-y-3">
				{INBOX_AGENT_ORDER.map((agent) => {
					const status = [...statuses.values()].find(
						(item) => item.agent === agent,
					);
					const running = status?.status === "running";
					const done = status?.status === "completed";
					return (
						<li
							key={agent}
							className={cn(
								"rounded-xl border px-3 py-2 text-xs transition",
								done
									? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10"
									: running
										? "border-[var(--color-info)]/40 bg-[var(--color-info)]/10"
										: "border-[var(--border-subtle)] bg-[var(--surface-2)]/50",
							)}
						>
							<div className="flex items-center gap-2 font-semibold">
								<Bot size={14} />
								{agent}
								{running ? " · procesando…" : done ? " · listo" : ""}
							</div>
							{status?.message ? (
								<p className="mt-1 text-2xs text-[var(--text-secondary)]">
									{status.message}
								</p>
							) : null}
						</li>
					);
				})}
			</ul>

			{debates.length > 0 ? (
				<div className="mt-4 space-y-2 rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3">
					<p className="text-2xs font-bold uppercase text-[var(--color-warning)]">
						Debate multi-agente
					</p>
					{debates.map((event, index) =>
						event.type === "agent:debate" ? (
							<p
								key={`${event.payload.invoiceId}-${index}`}
								className="text-xs"
							>
								{event.payload.agents.join(" vs ")}: {event.payload.message}
							</p>
						) : null,
					)}
				</div>
			) : null}

			{progress ? (
				<div className="mt-4">
					<div className="mb-1 flex justify-between text-2xs text-[var(--text-tertiary)]">
						<span>
							{progress.processed} de {progress.total}
						</span>
						<span>{progress.percent}%</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
						<div
							className="h-full bg-[var(--color-info)] transition-all"
							style={{ width: `${progress.percent}%` }}
						/>
					</div>
				</div>
			) : null}
		</section>
	);
}

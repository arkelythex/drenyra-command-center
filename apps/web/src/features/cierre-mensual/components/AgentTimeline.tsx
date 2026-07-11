import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Info,
	type LucideIcon,
} from "lucide-react";
import type { MissionTimelineEvent } from "../mission.types";

const STATUS_ICON: Record<string, LucideIcon> = {
	success: CheckCircle2,
	warning: AlertCircle,
	error: AlertCircle,
	info: Info,
	blocked: Clock,
};

const STATUS_COLOR: Record<string, string> = {
	success: "text-[var(--color-success)]",
	warning: "text-[var(--color-warning)]",
	error: "text-[var(--color-danger)]",
	info: "text-[var(--color-info)]",
	blocked: "text-[var(--color-warning)]",
};

interface AgentTimelineProps {
	events: MissionTimelineEvent[];
	maxVisible?: number;
}

export function AgentTimeline({ events, maxVisible = 20 }: AgentTimelineProps) {
	const visible = events.slice(-maxVisible);

	if (visible.length === 0) {
		return (
			<p className="text-xs text-[var(--text-tertiary)]">
				No hay eventos en la línea de tiempo.
			</p>
		);
	}

	return (
		<div className="space-y-0">
			{visible.map((event) => {
				const Icon = STATUS_ICON[event.status] ?? Info;
				const color = STATUS_COLOR[event.status] ?? "text-[var(--text-muted)]";
				const time = new Date(event.timestamp).toLocaleTimeString("es-PE", {
					hour: "2-digit",
					minute: "2-digit",
				});

				return (
					<div
						key={event.id}
						className="flex gap-3 border-l-2 border-[var(--border-subtle)] pb-2 pl-3 pt-0.5 last:pb-0"
					>
						<div className={`mt-0.5 shrink-0 ${color}`}>
							<Icon className="size-3.5" aria-hidden />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-xs font-medium text-[var(--text-primary)]">
								{event.action}
							</p>
							<p className="text-2xs text-[var(--text-tertiary)]">
								{event.description}
							</p>
							<div className="mt-0.5 flex items-center gap-2 text-2xs text-[var(--text-muted)]">
								<span>{time}</span>
								<span className="capitalize">{event.actor}</span>
								{event.scope ? <span>· {event.scope}</span> : null}
							</div>
						</div>
					</div>
				);
			})}
		</div>
	);
}

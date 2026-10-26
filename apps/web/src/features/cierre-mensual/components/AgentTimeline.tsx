import {
	CircleAlert,
	CircleCheck,
	Clock,
	Info,
	type LucideIcon,
} from "lucide-react";
import type { MissionTimelineEvent } from "../mission.types";

const FALLBACK_STATUS = { icon: Info, tone: "text-muted-foreground" } as const;

const STATUS: Record<string, { icon: LucideIcon; tone: string }> = {
	success: { icon: CircleCheck, tone: "text-success" },
	warning: { icon: CircleAlert, tone: "text-warning" },
	error: { icon: CircleAlert, tone: "text-destructive" },
	info: { icon: Info, tone: "text-muted-foreground" },
	blocked: { icon: Clock, tone: "text-warning" },
};

interface AgentTimelineProps {
	events: MissionTimelineEvent[];
	maxVisible?: number;
}

/** What the agent did, oldest to newest; only the latest `maxVisible` events. */
export function AgentTimeline({ events, maxVisible = 20 }: AgentTimelineProps) {
	const visible = events.slice(-maxVisible);

	if (visible.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No hay eventos en la línea de tiempo.
			</p>
		);
	}

	return (
		<ol aria-label="Línea de tiempo del agente" className="space-y-4">
			{visible.map((event) => {
				const { icon: Icon, tone } = STATUS[event.status] ?? FALLBACK_STATUS;
				const date = new Date(event.timestamp);
				return (
					<li key={event.id} className="flex gap-3">
						<Icon
							aria-hidden="true"
							className={`mt-0.5 size-4 shrink-0 ${tone}`}
						/>
						<div className="min-w-0 flex-1 space-y-0.5">
							<p className="text-sm font-medium">{event.action}</p>
							<p className="text-sm text-muted-foreground">
								{event.description}
							</p>
							<p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
								<time dateTime={date.toISOString()}>
									{date.toLocaleTimeString("es-PE", {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</time>
								<span className="capitalize">{event.actor}</span>
								{event.scope ? <span>· {event.scope}</span> : null}
							</p>
						</div>
					</li>
				);
			})}
		</ol>
	);
}

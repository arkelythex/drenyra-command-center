/**
 * TimelineDialog — Displays the stitched recommendation → decision → effect timeline (S4).
 *
 * Shows a vertical timeline of events with type-based icons and a recommendation
 * summary at the top.
 */

import { AlertTriangle, Bot, Clock, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatDateTime } from "../shared/formatting";
import type { RoadmapTimeline, RoadmapTimelineEvent } from "../shared/types";

interface TimelineDialogProps {
	timeline: RoadmapTimeline | null | undefined;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	isLoading: boolean;
	isError: boolean;
}

function EventIcon({ type }: { type: RoadmapTimelineEvent["type"] }) {
	switch (type) {
		case "RECOMMENDATION":
			return <Bot className="h-4 w-4 text-[var(--text-tertiary)]" />;
		case "DECISION":
			return <Clock className="h-4 w-4 text-amber-500" />;
		case "EFFECT":
			return <ShieldCheck className="h-4 w-4 text-[var(--color-success)]" />;
	}
}

function TimelineEventItem({
	event,
	isLast,
}: {
	event: RoadmapTimelineEvent;
	isLast: boolean;
}) {
	return (
		<li className="flex gap-3">
			{/* Vertical connector */}
			<div className="flex flex-col items-center">
				<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)]">
					<EventIcon type={event.type} />
				</div>
				{!isLast && <div className="w-px flex-1 bg-[var(--border-subtle)]" />}
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1 pb-4">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm font-medium text-[var(--text-primary)]">
						{event.status}
					</span>
					<span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-label font-medium uppercase tracking-wide text-[var(--text-tertiary)]">
						{event.type}
					</span>
				</div>
				<p className="mt-0.5 text-sm text-[var(--text-secondary)]">
					{event.summary}
				</p>
				{event.reason && (
					<p className="mt-1 text-xs italic text-[var(--text-tertiary)]">
						&quot;{event.reason}&quot;
					</p>
				)}
				<p className="mt-1 text-xs text-[var(--text-tertiary)]">
					{formatDateTime(event.at)}
				</p>
			</div>
		</li>
	);
}

export function TimelineDialog({
	timeline,
	open,
	onOpenChange,
	isLoading,
	isError,
}: TimelineDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Timeline — Trazabilidad completa</DialogTitle>
					<DialogDescription>
						Verificación de la cadena: Recomendación → Decisión → Efecto
					</DialogDescription>
				</DialogHeader>

				{isLoading && (
					<div className="flex items-center gap-2 py-6 text-sm text-[var(--text-secondary)]">
						<Loader2 className="h-4 w-4 animate-spin" />
						Cargando timeline...
					</div>
				)}

				{isError && (
					<div className="flex items-center gap-2 py-6 text-sm text-red-400">
						<AlertTriangle className="h-4 w-4" />
						No se pudo cargar el timeline de esta acción.
					</div>
				)}

				{timeline && !isLoading && (
					<div className="space-y-4">
						{/* Recommendation summary */}
						<div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-2)]/60 p-3">
							<p className="text-sm font-semibold text-[var(--text-primary)]">
								{timeline.recommendation.title}
							</p>
							<p className="mt-1 text-xs text-[var(--text-tertiary)]">
								Trace ID: <span className="font-mono">{timeline.traceId}</span>
							</p>
							<p className="text-xs text-[var(--text-secondary)]">
								{timeline.recommendation.description}
							</p>
						</div>

						{/* Event list */}
						<div className="max-h-[320px] overflow-y-auto pr-1">
							{timeline.events.length === 0 ? (
								<p className="py-4 text-center text-sm text-[var(--text-tertiary)]">
									No hay eventos registrados aún.
								</p>
							) : (
								<ul>
									{timeline.events.map((event, i) => (
										<TimelineEventItem
											key={i}
											event={event}
											isLast={i === timeline.events.length - 1}
										/>
									))}
								</ul>
							)}
						</div>
					</div>
				)}

				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cerrar
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

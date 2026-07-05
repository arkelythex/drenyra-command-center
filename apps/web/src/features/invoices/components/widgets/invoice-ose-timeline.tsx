import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceOseLifecycle } from "../../api/invoicing.api";
import { getInvoiceOseTimelineIcon } from "./invoice-ose-timeline-icon";
import { getInvoiceOseTimelineTone } from "./invoice-ose-timeline-tone";

interface InvoiceOseTimelineProps {
	timeline: NonNullable<InvoiceOseLifecycle["timeline"]>;
}

const DEFAULT_VISIBLE_EVENTS = 3;

function formatTimelineAt(value: string | Date): string | null {
	const at = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(at.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat("es-PE", {
		month: "short",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	}).format(at);
}

export function InvoiceOseTimeline({ timeline }: InvoiceOseTimelineProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const sortedEvents = [...timeline].reverse();
	const hasOverflow = sortedEvents.length > DEFAULT_VISIBLE_EVENTS;
	const visibleEvents =
		hasOverflow && !isExpanded
			? sortedEvents.slice(0, DEFAULT_VISIBLE_EVENTS)
			: sortedEvents;
	const hiddenEventsCount = Math.max(
		sortedEvents.length - DEFAULT_VISIBLE_EVENTS,
		0,
	);

	return (
		<div className="mt-3 grid gap-2">
			{visibleEvents.map((event, index) => {
				const timeLabel = formatTimelineAt(event.at);
				const icon = getInvoiceOseTimelineIcon(event.status);
				const isCurrentEvent = index === 0;
				const tone = getInvoiceOseTimelineTone(event.status);

				return (
					<div
						key={`${event.stage}-${event.status}-${index}`}
						className={cn(
							"relative pl-6 transition-opacity",
							isCurrentEvent ? "opacity-100" : "opacity-80",
						)}
					>
						<span
							aria-hidden="true"
							data-testid="invoice-ose-timeline-rail"
							className={cn(
								"absolute left-[7px] top-0 bottom-0 w-px",
								tone.railClassName,
							)}
						/>
						<span
							aria-hidden="true"
							data-testid="invoice-ose-timeline-dot"
							className={cn(
								"absolute left-1 top-4 h-2.5 w-2.5 rounded-full border",
								tone.dotClassName,
							)}
						/>
						<div
							className={cn(
								"rounded-lg border px-3 py-2",
								tone.containerClassName,
							)}
						>
							<div className="grid gap-1.5">
								<div className="flex min-w-0 flex-wrap items-center gap-2">
									<span
										aria-label={icon.label}
										className={cn("inline-flex items-center", icon.className)}
									>
										<icon.Icon size={12} strokeWidth={2.5} />
									</span>
									<span className="min-w-0 truncate text-2xs font-black uppercase tracking-widest text-foreground">
										{event.stage}
									</span>
									<Badge
										variant="outline"
										className={cn(
											"h-5 px-1.5 text-2xs font-black uppercase tracking-widest",
											tone.statusBadgeClassName,
										)}
									>
										{event.status}
									</Badge>
									{isCurrentEvent ? (
										<Badge
											variant="outline"
											className="h-5 border-white/10 bg-background/80 px-1.5 text-2xs font-black uppercase tracking-widest text-foreground"
										>
											Actual
										</Badge>
									) : null}
								</div>
								<div className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-5 text-2xs font-black uppercase tracking-widest text-muted-foreground sm:pl-0">
									<span>{event.source}</span>
									{timeLabel ? (
										<span className="text-muted-foreground/90">
											{timeLabel}
										</span>
									) : null}
								</div>
							</div>
							{event.message ? (
								<p className="mt-1 text-xs font-bold leading-relaxed text-muted-foreground">
									{event.message}
								</p>
							) : null}
						</div>
					</div>
				);
			})}
			{hasOverflow ? (
				<div className="pl-6">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-2xs font-black uppercase tracking-widest"
						onClick={() => setIsExpanded((current) => !current)}
					>
						{isExpanded ? "Ver menos" : `Ver mas (${hiddenEventsCount})`}
					</Button>
				</div>
			) : null}
		</div>
	);
}

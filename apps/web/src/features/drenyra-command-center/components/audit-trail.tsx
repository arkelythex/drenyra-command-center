import type { AuditEvent } from "../api/drenyra-command-center.api";

export function AuditTrail({ events }: { events: AuditEvent[] }) {
	return (
		<div className="space-y-2">
			{events.map((event) => (
				<div
					key={event.id}
					className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)] p-3"
				>
					<p className="text-xs font-bold">{event.eventType}</p>
					<p className="mt-1 text-2xs text-[var(--text-secondary)]">
						{event.message}
					</p>
					<time className="mt-2 block text-2xs text-[var(--text-tertiary)]">
						{new Date(event.occurredAt).toLocaleString()}
					</time>
				</div>
			))}
		</div>
	);
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	type CommandEnvelopeAuditDecision,
	listCommandEnvelopeAudit,
} from "../api/drenyra-command-envelope-audit.api";

const decisionOptions = [
	{ value: "all", label: "Todas" },
	{ value: "denied", label: "Denegadas" },
	{ value: "allowed", label: "Permitidas" },
] satisfies { value: CommandEnvelopeAuditDecision; label: string }[];

function decisionTone(eventType: string): string {
	return eventType === "CAPABILITY_DENIED"
		? "border-red-400/30 bg-red-500/10 text-red-200"
		: "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]";
}

export function CommandEnvelopeAuditPanel() {
	const [decision, setDecision] = useState<CommandEnvelopeAuditDecision>("all");
	const auditQuery = useQuery({
		queryKey: ["drenyra", "command-envelope-audit", decision],
		queryFn: () => listCommandEnvelopeAudit({ decision, limit: 8 }),
	});
	const events = auditQuery.data?.events ?? [];

	return (
		<section className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4 shadow-2xl shadow-black/20 ">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<p className="text-2xs font-bold uppercase tracking-[0.22em] text-cyan-200/80">
						Command Envelope Audit
					</p>
					<h2 className="mt-1 text-lg font-semibold text-white">
						Capability decisions
					</h2>
					<p className="mt-1 text-xs text-slate-400">
						Trazabilidad scoped de CAPABILITY_ALLOWED / CAPABILITY_DENIED.
					</p>
				</div>
				<div className="flex flex-wrap gap-2">
					{decisionOptions.map((option) => (
						<button
							key={option.value}
							type="button"
							onClick={() => setDecision(option.value)}
							className={
								decision === option.value
									? "rounded-full border border-cyan-300/40 bg-cyan-300/15 px-3 py-1 text-2xs font-bold text-cyan-100"
									: "rounded-full border border-white/10 bg-white/5 px-3 py-1 text-2xs font-bold text-slate-300 hover:border-white/20"
							}
						>
							{option.label}
						</button>
					))}
				</div>
			</div>

			{auditQuery.isLoading ? (
				<p className="mt-4 text-xs text-slate-400">Cargando auditoría…</p>
			) : auditQuery.error instanceof Error ? (
				<p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-100">
					{auditQuery.error.message}
				</p>
			) : events.length === 0 ? (
				<p className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
					Sin decisiones de capability para este scope fiscal.
				</p>
			) : (
				<div className="mt-4 grid gap-2">
					{events.map((event) => (
						<article
							key={event.id}
							className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
						>
							<div className="flex flex-wrap items-center gap-2">
								<span
									className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${decisionTone(event.eventType)}`}
								>
									{event.eventType}
								</span>
								<span className="text-2xs text-slate-500">
									{new Date(event.occurredAt).toLocaleString()}
								</span>
							</div>
							<p className="mt-2 text-xs text-slate-200">{event.message}</p>
							<p className="mt-1 text-2xs text-slate-500">
								Actor {event.actorId}
								{event.caseId ? ` · Caso ${event.caseId}` : " · Case-less"}
							</p>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

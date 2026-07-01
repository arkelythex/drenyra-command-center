import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
	type CommandAuditEventType,
	type CommandAuditFilter,
	listCommandAuditEvents,
} from "../api/drenyra-command-audit.api";

const commandAuditKeys = {
	filtered: (filter: CommandAuditFilter) =>
		["drenyra", "command-audit", filter] as const,
};

type DecisionFilter = "ALL" | CommandAuditEventType;

export function CommandCapabilityAuditPanel() {
	const [decision, setDecision] = useState<DecisionFilter>("ALL");
	const [commandDraft, setCommandDraft] = useState("");
	const [commandId, setCommandId] = useState("");
	const filter: CommandAuditFilter = {
		...(decision === "ALL" ? {} : { eventType: decision }),
		...(commandId ? { commandId } : {}),
	};
	const auditQuery = useQuery({
		queryKey: commandAuditKeys.filtered(filter),
		queryFn: () => listCommandAuditEvents(filter),
	});
	const events = auditQuery.data ?? [];

	return (
		<section className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 shadow-xl shadow-black/20 ">
			<div className="flex items-start justify-between gap-3">
				<div>
					<h4 className="text-2xs font-bold uppercase tracking-widest text-[var(--color-info)]">
						Capability audit
					</h4>
					<p className="mt-1 text-xs text-[var(--text-tertiary)]">
						Trazas de comandos permitidos o denegados por governance.
					</p>
				</div>
				<span className="rounded-full border border-white/10 px-2 py-1 text-2xs font-bold text-[var(--text-secondary)]">
					{events.length}
				</span>
			</div>
			<div className="mt-3 space-y-2">
				<div className="flex flex-wrap gap-2">
					{(["ALL", "CAPABILITY_ALLOWED", "CAPABILITY_DENIED"] as const).map(
						(item) => (
							<button
								key={item}
								type="button"
								onClick={() => setDecision(item)}
								className={`rounded-full border px-2 py-1 text-2xs font-bold ${
									decision === item
										? "border-[var(--color-info)]/50 bg-[var(--color-info)]/15 text-[var(--color-info)]"
										: "border-white/10 text-[var(--text-secondary)] hover:border-white/20"
								}`}
							>
								{item === "ALL" ? "Todos" : item.replace("CAPABILITY_", "")}
							</button>
						),
					)}
				</div>
				<form
					className="flex gap-2"
					onSubmit={(event) => {
						event.preventDefault();
						setCommandId(commandDraft.trim());
					}}
				>
					<label className="sr-only" htmlFor="command-audit-command">
						Filtrar por comando
					</label>
					<input
						id="command-audit-command"
						value={commandDraft}
						onChange={(event) => setCommandDraft(event.target.value)}
						placeholder="commandId"
						className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 text-xs outline-none focus:border-[var(--color-info)]/50"
					/>
					<button
						type="submit"
						className="rounded-lg border border-white/10 px-2 py-1 text-2xs font-bold text-[var(--text-secondary)] hover:border-white/20"
					>
						Filtrar
					</button>
					<button
						type="button"
						onClick={() => auditQuery.refetch()}
						className="rounded-lg border border-white/10 px-2 py-1 text-2xs font-bold text-[var(--text-secondary)] hover:border-white/20"
					>
						Refrescar
					</button>
				</form>
			</div>
			{auditQuery.isLoading ? (
				<p className="mt-3 text-xs text-[var(--text-tertiary)]">
					Cargando auditoría…
				</p>
			) : auditQuery.error instanceof Error ? (
				<p className="mt-3 text-xs text-[var(--color-danger)]">
					{auditQuery.error.message}
				</p>
			) : events.length === 0 ? (
				<p className="mt-3 text-xs text-[var(--text-tertiary)]">
					Sin eventos de capability en este scope fiscal.
				</p>
			) : (
				<div className="mt-3 space-y-2">
					{events.slice(0, 5).map((event) => (
						<article
							key={event.id}
							className="rounded-xl border border-white/10 bg-white/[0.03] p-3"
						>
							<p className="text-xs font-bold">{event.eventType}</p>
							<p className="mt-1 text-2xs text-[var(--text-secondary)]">
								{String(event.metadata.commandId ?? "command")} ·{" "}
								{String(event.metadata.toolId ?? "tool")}
							</p>
							<time className="mt-2 block text-2xs text-[var(--text-tertiary)]">
								{new Date(event.occurredAt).toLocaleString()}
							</time>
						</article>
					))}
				</div>
			)}
		</section>
	);
}

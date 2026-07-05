"use client";

import {
	AlertCircle,
	CheckCircle2,
	Clock,
	FileCheck,
	XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useCreateJournalEntry } from "@/features/drenyra/hooks/useJournalEntriesApi";
import { n } from "@/lib/utils";
import {
	type JournalEntry,
	useCentralBoardStore,
} from "@/stores/central-board-store";
import { EmptyState } from "./components/EmptyState";
import { EntryCard } from "./components/EntryCard";
import { DEMO_JOURNAL_ENTRIES } from "./JournalPendingList.data";

export function JournalPendingList() {
	const storeEntries = useCentralBoardStore((s) => s.journalEntries);
	const approveEntry = useCentralBoardStore((s) => s.approveJournalEntry);
	const rejectEntry = useCentralBoardStore((s) => s.rejectJournalEntry);
	const createMutation = useCreateJournalEntry();

	const entries = storeEntries.length > 0 ? storeEntries : DEMO_JOURNAL_ENTRIES;

	const pendingEntries = entries.filter((e) => e.status === "pending");
	const approvedEntries = entries.filter((e) => e.status === "approved");
	const rejectedEntries = entries.filter((e) => e.status === "rejected");
	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [approvingId, setApprovingId] = useState<string | null>(null);

	const handleApprove = useCallback(
		async (entry: JournalEntry) => {
			setApprovingId(entry.id);
			try {
				await createMutation.mutateAsync({
					organizationId: 1,
					date: new Date().toISOString().split("T")[0],
					gloss: entry.glosa,
					lines: [
						{
							accountId: entry.cuenta.includes("-")
								? entry.cuenta.split(" - ")[0].trim()
								: entry.cuenta,
							description: entry.glosa,
							debit: entry.debe,
							credit: entry.haber,
						},
					],
				});
				approveEntry(entry.id);
				toast.success("Asiento aprobado", {
					description: `"${entry.glosa.slice(0, 60)}${entry.glosa.length > 60 ? "…" : ""}" registrado como asiento contable`,
				});
			} catch (err) {
				toast.error("Error al aprobar asiento", {
					description:
						err instanceof Error
							? err.message
							: "Error al registrar el asiento en el libro diario",
				});
			} finally {
				setApprovingId(null);
			}
		},
		[createMutation, approveEntry],
	);

	if (entries.length === 0) {
		return <EmptyState />;
	}

	return (
		<div className="h-full overflow-auto custom-scrollbar">
			<div className="space-y-4 p-4">
				{/* Pending entries */}
				{pendingEntries.length > 0 && (
					<section>
						<h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
							<Clock size={14} className="text-[var(--color-warning)]" />
							Pendientes ({pendingEntries.length})
						</h3>
						<div className="space-y-2">
							{pendingEntries.map((entry) => (
								<EntryCard
									key={entry.id}
									entry={entry}
									isExpanded={expandedId === entry.id}
									isApproving={approvingId === entry.id}
									onToggle={() =>
										setExpandedId(expandedId === entry.id ? null : entry.id)
									}
									onApprove={() => handleApprove(entry)}
									onReject={() => rejectEntry(entry.id)}
								/>
							))}
						</div>
					</section>
				)}

				{/* Approved entries */}
				{approvedEntries.length > 0 && (
					<section>
						<h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
							<FileCheck size={14} className="text-[var(--color-success)]" />
							Aprobados ({approvedEntries.length})
						</h3>
						<div className="space-y-1">
							{approvedEntries.map((entry) => (
								<div
									key={entry.id}
									className="flex items-center gap-3 rounded-lg border border-[var(--color-success)]/10 bg-[var(--color-success)]/5 px-4 py-2"
								>
									<CheckCircle2
										size={14}
										className="shrink-0 text-[var(--color-success)]"
									/>
									<span className="flex-1 truncate text-xs text-[var(--text-secondary)]">
										{entry.glosa}
									</span>
									<span className="font-mono text-xs tabular-nums text-[var(--text-muted)]">
										{n(entry.debe || entry.haber)}
									</span>
								</div>
							))}
						</div>
					</section>
				)}

				{/* Rejected entries */}
				{rejectedEntries.length > 0 && (
					<section>
						<h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
							<AlertCircle size={14} className="text-[var(--color-danger)]" />
							Rechazados ({rejectedEntries.length})
						</h3>
						<div className="space-y-1">
							{rejectedEntries.map((entry) => (
								<div
									key={entry.id}
									className="flex items-center gap-3 rounded-lg border border-[var(--color-danger)]/10 bg-[var(--color-danger)]/5 px-4 py-2"
								>
									<XCircle
										size={14}
										className="shrink-0 text-[var(--color-danger)]"
									/>
									<span className="flex-1 truncate text-xs text-[var(--text-secondary)]">
										{entry.glosa}
									</span>
								</div>
							))}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}

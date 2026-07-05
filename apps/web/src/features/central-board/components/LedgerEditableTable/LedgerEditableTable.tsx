"use client";

import { useState, useCallback } from "react";
import { cn, n } from "@/lib/utils";
import {
	useJournalEntries,
	useUpdateJournalEntry,
} from "@/features/drenyra/hooks/useJournalEntriesApi";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { toast } from "sonner";
import { Loader2, AlertCircle, Download } from "lucide-react";
import { EditableCell } from "./EditableCell";

export function LedgerEditableTable() {
	const [highlightedId, setHighlightedId] = useState<string | null>(null);
	const { data: entries, isLoading, isError, error } = useJournalEntries();
	const { companyContext } = useActiveCompanyContext();
	const updateMutation = useUpdateJournalEntry();
	const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);

	const handleCellSave = useCallback(
		(id: string, field: "date" | "gloss", value: string) => {
			updateMutation.mutate(
				{ id, [field]: value },
				{
					onSuccess: () => {
						toast.success("Asiento actualizado", {
							description: `Campo "${field}" guardado correctamente`,
						});
					},
					onError: (err) => {
						toast.error("Error al actualizar asiento", {
							description:
								err instanceof Error ? err.message : "Error de conexión",
						});
					},
				},
			);
		},
		[updateMutation],
	);

	const totalDebe = entries?.reduce((s, e) => s + e.debe, 0) ?? 0;
	const totalHaber = entries?.reduce((s, e) => s + e.haber, 0) ?? 0;

	const handleExport = useCallback(
		async (format: "pdf" | "xlsx") => {
			setExporting(format);
			try {
				const res = await fetch(`/api/ledger/export/${format}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"X-Company-Id": companyContext.companyId,
					},
					body: JSON.stringify({}),
				});
				if (!res.ok) throw new Error("Export failed");
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `libro-mayor.${format}`;
				a.click();
				URL.revokeObjectURL(url);
			} catch (err) {
				console.error("Export error:", err);
			} finally {
				setExporting(null);
			}
		},
		[companyContext.companyId],
	);

	if (isLoading) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
					<Loader2 size={16} className="animate-spin" />
					Cargando asientos contables…
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="flex h-full items-center justify-center">
				<div className="flex flex-col items-center gap-2 text-center">
					<AlertCircle size={28} className="text-[var(--color-danger)]" />
					<p className="text-sm font-medium text-[var(--color-danger)]">
						Error al cargar asientos
					</p>
					<p className="text-xs text-[var(--text-muted)]">
						{error instanceof Error ? error.message : "Error de conexión"}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="h-full overflow-auto custom-scrollbar">
			<div className="p-4">
				<div className="overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-1)]/80 shadow-sm">
					<div className="overflow-x-auto">
						<table className="w-full text-left border-collapse min-w-[900px]">
							<thead>
								<tr className="border-b border-[var(--border-subtle)] bg-[var(--surface-2)]/50">
									<th className="px-6 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)] w-36">
										Fecha / Asiento
									</th>
									<th className="px-4 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)]">
										Glosa
									</th>
									<th className="px-4 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)] text-center w-24">
										CTA
									</th>
									<th className="px-4 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)] text-center w-20">
										Status
									</th>
									<th className="px-6 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)] text-right w-36">
										Debe
									</th>
									<th className="px-6 py-4 text-2xs font-black uppercase tracking-[0.15em] text-[var(--text-muted)] text-right w-36">
										Haber
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[var(--border-subtle)]/50">
								{!Array.isArray(entries) || entries.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-6 py-12 text-center text-sm text-[var(--text-muted)]"
										>
											No hay asientos contables en este período
										</td>
									</tr>
								) : (
									entries.map((entry) => (
										<tr
											key={entry.id}
											className={cn(
												"group transition-colors duration-200",
												highlightedId === entry.id
													? "bg-[var(--color-primary)]/5"
													: "hover:bg-[var(--surface-2)]/50",
											)}
											onClick={() =>
												setHighlightedId(
													highlightedId === entry.id ? null : entry.id,
												)
											}
										>
											<td className="px-6 py-4 align-top">
												<div className="flex flex-col gap-0.5">
													<EditableCell
														value={entry.date}
														onSave={(v) => handleCellSave(entry.id, "date", v)}
													/>
													<span className="font-mono text-2xs text-[var(--text-muted)]">
														#{entry.entryNumber}
													</span>
												</div>
											</td>
											<td className="px-4 py-4 align-top">
												<div className="flex flex-col gap-1.5">
													<EditableCell
														value={entry.gloss}
														onSave={(v) => handleCellSave(entry.id, "gloss", v)}
													/>
													<div className="flex items-center gap-2">
														<span className="inline-flex items-center gap-1 rounded-md border border-[var(--border-subtle)] bg-[var(--surface-2)] px-2 py-0.5 text-2xs font-mono font-bold text-[var(--text-secondary)]">
															<span className="h-1 w-1 rounded-full bg-[var(--color-primary)]" />
															CTA {entry.cuenta}
														</span>
													</div>
												</div>
											</td>
											<td className="px-4 py-4 align-top text-center">
												<EditableCell
													value={entry.cuenta}
													onSave={(v) =>
														console.log("update cuenta", entry.id, v)
													}
												/>
											</td>
											<td className="px-4 py-4 align-top text-center">
												<span
													className={cn(
														"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold",
														entry.status === "borrador" &&
															"bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
														entry.status === "mayorizado" &&
															"bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
														entry.status === "declarado" &&
															"bg-[var(--color-success)]/10 text-[var(--color-success)]",
													)}
												>
													{entry.status === "borrador" && "Borrador"}
													{entry.status === "mayorizado" && "Mayorizado"}
													{entry.status === "declarado" && "Declarado"}
												</span>
											</td>
											<td className="px-6 py-4 align-top text-right">
												<EditableCell
													value={entry.debe}
													type="money"
													onSave={(v) =>
														console.log("update debe", entry.id, v)
													}
												/>
											</td>
											<td className="px-6 py-4 align-top text-right">
												<EditableCell
													value={entry.haber}
													type="money"
													onSave={(v) =>
														console.log("update haber", entry.id, v)
													}
												/>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>

				{/* Summary strip */}
				<div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-2)]/50 px-4 py-2">
					<div className="flex items-center gap-2">
						<span className="text-2xs text-[var(--text-muted)]">
							{entries?.length ?? 0} asientos · Click para editar cualquier
							celda
						</span>
						<span className="mx-2 text-[var(--text-muted)]">|</span>
						<button
							type="button"
							onClick={() => handleExport("pdf")}
							disabled={exporting !== null}
							className="inline-flex items-center gap-1 text-2xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
						>
							<Download size={11} />
							{exporting === "pdf" ? "Exportando…" : "PDF"}
						</button>
						<button
							type="button"
							onClick={() => handleExport("xlsx")}
							disabled={exporting !== null}
							className="inline-flex items-center gap-1 text-2xs font-medium text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-50"
						>
							<Download size={11} />
							{exporting === "xlsx" ? "Exportando…" : "XLSX"}
						</button>
					</div>
					<div className="flex items-center gap-4 text-xs">
						<span className="text-[var(--text-secondary)]">
							Debe:{" "}
							<span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
								{n(totalDebe)}
							</span>
						</span>
						<span className="text-[var(--text-muted)]">|</span>
						<span className="text-[var(--text-secondary)]">
							Haber:{" "}
							<span className="font-mono font-bold tabular-nums text-[var(--text-primary)]">
								{n(totalHaber)}
							</span>
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

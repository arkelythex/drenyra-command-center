import { FileX2, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { Dialog, PageHeader, PageShell, StatusBadge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPEN } from "@/lib/utils";
import { useCreditNotes } from "../hooks/useCreditNotes";
import type { CreditNoteRecord } from "../types";
import { CreateCreditNoteDialog } from "./CreateCreditNoteDialog";
import { CreditNoteRow } from "./CreditNoteRow";

export function CreditNotesList() {
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const {
		creditNotes,
		isLoading,
		stats,
		searchQuery,
		setSearchQuery,
		updateStatus,
		deleteCreditNote,
		sendOse,
	} = useCreditNotes();

	const handleDelete = (id: string) => {
		if (window.confirm("¿Estás seguro de eliminar esta nota de crédito?")) {
			deleteCreditNote(id);
		}
	};

	const handleSendOse = (id: string) => {
		sendOse(id);
	};

	const handleUpdateStatus = (id: string, status: string) => {
		updateStatus({ id, status });
	};

	const [selectedNote, setSelectedNote] = useState<CreditNoteRecord | null>(
		null,
	);

	return (
		<PageShell>
			<PageHeader
				title="Notas de Crédito"
				description="Gestión de notas de crédito electrónicas"
				icon={<FileX2 className="h-6 w-6" />}
				actions={
					<Button
						onClick={() => setIsCreateOpen(true)}
						className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-widest"
					>
						<Plus className="mr-2 h-4 w-4" /> Nueva Nota de Crédito
					</Button>
				}
			/>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<Card variant="glass">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
							Totales
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-1">
							<p className="text-2xl font-bold text-foreground tabular-nums">
								{stats.total}
							</p>
							<p className="text-sm font-mono text-muted-foreground tabular-nums">
								{formatPEN(stats.totalAmount)}
							</p>
						</div>
					</CardContent>
				</Card>

				<Card variant="glass">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
							Anulaciones
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-danger tabular-nums">
							{stats.anulacionCount}
						</p>
					</CardContent>
				</Card>

				<Card variant="glass">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
							Descuentos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-info tabular-nums">
							{stats.descuentoCount}
						</p>
					</CardContent>
				</Card>

				<Card variant="glass">
					<CardHeader className="pb-2">
						<CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
							Pendientes
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-warning tabular-nums">
							{stats.draftCount + stats.sentCount}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-md">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar por número, motivo o factura..."
						aria-label="Buscar nota de crédito"
						className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
					/>
				</div>
			</div>

			<div className="overflow-hidden rounded-xl border border-border">
				<table className="w-full">
					<thead>
						<tr className="bg-muted/50">
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								N° Documento
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Tipo
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Motivo
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Estado
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Monto
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Fecha
							</th>
							<th className="px-4 py-3 text-left text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Acciones
							</th>
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-12 text-center text-sm text-muted-foreground"
								>
									Cargando notas de crédito...
								</td>
							</tr>
						) : creditNotes.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-12 text-center text-sm text-muted-foreground"
								>
									{searchQuery
										? "No se encontraron notas de crédito con ese criterio de búsqueda"
										: "No hay notas de crédito registradas. Crea la primera usando el botón superior."}
								</td>
							</tr>
						) : (
							creditNotes.map((cn) => (
								<CreditNoteRow
									key={cn.id}
									creditNote={cn}
									n={(v) => formatPEN(v)}
									onView={(id) =>
										setSelectedNote(
											creditNotes.find((cn) => cn.id === id) || null,
										)
									}
									onSendOse={handleSendOse}
									onUpdateStatus={handleUpdateStatus}
									onDelete={handleDelete}
								/>
							))
						)}
					</tbody>
				</table>
			</div>

			<CreateCreditNoteDialog
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>

			{/* Detail Dialog */}
			<Dialog
				open={!!selectedNote}
				onOpenChange={(open) => !open && setSelectedNote(null)}
			>
				{selectedNote && (
					<div className="fixed inset-0 z-50 flex items-center justify-center">
						<div className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl">
							<button
								onClick={() => setSelectedNote(null)}
								className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:bg-muted"
							>
								<X className="h-4 w-4" />
							</button>

							<h2 className="n font-black tracking-tight text-foreground leading-none mb-1">
								{selectedNote.fullNumber}
							</h2>
							<StatusBadge
								status={
									selectedNote.status === "ACCEPTED"
										? "success"
										: selectedNote.status === "REJECTED"
											? "danger"
											: selectedNote.status === "SENT"
												? "warning"
												: "neutral"
								}
								label={selectedNote.status}
								size="sm"
							/>

							<div className="mt-6 space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
											Factura Referencia
										</p>
										<p className="text-sm font-medium text-foreground">
											{selectedNote.referenceInvoiceId}
										</p>
									</div>
									<div>
										<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
											Tipo
										</p>
										<p className="text-sm font-medium text-foreground">
											{selectedNote.creditNoteType}
										</p>
									</div>
								</div>

								<div>
									<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
										Motivo
									</p>
									<p className="text-sm text-foreground">
										{selectedNote.reason}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
											Base Imponible
										</p>
										<p className="text-sm font-mono font-semibold tabular-nums text-foreground">
											{formatPEN(Number(selectedNote.baseAmount))}
										</p>
									</div>
									<div>
										<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
											IGV (18%)
										</p>
										<p className="text-sm font-mono font-semibold tabular-nums text-foreground">
											{formatPEN(Number(selectedNote.igvAmount))}
										</p>
									</div>
								</div>

								<div className="border-t border-border pt-4">
									<div className="flex items-center justify-between">
										<p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
											Total
										</p>
										<p className="text-xl font-mono font-black tabular-nums text-foreground">
											{formatPEN(Number(selectedNote.totalAmount))}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
									<p>Emisión: {formatDate(selectedNote.issueDate)}</p>
									<p>Moneda: {selectedNote.currency}</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</Dialog>
		</PageShell>
	);
}

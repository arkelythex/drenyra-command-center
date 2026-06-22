import { FileText, FileWarning, Plus, Search, Send, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Dialog } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatPEN } from "@/lib/utils";
import { useDebitNotes } from "../hooks/useDebitNotes";
import type { DebitNoteRecord } from "../types";
import { CreateDebitNoteDialog } from "./CreateDebitNoteDialog";
import { DebitNoteRow } from "./DebitNoteRow";

interface DebitNotesListProps {
	onViewDebitNote?: (id: string) => void;
}

function n(value: number): string {
	return formatPEN(value);
}

export function DebitNotesList({ onViewDebitNote }: DebitNotesListProps) {
	const {
		debitNotes,
		isLoading,
		searchQuery,
		setSearchQuery,
		stats,
		updateStatus,
		deleteDebitNote,
		sendOse,
		refetch,
	} = useDebitNotes();

	const [createOpen, setCreateOpen] = useState(false);

	const summaryCards = useMemo(
		() => [
			{
				label: "Totales",
				value: n(stats.totalAmount),
				icon: FileText,
				variant: "default" as const,
			},
			{
				label: "Enviados",
				value: stats.sentCount.toString(),
				icon: Send,
				variant: "warning" as const,
			},
			{
				label: "Borradores",
				value: stats.draftCount.toString(),
				icon: FileWarning,
				variant: "neutral" as const,
			},
		],
		[stats],
	);

	const handleCreateSuccess = () => {
		setCreateOpen(false);
		refetch();
	};

	const [selectedNote, setSelectedNote] = useState<DebitNoteRecord | null>(
		null,
	);
	const handleViewDebitNote = useMemo(
		() => (id: string) =>
			setSelectedNote(debitNotes.find((dn) => dn.id === id) || null),
		[debitNotes],
	);

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-lg font-semibold text-foreground">
						Notas de Débito
					</h2>
					<p className="text-sm text-muted-foreground">
						Notas de débito SUNAT tipo 08
					</p>
				</div>
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Nueva Nota de Débito
				</Button>
			</div>

			<div className="grid grid-cols-3 gap-4">
				{summaryCards.map((card) => (
					<Card key={card.label} variant="default">
						<CardContent className="flex items-center gap-3 p-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
								<card.icon className="h-5 w-5 text-muted-foreground" />
							</div>
							<div>
								<p className="text-xs text-muted-foreground">{card.label}</p>
								<p className="text-lg font-semibold text-foreground">
									{card.value}
								</p>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			<div className="relative">
				<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder="Buscar por número, motivo o factura..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-9"
				/>
			</div>

			<div className="rounded-xl border border-border bg-surface">
				<table className="w-full">
					<thead>
						<tr className="border-b border-border">
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Número
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Motivo
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Estado
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Cargo Adicional
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Total
							</th>
							<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
								Emisión
							</th>
							<th className="px-4 py-3" />
						</tr>
					</thead>
					<tbody>
						{isLoading ? (
							Array.from({ length: 5 }).map((_, i) => (
								<tr key={i} className="border-b border-border">
									<td className="px-4 py-3" colSpan={7}>
										<Skeleton className="h-8 w-full" />
									</td>
								</tr>
							))
						) : debitNotes.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									className="px-4 py-12 text-center text-sm text-muted-foreground"
								>
									No se encontraron notas de débito
								</td>
							</tr>
						) : (
							debitNotes.map((dn: DebitNoteRecord) => (
								<DebitNoteRow
									key={dn.id}
									debitNote={dn}
									n={n}
									onView={handleViewDebitNote}
									onSendOse={sendOse}
									onUpdateStatus={(id, status) => updateStatus({ id, status })}
									onDelete={deleteDebitNote}
								/>
							))
						)}
					</tbody>
				</table>
			</div>

			<CreateDebitNoteDialog
				open={createOpen}
				onOpenChange={setCreateOpen}
				onSuccess={handleCreateSuccess}
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
								<div>
									<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
										Motivo
									</p>
									<p className="text-sm text-foreground">
										{selectedNote.reason}
									</p>
								</div>
								<div>
									<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
										Factura Referencia
									</p>
									<p className="text-sm font-medium text-foreground">
										{selectedNote.referenceInvoiceId}
									</p>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<div>
										<p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-1">
											Cargo Adicional
										</p>
										<p className="text-sm font-mono font-semibold tabular-nums text-foreground">
											{formatPEN(Number(selectedNote.additionalAmount))}
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
		</div>
	);
}

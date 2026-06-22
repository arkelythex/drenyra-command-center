import {
	DndContext,
	DragOverlay,
	PointerSensor,
	closestCenter,
	type DragEndEvent,
	type DragStartEvent,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/atoms/text";
import { BORDER_RADIUS } from "@/lib/design-tokens";
import { InvoiceCard } from "./widgets/InvoiceCard";
import { KanbanColumn } from "./KanbanColumn";
import type { Invoice } from "../hooks/useInvoices";
import type { InvoiceStatus } from "../hooks/useInvoicesBoard";
import { ALLOWED_TRANSITIONS } from "./invoices-board.constants";

type InvoicesByStatus = {
	draft: Invoice[];
	sent: Invoice[];
	overdue: Invoice[];
	paid: Invoice[];
};

type InvoiceDragResolution =
	| { kind: "no-target" }
	| { kind: "missing-invoice" }
	| { kind: "invalid-target"; target: string }
	| { kind: "unchanged" }
	| { kind: "move"; invoiceId: string; nextStatus: InvoiceStatus }
	| {
			kind: "blocked";
			currentStatus: InvoiceStatus;
			nextStatus: InvoiceStatus;
	  };

const isInvoiceStatus = (status: string): status is InvoiceStatus =>
	status === "draft" ||
	status === "sent" ||
	status === "paid" ||
	status === "overdue";

export function resolveInvoiceDragTransition(
	allInvoices: Invoice[],
	invoiceId: string,
	targetId: string | null,
): InvoiceDragResolution {
	if (!targetId) return { kind: "no-target" };
	if (!isInvoiceStatus(targetId))
		return { kind: "invalid-target", target: targetId };

	const invoice = allInvoices.find((item) => item.id === invoiceId);
	if (!invoice) return { kind: "missing-invoice" };
	if (invoice.status === targetId) return { kind: "unchanged" };

	const allowed = ALLOWED_TRANSITIONS[invoice.status]?.includes(targetId);

	return allowed
		? { kind: "move", invoiceId, nextStatus: targetId }
		: { kind: "blocked", currentStatus: invoice.status, nextStatus: targetId };
}

interface InvoicesSummaryBoardProps {
	isLoading: boolean;
	error: unknown;
	normalizedQuery: string;
	hasSearchResults: boolean;
	searchQuery: string;
	filteredInvoicesByStatus: InvoicesByStatus;
	filteredColumnTotals: {
		sent: number;
		overdue: number;
	};
	allInvoices: Invoice[];
	onUpdateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
	onCreateInvoice: () => void;
	onCreateInvoiceIntent?: () => void;
	formatMoney: (amount: number) => string;
}

export const InvoicesSummaryBoard = ({
	isLoading,
	error,
	normalizedQuery,
	hasSearchResults,
	searchQuery,
	filteredInvoicesByStatus,
	filteredColumnTotals,
	allInvoices,
	onUpdateInvoiceStatus,
	onCreateInvoice,
	onCreateInvoiceIntent,
	formatMoney,
}: InvoicesSummaryBoardProps) => {
	const [activeId, setActiveId] = useState<string | null>(null);
	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 8 },
		}),
	);

	const activeInvoice = activeId
		? allInvoices.find((invoice) => invoice.id === activeId)
		: null;

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		const invoiceId = String(active.id);
		const targetId = over ? String(over.id) : null;
		const transition = resolveInvoiceDragTransition(
			allInvoices,
			invoiceId,
			targetId,
		);

		if (transition.kind === "move") {
			onUpdateInvoiceStatus(transition.invoiceId, transition.nextStatus);
			toast.success(`Factura movida a ${transition.nextStatus.toUpperCase()}`);
		} else if (transition.kind === "blocked") {
			toast.error(
				`No se puede mover de ${transition.currentStatus.toUpperCase()} a ${transition.nextStatus.toUpperCase()}`,
			);
		}

		setActiveId(null);
	};
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
		>
			<div className="flex h-full snap-x snap-mandatory justify-start gap-5 pb-16 lg:gap-6">
				{isLoading ? (
					<Card className="w-full rounded-3xl border border-border bg-card p-8">
						<div className="flex items-center gap-3 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Sincronizando facturas...
						</div>
					</Card>
				) : null}

				{!isLoading && error ? (
					<Card className="w-full rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-700 dark:text-amber-300">
						<div className="flex items-center gap-2 text-sm font-semibold">
							<AlertTriangle className="h-4 w-4" />
							No se pudo actualizar la cobranza. Se muestran datos de respaldo.
						</div>
					</Card>
				) : null}

				{!isLoading && normalizedQuery && !hasSearchResults ? (
					<Card className="w-full rounded-3xl border border-border bg-card p-8 text-center">
						<p className="text-sm font-semibold text-foreground">
							Sin resultados para “{searchQuery}”
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Prueba con otro cliente o número de factura.
						</p>
					</Card>
				) : null}

				{!isLoading && hasSearchResults ? (
					<>
						<KanbanColumn
							id="draft"
							title="Borradores"
							count={filteredInvoicesByStatus.draft.length}
						>
							<div className="flex h-full flex-col space-y-4">
								<button
									type="button"
									onClick={onCreateInvoice}
									onPointerEnter={onCreateInvoiceIntent}
									onFocus={onCreateInvoiceIntent}
									className="group flex min-h-[180px] flex-none cursor-pointer flex-col items-start justify-between rounded-3xl border border-dashed border-border bg-card p-6 text-left transition-[background-color,border-color,box-shadow] duration-150 hover:bg-card/90 hover:shadow-md"
									style={{ borderRadius: BORDER_RADIUS.modal }}
								>
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-foreground shadow-sm">
										<Plus className="h-6 w-6" strokeWidth={1.75} />
									</div>
									<div>
										<Text variant="label" className="mb-2 text-foreground">
											Nueva factura
										</Text>
										<p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
											Crea un comprobante nuevo y agrégalo al flujo de cobranza.
										</p>
									</div>
									<p className="text-label font-medium text-muted-foreground">
										Click para empezar
									</p>
								</button>
								{filteredInvoicesByStatus.draft.map((invoice) => (
									<InvoiceCard key={invoice.id} invoice={invoice} />
								))}
							</div>
						</KanbanColumn>

						<KanbanColumn
							id="sent"
							title="Emitidas"
							count={filteredInvoicesByStatus.sent.length}
							total={formatMoney(filteredColumnTotals.sent)}
							active={filteredInvoicesByStatus.sent.length > 0}
						>
							<div className="space-y-4 rounded-3xl border border-border bg-card/70 p-3">
								{filteredInvoicesByStatus.sent.map((invoice) => (
									<InvoiceCard key={invoice.id} invoice={invoice} isSent />
								))}
							</div>
						</KanbanColumn>

						<KanbanColumn
							id="overdue"
							title="Vencidas"
							count={filteredInvoicesByStatus.overdue.length}
							total={formatMoney(filteredColumnTotals.overdue)}
							active={filteredInvoicesByStatus.overdue.length > 0}
						>
							<div className="space-y-4 rounded-3xl border border-destructive/20 bg-destructive/5 p-3">
								{filteredInvoicesByStatus.overdue.map((invoice) => (
									<InvoiceCard key={invoice.id} invoice={invoice} isOverdue />
								))}
							</div>
						</KanbanColumn>

						<KanbanColumn
							id="paid"
							title="Cobradas"
							count={filteredInvoicesByStatus.paid.length}
						>
							<div className="space-y-4 rounded-3xl border border-border bg-card/60 p-3">
								{filteredInvoicesByStatus.paid.map((invoice) => (
									<InvoiceCard key={invoice.id} invoice={invoice} isPaid />
								))}
							</div>
						</KanbanColumn>
					</>
				) : null}
			</div>

			<DragOverlay>
				{activeInvoice ? (
					<div className="scale-105 rotate-3 opacity-80">
						<InvoiceCard
							invoice={activeInvoice}
							isSent={activeInvoice.status === "sent"}
							isOverdue={activeInvoice.status === "overdue"}
							isPaid={activeInvoice.status === "paid"}
						/>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
};

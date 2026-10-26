import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { CircleAlert, FilePlus2, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "../hooks/useInvoices";
import type { InvoiceStatus } from "../hooks/useInvoicesBoard";
import { ALLOWED_TRANSITIONS } from "./invoices-board.constants";
import { KanbanColumn } from "./KanbanColumn";
import { InvoiceCard } from "./widgets/InvoiceCard";

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

/** Same wording as the column titles, so a toast and the board name a state alike. */
const STATUS_LABEL: Record<InvoiceStatus, string> = {
	draft: "Borradores",
	sent: "Emitidas",
	overdue: "Vencidas",
	paid: "Cobradas",
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
			toast.success(`Factura movida a ${STATUS_LABEL[transition.nextStatus]}`);
		} else if (transition.kind === "blocked") {
			toast.error(
				`No se puede mover de ${STATUS_LABEL[transition.currentStatus]} a ${STATUS_LABEL[transition.nextStatus]}`,
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
					<p
						role="status"
						className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
					>
						<Loader2
							aria-hidden="true"
							className="size-4 animate-spin motion-reduce:animate-none"
						/>
						Sincronizando facturas…
					</p>
				) : null}

				{!isLoading && error ? (
					<p
						role="alert"
						className="flex w-full items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-foreground"
					>
						<CircleAlert
							aria-hidden="true"
							className="size-4 shrink-0 text-warning"
						/>
						No se pudo actualizar la cobranza. Se muestran datos de respaldo.
					</p>
				) : null}

				{!isLoading && normalizedQuery && !hasSearchResults ? (
					<section className="w-full space-y-1 rounded-xl border border-border bg-card p-8 text-center">
						<h2 className="text-base font-medium">
							Sin resultados para “{searchQuery}”
						</h2>
						<p className="text-sm text-muted-foreground">
							Prueba con otro cliente o número de factura.
						</p>
					</section>
				) : null}

				{!isLoading &&
				!error &&
				!normalizedQuery &&
				allInvoices.length === 0 ? (
					<section className="mx-auto flex w-full max-w-md flex-col items-center gap-4 py-10 text-center sm:py-16">
						<FilePlus2
							aria-hidden="true"
							className="size-8 text-muted-foreground"
						/>
						<div className="space-y-1">
							<h2 className="text-lg font-medium tracking-tight">
								Aún no hay comprobantes
							</h2>
							<p className="text-sm leading-relaxed text-muted-foreground">
								Emite tu primera factura y aparecerá aquí, lista para seguir su
								cobranza hasta el pago.
							</p>
						</div>
						<button
							type="button"
							onClick={onCreateInvoice}
							onPointerEnter={onCreateInvoiceIntent}
							onFocus={onCreateInvoiceIntent}
							className="flex h-11 shrink-0 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
						>
							<Plus aria-hidden="true" className="size-4" />
							Emitir factura
						</button>
					</section>
				) : null}

				{!isLoading && hasSearchResults ? (
					<>
						<KanbanColumn
							id="draft"
							title="Borradores"
							count={filteredInvoicesByStatus.draft.length}
						>
							<div className="flex h-full flex-col space-y-3">
								<button
									type="button"
									onClick={onCreateInvoice}
									onPointerEnter={onCreateInvoiceIntent}
									onFocus={onCreateInvoiceIntent}
									className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
								>
									<Plus aria-hidden="true" className="size-4" />
									Nueva factura
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
							<div className="space-y-3 rounded-xl border border-border bg-card p-3">
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
							<div className="space-y-3 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
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
							<div className="space-y-3 rounded-xl border border-border bg-card p-3">
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
					<div className="opacity-90 shadow-lg">
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

import { AlertTriangle, Loader2, UploadCloud } from "lucide-react";
import type { FC } from "react";
import { Text } from "@/components/atoms/text";
import { Card } from "@/components/ui/card";
import type {
	Bill,
	BillStatus,
	BillsByStatus,
} from "../../hooks/use-bills.types";
import { KanbanColumn } from "../KanbanColumn";
import { BillCard } from "../widgets/BillCard";

interface BillsKanbanViewProps {
	isLoading: boolean;
	error: unknown;
	searchQuery: string;
	hasResults: boolean;
	filteredBills: BillsByStatus;
	pendingBillId: string | undefined;
	updateBillStatus: (id: string, status: BillStatus) => void;
	formatStatusTotal: (items: Bill[]) => string;
}

export const BillsKanbanView: FC<BillsKanbanViewProps> = ({
	isLoading,
	error,
	searchQuery,
	hasResults,
	filteredBills,
	pendingBillId,
	updateBillStatus,
	formatStatusTotal,
}) => {
	if (isLoading) {
		return (
			<div className="flex h-full justify-start gap-5 pb-12">
				<Card className="w-full rounded-2xl border border-border/60 bg-card/60 p-8">
					<div className="flex items-center gap-3 text-muted-foreground">
						<Loader2 className="h-4 w-4 animate-spin" />
						Cargando cuentas por pagar...
					</div>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-full justify-start gap-5 pb-12">
				<Card className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-700 dark:text-amber-300">
					<div className="flex items-center gap-2 text-sm font-semibold">
						<AlertTriangle className="h-4 w-4" />
						No se pudo sincronizar CxP. Mostrando datos de respaldo.
					</div>
				</Card>
			</div>
		);
	}

	if (searchQuery && !hasResults) {
		return (
			<div className="flex h-full justify-start gap-5 pb-12">
				<Card className="w-full rounded-2xl border border-border/60 bg-card/60 p-8 text-center">
					<p className="text-sm font-semibold text-foreground">
						Sin resultados para “{searchQuery}”
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Prueba con RUC, proveedor o número de comprobante.
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex h-full justify-start gap-5 pb-12">
			{/* COLUMN 1: IN REVIEW */}
			<KanbanColumn title="En Revisión" count={filteredBills.review.length}>
				<Card className="group relative flex min-h-[280px] flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/60 bg-card p-8 text-center transition-[background-color,border-color] duration-200 hover:border-border hover:bg-card/80">
					<div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-foreground">
						<UploadCloud
							className="h-8 w-8 text-foreground/70"
							strokeWidth={1.75}
						/>
					</div>
					<Text
						variant="label"
						className="mb-2 text-base font-semibold tracking-tight text-foreground"
					>
						Carga de comprobantes
					</Text>
					<p className="max-w-[220px] text-xs leading-relaxed text-muted-foreground">
						Arrastra PDFs o XML y envíalos directo al flujo de revisión.
					</p>
				</Card>
				<div className="space-y-4">
					{filteredBills.review.map((bill: Bill) => (
						<BillCard
							key={bill.id}
							bill={bill}
							onSendToApproval={() => updateBillStatus(bill.id, "approval")}
							isActionPending={pendingBillId === bill.id}
						/>
					))}
				</div>
			</KanbanColumn>

			{/* COLUMN 2: PENDING APPROVAL */}
			<KanbanColumn
				title="Pendiente Aprobación"
				count={filteredBills.approval.length}
				active={filteredBills.approval.length > 0}
			>
				<div className="space-y-4">
					{filteredBills.approval.map((bill: Bill) => (
						<BillCard
							key={bill.id}
							bill={bill}
							onMarkReadyForPayment={() => updateBillStatus(bill.id, "payment")}
							onMarkAsPaid={() => updateBillStatus(bill.id, "paid")}
							isActionPending={pendingBillId === bill.id}
						/>
					))}
				</div>
			</KanbanColumn>

			{/* COLUMN 3: AWAITING PAYMENT */}
			<KanbanColumn
				title="Listas para Pagar"
				count={filteredBills.payment.length}
				total={formatStatusTotal(filteredBills.payment)}
				active={filteredBills.payment.length > 0}
			>
				<div className="space-y-4">
					{filteredBills.payment.map((bill: Bill) => (
						<BillCard
							key={bill.id}
							bill={bill}
							isDue
							onMarkAsPaid={() => updateBillStatus(bill.id, "paid")}
							isActionPending={pendingBillId === bill.id}
						/>
					))}
				</div>
			</KanbanColumn>

			{/* COLUMN 4: PAID */}
			<KanbanColumn title="Pagadas (30 días)" count={filteredBills.paid.length}>
				<div className="space-y-4 opacity-40 hover:opacity-100 transition-opacity duration-300">
					{filteredBills.paid.map((bill: Bill) => (
						<BillCard key={bill.id} bill={bill} isPaid />
					))}
				</div>
			</KanbanColumn>
		</div>
	);
};

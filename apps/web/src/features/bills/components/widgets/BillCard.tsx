import { CheckCircle2, Clock, Loader2, MoreHorizontal } from "lucide-react";
import type React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, n } from "@/lib/utils";
import type { Bill } from "../../hooks/useBills";

interface BillCardProps {
	bill: Bill;
	isDue?: boolean;
	isPaid?: boolean;
	onSendToApproval?: () => void;
	onMarkReadyForPayment?: () => void;
	onMarkAsPaid?: () => void;
	isActionPending?: boolean;
}

export const BillCard = ({
	bill,
	isDue,
	isPaid,
	onSendToApproval,
	onMarkReadyForPayment,
	onMarkAsPaid,
	isActionPending = false,
}: BillCardProps) => {
	const formatMoney = (amount: number, currency: string) =>
		n(amount, currency as "PEN" | "USD" | "EUR");

	const hasActions = Boolean(
		onSendToApproval || onMarkReadyForPayment || onMarkAsPaid,
	);

	return (
		<Card
			className={cn(
				"group cursor-pointer rounded-2xl border border-border/60 bg-[var(--surface-1)] p-4 shadow-sm transition-[background-color,border-color,box-shadow] duration-200 hover:border-border hover:bg-card/90",
				isDue && "border-[var(--border-danger)] bg-[var(--surface-danger)]/10",
			)}
		>
			<div className="mb-4 flex items-start justify-between gap-3">
				<div className="flex min-w-0 items-center gap-3">
					<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-muted/30">
						{bill.vendor.logo ? (
							<img
								src={bill.vendor.logo}
								alt={bill.vendor.name}
								className="h-full w-full object-cover"
							/>
						) : (
							<span className="text-xs font-semibold uppercase text-foreground/55">
								{bill.vendor.initials}
							</span>
						)}
					</div>
					<div className="min-w-0">
						<h4 className="truncate text-sm font-semibold tracking-tight text-foreground">
							{bill.vendor.name}
						</h4>
						<p className="mt-1 truncate text-label font-medium tracking-[0.18em] text-muted-foreground">
							{bill.invoiceNumber}
						</p>
					</div>
				</div>
				{hasActions ? (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								aria-label="Más opciones"
								disabled={isActionPending}
								className="h-8 w-8 rounded-xl text-muted-foreground opacity-70 transition-[background-color,color,opacity] hover:bg-muted hover:text-foreground"
								onClick={(event) => event.stopPropagation()}
							>
								{isActionPending ? (
									<Loader2 className="h-4 w-4 animate-spin" />
								) : (
									<MoreHorizontal size={16} />
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							{onSendToApproval ? (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={(event) => {
										event.preventDefault();
										onSendToApproval();
									}}
								>
									Enviar a aprobación
								</DropdownMenuItem>
							) : null}
							{onMarkReadyForPayment ? (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={(event) => {
										event.preventDefault();
										onMarkReadyForPayment();
									}}
								>
									Dejar lista para pago
								</DropdownMenuItem>
							) : null}
							{onMarkAsPaid ? (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={(event) => {
										event.preventDefault();
										onMarkAsPaid();
									}}
								>
									Marcar como pagada
								</DropdownMenuItem>
							) : null}
						</DropdownMenuContent>
					</DropdownMenu>
				) : null}
			</div>

			<div className="space-y-4">
				<div className="flex items-center justify-between gap-3">
					<div className="flex min-w-0 items-center gap-2">
						{isPaid ? (
							<BillStatusBadge
								tone="success"
								icon={<CheckCircle2 size={12} strokeWidth={2.5} />}
							>
								Pagada
							</BillStatusBadge>
						) : isDue ? (
							<BillStatusBadge tone="danger" icon={<Clock size={12} />}>
								Vence{" "}
								{new Date(bill.dueDate).toLocaleDateString("es-PE", {
									month: "short",
									day: "numeric",
								})}
							</BillStatusBadge>
						) : (
							<div className="flex items-center gap-2">
								<div className="flex -space-x-2">
									{bill.approvers?.slice(0, 3).map((approver, i) => (
										<div
											key={`${approver.initials}-${i}`}
											className="flex h-6 w-6 items-center justify-center rounded-full border border-background bg-muted text-2xs font-semibold text-muted-foreground ring-2 ring-background"
											title={approver.name ?? approver.initials}
										>
											{approver.initials}
										</div>
									))}
								</div>
								<span className="text-label font-medium text-muted-foreground">
									Aprobadores
								</span>
							</div>
						)}
					</div>
					<span className="text-lg font-semibold tracking-tight text-foreground tabular-nums">
						{formatMoney(bill.amount, bill.currency)}
					</span>
				</div>

				<div className="flex items-center justify-between text-label text-muted-foreground">
					<span>Vencimiento</span>
					<span className="font-medium text-foreground/80">
						{new Date(bill.dueDate).toLocaleDateString("es-PE", {
							day: "2-digit",
							month: "short",
							year: "numeric",
						})}
					</span>
				</div>
			</div>
		</Card>
	);
};

interface BillStatusBadgeProps {
	children: React.ReactNode;
	icon: React.ReactNode;
	tone: "success" | "danger";
}

const BillStatusBadge = ({ children, icon, tone }: BillStatusBadgeProps) => (
	<div
		className={cn(
			"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-label font-semibold",
			tone === "success"
				? "border-[var(--border-success)] bg-[var(--surface-success)]/10 text-[var(--text-success)]"
				: "border-[var(--border-danger)] bg-[var(--surface-danger)]/10 text-[var(--text-danger)]",
		)}
	>
		{icon}
		<span>{children}</span>
	</div>
);

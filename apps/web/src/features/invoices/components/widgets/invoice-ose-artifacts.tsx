import { AlertCircle, CheckCircle2, Route, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InvoiceOseLifecycle } from "../../api/invoicing.api";
import type { SendInvoiceOseResult } from "../../hooks/useSendInvoiceOse";
import { getInvoiceOseStatusTone } from "../../lib/invoice-ose-status-tone";
import { InvoiceOseTimeline } from "./invoice-ose-timeline";

interface InvoiceOseArtifactsProps {
	hasPersistedCdr: boolean;
	cdrUrl: string | null;
	persistedTicket: string | null;
	persistedSunatStatus: string | null;
	persistedSunatCode: string | null;
	persistedSunatIncidentMessage: string | null;
	lifecycle?: InvoiceOseLifecycle;
	isLifecyclePending: boolean;
	transientOseResult?: SendInvoiceOseResult;
	sendErrorMessage?: string;
	lifecycleErrorMessage?: string;
	onOpenCdr: () => void;
	onCopyTicket: () => void;
	onLoadLifecycle: () => void;
	onOpenRunbook?: () => void;
}

export function InvoiceOseArtifacts({
	hasPersistedCdr,
	cdrUrl,
	persistedTicket,
	persistedSunatStatus,
	persistedSunatCode,
	persistedSunatIncidentMessage,
	lifecycle,
	isLifecyclePending,
	transientOseResult,
	sendErrorMessage,
	lifecycleErrorMessage,
	onOpenCdr,
	onCopyTicket,
	onLoadLifecycle,
	onOpenRunbook,
}: InvoiceOseArtifactsProps) {
	const transientTone =
		transientOseResult?.oseStatus === "ACCEPTED"
			? "border-[rgba(var(--premium-success-rgb),0.20)] bg-[rgba(var(--premium-success-rgb),0.08)]"
			: "border-yellow-500/20 bg-yellow-500/10";
	const persistedTone = getInvoiceOseStatusTone(persistedSunatStatus);
	const lifecycleTone = getInvoiceOseStatusTone(lifecycle?.currentStatus);

	return (
		<>
			{hasPersistedCdr ? (
				<div
					className={cn(
						"mt-4 rounded-xl border px-3 py-3",
						persistedTone.containerClassName,
					)}
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5 bg-background/70">
							<CheckCircle2 size={10} strokeWidth={3} />
							CDR disponible
						</Badge>
						{persistedSunatStatus ? (
							<Badge
								variant="outline"
								className={cn("gap-1.5", persistedTone.badgeClassName)}
							>
								{persistedTone.label}
							</Badge>
						) : null}
						<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
							Constancia SUNAT guardada
						</span>
						{persistedTicket ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Ticket {persistedTicket}
							</span>
						) : null}
						{persistedSunatStatus ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								SUNAT {persistedSunatStatus}
							</span>
						) : null}
						{persistedSunatCode ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								CODIGO {persistedSunatCode}
							</span>
						) : null}
						{cdrUrl ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-2xs font-black uppercase tracking-widest"
								onClick={onOpenCdr}
							>
								Abrir CDR
							</Button>
						) : null}
						{persistedTicket ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-2xs font-black uppercase tracking-widest"
								onClick={onCopyTicket}
							>
								Copiar Ticket
							</Button>
						) : null}
						<Button
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-2xs font-black uppercase tracking-widest"
							onClick={onLoadLifecycle}
							disabled={isLifecyclePending}
						>
							{isLifecyclePending ? "Cargando..." : "Ver Trazabilidad"}
						</Button>
					</div>
					<p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
						Esta factura ya tiene evidencia persistida de recepcion y puede retomarse despues de recargar.
					</p>
					{persistedSunatIncidentMessage ? (
						<div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/8 px-3 py-2">
							<p className="text-2xs font-black uppercase tracking-widest text-yellow-700 dark:text-yellow-300">
								Incidente SUNAT
							</p>
							<p className="mt-1 text-xs font-bold leading-relaxed text-muted-foreground">
								{persistedSunatIncidentMessage}
							</p>
						</div>
					) : null}
				</div>
			) : null}

			{transientOseResult ? (
				<div
					className={cn(
						"mt-4 rounded-xl border px-3 py-3",
						transientTone,
					)}
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5 bg-background/70">
							<Send size={10} />
							OSE {transientOseResult.oseStatus}
						</Badge>
						<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
							Ticket {transientOseResult.transactionId}
						</span>
						{transientOseResult.sunatCode ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								SUNAT {transientOseResult.sunatCode}
							</span>
						) : null}
					</div>
					{transientOseResult.sunatMessage ? (
						<p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
							{transientOseResult.sunatMessage}
						</p>
					) : null}
				</div>
			) : null}

			{lifecycle || isLifecyclePending ? (
				<div
					className={cn(
						"mt-4 rounded-xl border px-3 py-3",
						lifecycle
							? lifecycleTone.containerClassName
							: "border-border/80 bg-background/70",
					)}
				>
					<div className="flex flex-wrap items-center gap-2">
						<Badge variant="outline" className="gap-1.5 bg-background/70">
							<Route size={10} />
							Trazabilidad OSE
						</Badge>
						{lifecycle ? (
							<Badge
								variant="outline"
								className={cn("gap-1.5", lifecycleTone.badgeClassName)}
							>
								Estado {lifecycleTone.label}
							</Badge>
						) : null}
						{lifecycle?.transactionId ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Transacción {lifecycle.transactionId}
							</span>
						) : null}
						{lifecycle?.sunatCode ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								SUNAT {lifecycle.sunatCode}
							</span>
						) : null}
						{lifecycle?.runbook?.id ? (
							<span className="text-2xs font-black uppercase tracking-widest text-muted-foreground">
								Runbook {lifecycle.runbook.id}
							</span>
						) : null}
						{lifecycle?.runbook && onOpenRunbook ? (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 text-2xs font-black uppercase tracking-widest"
								onClick={onOpenRunbook}
							>
								Abrir Runbook
							</Button>
						) : null}
					</div>
					<p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
						{isLifecyclePending
							? "Consultando la ultima trazabilidad operativa..."
							: lifecycle?.sunatMessage ||
								"Se cargo la ultima trazabilidad disponible para esta factura."}
					</p>
					{lifecycle?.timeline?.length ? (
						<InvoiceOseTimeline timeline={lifecycle.timeline} />
					) : null}
				</div>
			) : null}

			{sendErrorMessage ? (
				<div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-3">
					<div className="flex items-center gap-2">
						<AlertCircle size={14} className="text-destructive" />
						<p className="text-2xs font-black uppercase tracking-widest text-destructive">
							Error OSE
						</p>
					</div>
					<p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
						{sendErrorMessage}
					</p>
				</div>
			) : null}

			{lifecycleErrorMessage ? (
				<div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-3">
					<div className="flex items-center gap-2">
						<AlertCircle size={14} className="text-destructive" />
						<p className="text-2xs font-black uppercase tracking-widest text-destructive">
							Error Trazabilidad
						</p>
					</div>
					<p className="mt-2 text-xs font-bold leading-relaxed text-muted-foreground">
						{lifecycleErrorMessage}
					</p>
				</div>
			) : null}
		</>
	);
}

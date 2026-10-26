import { AlertCircle, CheckCircle2, Route, Send } from "lucide-react";
import type { ReactNode } from "react";
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
	lifecycle?: InvoiceOseLifecycle | undefined;
	isLifecyclePending: boolean;
	transientOseResult?: SendInvoiceOseResult | undefined;
	sendErrorMessage?: string | undefined;
	lifecycleErrorMessage?: string | undefined;
	onOpenCdr: () => void;
	onCopyTicket: () => void;
	onLoadLifecycle: () => void;
	onOpenRunbook?: () => void | undefined;
}

const META = "text-xs font-medium text-muted-foreground";
const NOTE = "mt-2 text-sm leading-relaxed text-muted-foreground";
const LINK_BUTTON = "h-11 px-2 text-xs font-medium";

type ArtifactsProps = InvoiceOseArtifactsProps;

function Meta({ children }: { children: ReactNode }) {
	return <span className={META}>{children}</span>;
}

function ErrorBlock({ title, message }: { title: string; message: string }) {
	return (
		<div
			role="alert"
			className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-3"
		>
			<div className="flex items-center gap-2">
				<AlertCircle
					aria-hidden="true"
					size={14}
					className="text-destructive"
				/>
				<p className="text-xs font-medium text-destructive">{title}</p>
			</div>
			<p className={NOTE}>{message}</p>
		</div>
	);
}

function PersistedCdr(props: ArtifactsProps) {
	const {
		persistedTicket,
		persistedSunatStatus,
		persistedSunatCode,
		persistedSunatIncidentMessage,
		cdrUrl,
		isLifecyclePending,
	} = props;
	const tone = getInvoiceOseStatusTone(persistedSunatStatus);

	return (
		<div
			className={cn(
				"mt-4 rounded-xl border px-3 py-3",
				tone.containerClassName,
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
						className={cn("gap-1.5", tone.badgeClassName)}
					>
						{tone.label}
					</Badge>
				) : null}
				<Meta>Constancia SUNAT guardada</Meta>
				{persistedTicket ? <Meta>Ticket {persistedTicket}</Meta> : null}
				{persistedSunatStatus ? (
					<Meta>SUNAT {persistedSunatStatus}</Meta>
				) : null}
				{persistedSunatCode ? <Meta>CODIGO {persistedSunatCode}</Meta> : null}
				{cdrUrl ? (
					<Button
						variant="ghost"
						size="sm"
						className={LINK_BUTTON}
						onClick={props.onOpenCdr}
					>
						Abrir CDR
					</Button>
				) : null}
				{persistedTicket ? (
					<Button
						variant="ghost"
						size="sm"
						className={LINK_BUTTON}
						onClick={props.onCopyTicket}
					>
						Copiar Ticket
					</Button>
				) : null}
				<Button
					variant="ghost"
					size="sm"
					className={LINK_BUTTON}
					onClick={props.onLoadLifecycle}
					disabled={isLifecyclePending}
				>
					{isLifecyclePending ? "Cargando..." : "Ver Trazabilidad"}
				</Button>
			</div>
			<p className={NOTE}>
				Esta factura ya tiene evidencia persistida de recepcion y puede
				retomarse despues de recargar.
			</p>
			{persistedSunatIncidentMessage ? (
				<div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
					<p className="text-xs font-medium text-warning">Incidente SUNAT</p>
					<p className={NOTE}>{persistedSunatIncidentMessage}</p>
				</div>
			) : null}
		</div>
	);
}

function TransientResult({ result }: { result: SendInvoiceOseResult }) {
	const tone =
		result.oseStatus === "ACCEPTED"
			? "border-success/30 bg-success/10"
			: "border-warning/30 bg-warning/10";

	return (
		<div className={cn("mt-4 rounded-xl border px-3 py-3", tone)}>
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="outline" className="gap-1.5 bg-background/70">
					<Send size={10} />
					OSE {result.oseStatus}
				</Badge>
				<Meta>Ticket {result.transactionId}</Meta>
				{result.sunatCode ? <Meta>SUNAT {result.sunatCode}</Meta> : null}
			</div>
			{result.sunatMessage ? (
				<p className={NOTE}>{result.sunatMessage}</p>
			) : null}
		</div>
	);
}

function LifecycleBlock(props: ArtifactsProps) {
	const { lifecycle, isLifecyclePending, onOpenRunbook } = props;
	const tone = getInvoiceOseStatusTone(lifecycle?.currentStatus);
	const message = isLifecyclePending
		? "Consultando la ultima trazabilidad operativa..."
		: lifecycle?.sunatMessage ||
			"Se cargo la ultima trazabilidad disponible para esta factura.";

	return (
		<div
			className={cn(
				"mt-4 rounded-xl border px-3 py-3",
				lifecycle ? tone.containerClassName : "border-border bg-background/70",
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
						className={cn("gap-1.5", tone.badgeClassName)}
					>
						Estado {tone.label}
					</Badge>
				) : null}
				{lifecycle?.transactionId ? (
					<Meta>Transacción {lifecycle.transactionId}</Meta>
				) : null}
				{lifecycle?.sunatCode ? <Meta>SUNAT {lifecycle.sunatCode}</Meta> : null}
				{lifecycle?.runbook?.id ? (
					<Meta>Runbook {lifecycle.runbook.id}</Meta>
				) : null}
				{lifecycle?.runbook && onOpenRunbook ? (
					<Button
						variant="ghost"
						size="sm"
						className={LINK_BUTTON}
						onClick={onOpenRunbook}
					>
						Abrir Runbook
					</Button>
				) : null}
			</div>
			<p className={NOTE}>{message}</p>
			{lifecycle?.timeline?.length ? (
				<InvoiceOseTimeline timeline={lifecycle.timeline} />
			) : null}
		</div>
	);
}

export function InvoiceOseArtifacts(props: InvoiceOseArtifactsProps) {
	const { lifecycle, isLifecyclePending, transientOseResult } = props;

	return (
		<>
			{props.hasPersistedCdr ? <PersistedCdr {...props} /> : null}
			{transientOseResult ? (
				<TransientResult result={transientOseResult} />
			) : null}
			{lifecycle || isLifecyclePending ? <LifecycleBlock {...props} /> : null}
			{props.sendErrorMessage ? (
				<ErrorBlock title="Error OSE" message={props.sendErrorMessage} />
			) : null}
			{props.lifecycleErrorMessage ? (
				<ErrorBlock
					title="Error Trazabilidad"
					message={props.lifecycleErrorMessage}
				/>
			) : null}
		</>
	);
}

import { useDraggable } from "@dnd-kit/core";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useFinancialHaptics, useHaptics } from "@/hooks/useHaptics";
import { LEGIBILITY } from "@/lib/legibility";
import { cn, n } from "@/lib/utils";
import { useInvoiceOseLifecycle } from "../../hooks/useInvoiceOseLifecycle";
import type { Invoice } from "../../hooks/useInvoices";
import { useDownloadInvoicePDF } from "../../hooks/usePDFActions";
import { useSendInvoiceOse } from "../../hooks/useSendInvoiceOse";
import {
	getInvoiceRunbookHref,
	getOpenableInvoiceArtifactUrl,
	getPersistedInvoiceTicket,
	getPersistedSunatCode,
	getPersistedSunatIncidentMessage,
	getPersistedSunatStatus,
} from "../../lib/invoice-artifacts";
import { InvoiceCardHeader } from "./InvoiceCardHeader";
import { InvoiceCardStatusBadge } from "./InvoiceCardStatusBadge";
import { InvoiceOseArtifacts } from "./invoice-ose-artifacts";

const DeleteInvoiceDialog = lazy(async () => {
	const mod = await import("../DeleteInvoiceDialog");
	return { default: mod.DeleteInvoiceDialog };
});

const EditInvoiceModal = lazy(async () => {
	const mod = await import("../EditInvoiceModal");
	return { default: mod.EditInvoiceModal };
});

const PDFPreviewModal = lazy(async () => {
	const mod = await import("../PDFPreviewModal");
	return { default: mod.PDFPreviewModal };
});

const SendEmailModal = lazy(async () => {
	const mod = await import("../SendEmailModal");
	return { default: mod.SendEmailModal };
});

function LazyInvoiceActionStatus() {
	return (
		<div className="sr-only" role="status">
			Cargando acción de factura
		</div>
	);
}

interface InvoiceCardProps {
	invoice: Invoice;
	isSent?: boolean;
	isOverdue?: boolean;
	isPaid?: boolean;
}

export function InvoiceCard({
	invoice,
	isSent,
	isOverdue,
	isPaid,
}: InvoiceCardProps) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [showEditModal, setShowEditModal] = useState(false);
	const [showEmailModal, setShowEmailModal] = useState(false);
	const [showPDFPreview, setShowPDFPreview] = useState(false);

	const downloadPDF = useDownloadInvoicePDF();
	const sendInvoiceOse = useSendInvoiceOse();
	const invoiceOseLifecycle = useInvoiceOseLifecycle();
	const haptics = useFinancialHaptics();
	const { trigger } = useHaptics();

	// Draggable (disabled for paid invoices)
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: invoice.id,
			disabled: isPaid,
		});

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	// Derived OSE data
	const oseResult = sendInvoiceOse.data;
	const cdrUrl = getOpenableInvoiceArtifactUrl(invoice.sunatCdr);
	const persistedTicket = getPersistedInvoiceTicket(invoice.sunatTicket);
	const persistedSunatStatus = getPersistedSunatStatus(invoice.sunatStatus);
	const persistedSunatCode = getPersistedSunatCode(invoice.sunatCode);
	const persistedSunatIncidentMessage = getPersistedSunatIncidentMessage({
		status: invoice.sunatStatus,
		code: invoice.sunatCode,
		message: invoice.sunatMessage,
	});
	const runbookHref = getInvoiceRunbookHref(invoiceOseLifecycle.data?.runbook);
	const hasPersistedCdr = Boolean(invoice.sunatCdr);
	const showTransientOseResult = Boolean(oseResult) && !hasPersistedCdr;

	// Event handlers
	const openCdr = () => {
		if (!cdrUrl) return;
		window.open(cdrUrl, "_blank", "noopener,noreferrer");
	};

	const copyTicket = async () => {
		if (!persistedTicket) return;

		if (!navigator.clipboard) {
			toast.error("Tu navegador no permite copiar el ticket");
			return;
		}

		try {
			await navigator.clipboard.writeText(persistedTicket);
			toast.success("Ticket copiado", {
				description: persistedTicket,
			});
		} catch {
			toast.error("No se pudo copiar el ticket");
		}
	};

	const loadLifecycle = () => {
		trigger("light");
		invoiceOseLifecycle.mutate(invoice.id);
	};

	const openRunbook = () => {
		if (!runbookHref) return;
		window.open(runbookHref, "_blank", "noopener,noreferrer");
	};

	const formatMoney = (amount: number, currency: string) =>
		n(amount, currency as "PEN" | "USD" | "EUR");

	return (
		<>
			<div
				ref={setNodeRef}
				style={style}
				{...attributes}
				{...listeners}
				className={cn(
					"group transition-[opacity,transform] active:scale-[0.99]",
					isDragging && "opacity-50 cursor-grabbing",
					!isPaid && "cursor-grab active:cursor-grabbing",
				)}
			>
				<Card
					className={cn(
						"rounded-2xl border border-border bg-[var(--surface-1)] p-4 shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150 hover:bg-muted/30",
						isOverdue &&
							"border-[var(--border-danger)] ring-1 ring-[var(--border-danger)]/30 shadow-sm",
					)}
				>
					<InvoiceCardHeader
						invoice={invoice}
						cdrUrl={cdrUrl}
						persistedTicket={persistedTicket}
						onSendToOse={() => {
							trigger("light");
							sendInvoiceOse.mutate(invoice.id);
						}}
						isSendingToOse={sendInvoiceOse.isPending}
						onLoadLifecycle={() => {
							trigger("light");
							invoiceOseLifecycle.mutate(invoice.id);
						}}
						isLoadingLifecycle={invoiceOseLifecycle.isPending}
						onOpenCdr={openCdr}
						onCopyTicket={() => {
							void copyTicket();
						}}
						onShowEdit={() => {
							trigger("light");
							setShowEditModal(true);
						}}
						onShowPDFPreview={() => setShowPDFPreview(true)}
						onDownloadPDF={() => {
							trigger("medium");
							downloadPDF.mutate(invoice.id);
						}}
						isDownloadingPDF={downloadPDF.isPending}
						onShowEmail={() => setShowEmailModal(true)}
						onShowDelete={() => {
							haptics.warning();
							setShowDeleteDialog(true);
						}}
					/>

					<div className="mt-auto flex items-end justify-between gap-3">
						<div className="flex flex-col gap-2">
							<InvoiceCardStatusBadge
								isPaid={isPaid}
								isOverdue={isOverdue}
								isSent={isSent}
								dueDate={invoice.dueDate}
							/>
						</div>
						<div className="text-right">
							<span
								className={cn(
									"text-base font-medium font-mono tracking-tight text-[var(--text-primary)] tabular-nums",
									LEGIBILITY.textShadow.medium,
								)}
							>
								{formatMoney(
									invoice.totalAmount || invoice.amount || 0,
									invoice.currency,
								)}
							</span>
						</div>
					</div>

					<InvoiceOseArtifacts
						hasPersistedCdr={hasPersistedCdr}
						cdrUrl={cdrUrl}
						persistedTicket={persistedTicket}
						persistedSunatStatus={persistedSunatStatus}
						persistedSunatCode={persistedSunatCode}
						persistedSunatIncidentMessage={persistedSunatIncidentMessage}
						lifecycle={invoiceOseLifecycle.data}
						isLifecyclePending={invoiceOseLifecycle.isPending}
						transientOseResult={showTransientOseResult ? oseResult : undefined}
						sendErrorMessage={sendInvoiceOse.error?.message}
						lifecycleErrorMessage={invoiceOseLifecycle.error?.message}
						onOpenCdr={openCdr}
						onCopyTicket={() => {
							void copyTicket();
						}}
						onLoadLifecycle={loadLifecycle}
						onOpenRunbook={openRunbook}
					/>
				</Card>
			</div>

			<Suspense fallback={<LazyInvoiceActionStatus />}>
				{showEditModal && (
					<EditInvoiceModal
						open={showEditModal}
						onOpenChange={setShowEditModal}
						invoice={invoice}
					/>
				)}

				{showDeleteDialog && (
					<DeleteInvoiceDialog
						open={showDeleteDialog}
						onOpenChange={setShowDeleteDialog}
						invoice={{
							id: invoice.id,
							invoiceNumber: invoice.invoiceNumber,
							status: invoice.status,
							customer: invoice.customer,
						}}
					/>
				)}

				{showEmailModal && invoice.customer.email && (
					<SendEmailModal
						invoiceId={invoice.id}
						invoiceNumber={invoice.invoiceNumber}
						customerEmail={invoice.customer.email}
						onClose={() => setShowEmailModal(false)}
					/>
				)}

				{showPDFPreview && (
					<PDFPreviewModal
						invoiceId={invoice.id}
						invoiceNumber={invoice.invoiceNumber}
						onClose={() => setShowPDFPreview(false)}
					/>
				)}
			</Suspense>
		</>
	);
}

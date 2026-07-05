import {
	CheckCircle2,
	Copy,
	Download,
	Edit,
	Eye,
	Mail,
	MoreHorizontal,
	Route,
	Send,
	Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LEGIBILITY } from "@/lib/legibility";
import { cn } from "@/lib/utils";

interface InvoiceCardHeaderProps {
	invoice: {
		id: string;
		status: string;
		invoiceNumber: string;
		customer: {
			name: string;
			initials: string;
			email?: string | null;
			logo?: string | null;
		};
	};
	cdrUrl: string | null;
	persistedTicket: string | null;
	onSendToOse: () => void;
	isSendingToOse: boolean;
	onLoadLifecycle: () => void;
	isLoadingLifecycle: boolean;
	onOpenCdr: () => void;
	onCopyTicket: () => void;
	onShowEdit: () => void;
	onShowPDFPreview: () => void;
	onDownloadPDF: () => void;
	isDownloadingPDF: boolean;
	onShowEmail: () => void;
	onShowDelete: () => void;
}

export function InvoiceCardHeader({
	invoice,
	cdrUrl,
	persistedTicket,
	onSendToOse,
	isSendingToOse,
	onLoadLifecycle,
	isLoadingLifecycle,
	onOpenCdr,
	onCopyTicket,
	onShowEdit,
	onShowPDFPreview,
	onDownloadPDF,
	isDownloadingPDF,
	onShowEmail,
	onShowDelete,
}: InvoiceCardHeaderProps) {
	const canSendToOse = invoice.status === "draft" || invoice.status === "sent";
	const canInspectOse = invoice.status !== "draft";
	const isDraft = invoice.status === "draft";
	const hasEmail = Boolean(invoice.customer.email);

	return (
		<div className="mb-4 flex items-start justify-between gap-3">
			<div className="flex items-center gap-4">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/70 shadow-inner transition-[background-color,border-color,color,transform] duration-150 group-hover:bg-primary group-hover:text-primary-foreground">
					{invoice.customer.logo ? (
						<img
							src={invoice.customer.logo}
							alt={invoice.customer.name}
							className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
						/>
					) : (
						<span className="font-black text-xs uppercase opacity-40">
							{invoice.customer.initials}
						</span>
					)}
				</div>
				<div className="min-w-0">
					<h4
						className={cn(
							"font-black text-xs uppercase tracking-tight truncate leading-none mb-1.5 text-foreground",
							LEGIBILITY.textShadow.light,
						)}
					>
						{invoice.customer.name}
					</h4>
					<p className="text-xs font-bold text-muted-foreground font-mono tracking-widest truncate">
						{invoice.invoiceNumber}
					</p>
				</div>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Más opciones"
						className="h-8 w-8 opacity-70 transition-opacity hover:opacity-100"
						onClick={(e) => e.stopPropagation()}
					>
						<MoreHorizontal size={16} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="end"
					className="w-48 border-border bg-[var(--surface-1)] shadow-md"
				>
					{canSendToOse && (
						<>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={onSendToOse}
								disabled={isSendingToOse}
							>
								<Send className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">
									{isSendingToOse
										? "Enviando..."
										: invoice.status === "draft"
											? "Enviar a OSE"
											: "Reintentar OSE"}
								</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{canInspectOse ? (
						<>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={onLoadLifecycle}
								disabled={isLoadingLifecycle}
							>
								<Route className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">
									{isLoadingLifecycle ? "Cargando..." : "Ver Trazabilidad OSE"}
								</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					) : null}
					{isDraft && (
						<>
							<DropdownMenuItem className="cursor-pointer" onClick={onShowEdit}>
								<Edit className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">Editar</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{!isDraft && (
						<>
							{cdrUrl ? (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={onOpenCdr}
								>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									<span className="font-bold text-xs uppercase">Abrir CDR</span>
								</DropdownMenuItem>
							) : null}
							{persistedTicket ? (
								<DropdownMenuItem
									className="cursor-pointer"
									onClick={onCopyTicket}
								>
									<Copy className="mr-2 h-4 w-4" />
									<span className="font-bold text-xs uppercase">
										Copiar Ticket
									</span>
								</DropdownMenuItem>
							) : null}
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={onShowPDFPreview}
							>
								<Eye className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">
									Vista Previa PDF
								</span>
							</DropdownMenuItem>
							{cdrUrl || persistedTicket ? <DropdownMenuSeparator /> : null}
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={onDownloadPDF}
								disabled={isDownloadingPDF}
							>
								<Download className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">
									{isDownloadingPDF ? "Descargando..." : "Descargar PDF"}
								</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					{!isDraft && hasEmail && (
						<>
							<DropdownMenuItem
								className="cursor-pointer"
								onClick={onShowEmail}
							>
								<Mail className="mr-2 h-4 w-4" />
								<span className="font-bold text-xs uppercase">
									Enviar Email
								</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
						</>
					)}
					<DropdownMenuItem
						onClick={onShowDelete}
						className="cursor-pointer text-destructive focus:text-destructive"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						<span className="font-bold text-xs uppercase">Eliminar</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

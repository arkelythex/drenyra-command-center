import { MoreHorizontal } from "lucide-react";
import { Fragment } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildInvoiceMenuGroups } from "./invoice-card-menu";

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

function CustomerIdentity({
	customer,
	invoiceNumber,
}: Pick<InvoiceCardHeaderProps["invoice"], "customer" | "invoiceNumber">) {
	return (
		<div className="flex min-w-0 items-center gap-3">
			<div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
				{customer.logo ? (
					<img
						src={customer.logo}
						alt={customer.name}
						className="size-full object-cover"
					/>
				) : (
					<span
						aria-hidden="true"
						className="text-xs font-medium uppercase text-muted-foreground"
					>
						{customer.initials}
					</span>
				)}
			</div>
			<div className="min-w-0">
				<h4 className="truncate text-sm font-medium text-foreground">
					{customer.name}
				</h4>
				<p className="truncate font-mono text-xs text-muted-foreground">
					{invoiceNumber}
				</p>
			</div>
		</div>
	);
}

export function InvoiceCardHeader(props: InvoiceCardHeaderProps) {
	const { invoice } = props;
	const groups = buildInvoiceMenuGroups({
		status: invoice.status,
		hasCdr: Boolean(props.cdrUrl),
		hasTicket: Boolean(props.persistedTicket),
		hasEmail: Boolean(invoice.customer.email),
		isSendingToOse: props.isSendingToOse,
		isLoadingLifecycle: props.isLoadingLifecycle,
		isDownloadingPDF: props.isDownloadingPDF,
		on: {
			sendToOse: props.onSendToOse,
			loadLifecycle: props.onLoadLifecycle,
			edit: props.onShowEdit,
			openCdr: props.onOpenCdr,
			copyTicket: props.onCopyTicket,
			previewPDF: props.onShowPDFPreview,
			downloadPDF: props.onDownloadPDF,
			email: props.onShowEmail,
			remove: props.onShowDelete,
		},
	});

	return (
		<div className="mb-4 flex items-start justify-between gap-3">
			<CustomerIdentity
				customer={invoice.customer}
				invoiceNumber={invoice.invoiceNumber}
			/>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Más opciones"
						className="-m-1.5 size-11 text-muted-foreground hover:text-foreground"
						onClick={(event) => event.stopPropagation()}
					>
						<MoreHorizontal aria-hidden="true" size={16} />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-52">
					{groups.map((group, index) => (
						<Fragment key={group[0]?.id}>
							{index > 0 ? <DropdownMenuSeparator /> : null}
							{group.map(
								({
									id,
									label,
									icon: Icon,
									onSelect,
									disabled,
									destructive,
								}) => (
									<DropdownMenuItem
										key={id}
										onClick={onSelect}
										disabled={disabled}
										className={
											destructive
												? "min-h-11 cursor-pointer text-destructive focus:text-destructive"
												: "min-h-11 cursor-pointer"
										}
									>
										<Icon aria-hidden="true" className="mr-2 size-4" />
										<span className="text-sm">{label}</span>
									</DropdownMenuItem>
								),
							)}
						</Fragment>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

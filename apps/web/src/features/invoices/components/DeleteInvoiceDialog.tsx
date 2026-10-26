import type React from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteInvoice } from "../hooks/useDeleteInvoice";
import type { InvoiceStatus } from "../hooks/useInvoices";

interface DeleteInvoiceDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	invoice: {
		id: string;
		invoiceNumber: string;
		status: InvoiceStatus;
		customer: {
			name: string;
		};
	};
}

const STATUS_LABEL: Record<InvoiceStatus, string> = {
	draft: "borrador",
	sent: "enviada",
	overdue: "vencida",
	paid: "pagada",
};

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
	open,
	onOpenChange,
	invoice,
}) => {
	const { deleteInvoice, isDeleting } = useDeleteInvoice();

	// Only drafts can be deleted; an issued invoice is voided with a credit note.
	const canDelete = invoice.status === "draft";

	const handleDelete = () => {
		if (!canDelete) {
			return;
		}
		deleteInvoice(invoice.id, {
			onSuccess: () => {
				onOpenChange(false);
			},
		});
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="max-w-md border-border bg-background">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-lg font-semibold">
						{canDelete ? "¿Eliminar factura?" : "No se puede eliminar"}
					</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-2 text-sm text-muted-foreground">
							{canDelete ? (
								<>
									<p>
										Vas a eliminar la factura{" "}
										<strong className="font-medium text-foreground">
											{invoice.invoiceNumber}
										</strong>{" "}
										de{" "}
										<strong className="font-medium text-foreground">
											{invoice.customer.name}
										</strong>
										.
									</p>
									<p className="font-medium text-destructive">
										Esta acción no se puede deshacer.
									</p>
								</>
							) : (
								<>
									<p>
										Solo se pueden eliminar facturas en borrador. Esta factura
										está en estado {STATUS_LABEL[invoice.status]}.
									</p>
									<p>
										Para anular una factura emitida, crea una nota de crédito.
									</p>
								</>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting} className="h-11">
						{canDelete ? "Cancelar" : "Cerrar"}
					</AlertDialogCancel>
					{canDelete && (
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="h-11 bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isDeleting ? "Eliminando…" : "Eliminar"}
						</AlertDialogAction>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

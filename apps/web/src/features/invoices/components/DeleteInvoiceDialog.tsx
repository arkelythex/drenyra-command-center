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

export const DeleteInvoiceDialog: React.FC<DeleteInvoiceDialogProps> = ({
	open,
	onOpenChange,
	invoice,
}) => {
	const { deleteInvoice, isDeleting } = useDeleteInvoice();

	// Validar si se puede eliminar (solo DRAFT)
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
			<AlertDialogContent className="max-w-md border-border/50 bg-background">
				<AlertDialogHeader>
					<AlertDialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
						{canDelete ? (
							<>
								<span className="text-destructive">🗑️</span>
								<span>¿Eliminar Factura?</span>
							</>
						) : (
							<>
								<span className="text-warning">⚠️</span>
								<span>Acción No Permitida</span>
							</>
						)}
					</AlertDialogTitle>
					<AlertDialogDescription className="space-y-3 pt-2">
						{canDelete ? (
							<>
								<p className="text-sm text-foreground/80">
									Estás a punto de eliminar la factura{" "}
									<strong className="text-foreground font-bold">
										{invoice.invoiceNumber}
									</strong>{" "}
									del cliente{" "}
									<strong className="text-foreground font-bold">
										{invoice.customer.name}
									</strong>
									.
								</p>
								<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
									<p className="text-sm text-destructive font-semibold flex items-center gap-2">
										<span>⚠️</span>
										<span>Esta acción no se puede deshacer.</span>
									</p>
								</div>
							</>
						) : (
							<div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
								<p className="text-sm text-warning font-semibold mb-2">
									⚠️ No se puede eliminar esta factura
								</p>
								<p className="text-sm text-foreground/70">
									Solo se pueden eliminar facturas en estado{" "}
									<strong className="text-foreground">BORRADOR</strong>. Esta
									factura está en estado{" "}
									<strong className="text-foreground uppercase">
										{invoice.status}
									</strong>
									.
								</p>
								<p className="text-xs text-muted-foreground mt-2">
									Para anular una factura emitida, debe crear una Nota de
									Crédito.
								</p>
							</div>
						)}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						disabled={isDeleting}
						className="font-bold uppercase text-xs"
					>
						{canDelete ? "Cancelar" : "Cerrar"}
					</AlertDialogCancel>
					{canDelete && (
						<AlertDialogAction
							onClick={handleDelete}
							disabled={isDeleting}
							className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold uppercase text-xs"
						>
							{isDeleting ? (
								<>
									<span className="animate-spin mr-2">⏳</span>
									Eliminando...
								</>
							) : (
								"Eliminar"
							)}
						</AlertDialogAction>
					)}
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

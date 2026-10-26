import { lazy, Suspense } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CreateInvoicePayload } from "./types";

const InvoiceForm = lazy(async () => {
	const mod = await import("./InvoiceForm");
	return { default: mod.InvoiceForm };
});

interface CreateInvoiceModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: CreateInvoicePayload) => Promise<void>;
	companyId: string;
}

export const CreateInvoiceDialog = ({
	open,
	onOpenChange,
	onSubmit,
	companyId,
}: CreateInvoiceModalProps) => {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90dvh] max-w-3xl gap-0 overflow-y-auto border-border bg-background p-0">
				<DialogHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-4 text-left sm:px-6">
					<DialogTitle className="text-lg font-semibold">
						Nueva factura
					</DialogTitle>
					<DialogDescription className="text-sm text-muted-foreground">
						Factura o boleta electrónica. El IGV se calcula sobre el precio.
					</DialogDescription>
				</DialogHeader>

				<div className="px-4 pt-5 sm:px-6">
					<Suspense fallback={<CreateInvoiceFormSkeleton />}>
						<InvoiceForm
							onSubmit={onSubmit}
							onCancel={() => onOpenChange(false)}
							companyId={companyId}
						/>
					</Suspense>
				</div>
			</DialogContent>
		</Dialog>
	);
};

function CreateInvoiceFormSkeleton() {
	return (
		<div
			aria-label="Cargando formulario de factura"
			className="space-y-4"
			role="status"
		>
			<div className="h-11 rounded-lg bg-muted" />
			<div className="grid gap-4 sm:grid-cols-3">
				<div className="h-11 rounded-lg bg-muted" />
				<div className="h-11 rounded-lg bg-muted" />
				<div className="h-11 rounded-lg bg-muted" />
			</div>
			<div className="h-40 rounded-lg bg-muted" />
			<span className="sr-only">Cargando formulario de factura</span>
		</div>
	);
}

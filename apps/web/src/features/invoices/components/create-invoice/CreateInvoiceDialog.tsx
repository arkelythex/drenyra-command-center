import { FileText } from "lucide-react";
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
			<DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto border-border/50 bg-background/95 p-0 shadow-xl shadow-[0_0_18px_rgba(var(--premium-info-rgb),0.04)] ">
				<div className="sticky top-0 z-50 flex items-center gap-4 border-b border-border/50 bg-background/90 px-8 py-6 ">
					<div className="h-10 w-10 rounded-xl bg-[rgba(var(--premium-info-rgb),0.10)] flex items-center justify-center border border-[rgba(var(--premium-info-rgb),0.20)]">
						<FileText className="text-[var(--premium-action-cyan)]" size={20} />
					</div>
					<DialogHeader>
						<DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tighter flex flex-col">
							<span className="text-label text-muted-foreground tracking-[0.3em] font-medium mb-0.5">
								Módulo de Facturación
							</span>
							NUEVA FACTURA
						</DialogTitle>
						<DialogDescription className="sr-only">
							Formulario para crear una nueva factura electrónica.
						</DialogDescription>
					</DialogHeader>
				</div>

				<div className="p-8">
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
			className="mt-6 space-y-10"
			role="status"
		>
			<div className="grid grid-cols-12 gap-8">
				<div className="col-span-12 h-24 rounded-2xl border border-border/60 bg-card/60 lg:col-span-8" />
				<div className="col-span-12 h-24 rounded-2xl border border-border/60 bg-card/60 lg:col-span-4" />
			</div>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
				<div className="h-20 rounded-2xl border border-border/60 bg-card/60" />
				<div className="h-20 rounded-2xl border border-border/60 bg-card/60" />
				<div className="h-20 rounded-2xl border border-border/60 bg-card/60" />
			</div>
			<div className="h-44 rounded-2xl border border-border/60 bg-card/60" />
			<span className="sr-only">Cargando formulario de factura</span>
		</div>
	);
}

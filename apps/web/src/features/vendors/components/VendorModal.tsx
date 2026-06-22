import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CreateVendorDTO, Vendor } from "@/lib/schemas/vendor.schema";
import { useCreateVendor, useUpdateVendor } from "../hooks/useVendors";
import { VendorForm } from "./VendorForm";

interface VendorModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	vendor?: Vendor | null;
	mode: "create" | "edit";
}

export const VendorModal = ({
	open,
	onOpenChange,
	vendor,
	mode,
}: VendorModalProps) => {
	const { mutate: createVendor, isPending: isCreating } = useCreateVendor();
	const { mutate: updateVendor, isPending: isUpdating } = useUpdateVendor();

	const isLoading = isCreating || isUpdating;

	const handleSubmit = (data: CreateVendorDTO) => {
		if (mode === "create") {
			createVendor(data, { onSuccess: () => onOpenChange(false) });
		} else if (vendor?.id) {
			updateVendor(
				{ id: vendor.id, data },
				{ onSuccess: () => onOpenChange(false) },
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-soft border-border">
				<DialogHeader>
					<DialogTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
						{mode === "create" ? "NUEVO PROVEEDOR" : "EDITAR PROVEEDOR"}
					</DialogTitle>
					{mode === "edit" && vendor && (
						<p className="text-xs text-muted-foreground font-mono mt-1">
							RUC: {vendor.taxId}
						</p>
					)}
				</DialogHeader>
				<div className="mt-4">
					<VendorForm
						defaultValues={vendor || undefined}
						onSubmit={handleSubmit}
						isLoading={isLoading}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

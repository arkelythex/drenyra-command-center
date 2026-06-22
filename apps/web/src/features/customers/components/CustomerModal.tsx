import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog";
import type { CreateCustomerDTO } from "../../../lib/schemas/customer.schema";
import {
	type Customer,
	useCreateCustomer,
	useUpdateCustomer,
} from "../hooks/useCustomers";
import { CustomerForm } from "./CustomerForm";

interface CustomerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	customer?: Customer | null;
	mode: "create" | "edit";
}

export const CustomerModal = ({
	open,
	onOpenChange,
	customer,
	mode,
}: CustomerModalProps) => {
	const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();
	const { mutate: updateCustomer, isPending: isUpdating } = useUpdateCustomer();

	const isLoading = isCreating || isUpdating;

	const resolvedDefaultValues = customer
		? {
				companyId: customer.companyId,
				taxId: customer.taxId,
				legalName: customer.legalName,
				tradeName: customer.tradeName,
				address: customer.address,
				email: customer.email,
				phone: customer.phone,
				creditLimit: customer.creditLimit,
				creditDays: customer.creditDays,
				status: customer.status,
			}
		: undefined;

	const handleSubmit = (data: CreateCustomerDTO) => {
		if (mode === "create") {
			createCustomer(data, {
				onSuccess: () => {
					onOpenChange(false);
				},
			});
		} else if (customer) {
			updateCustomer(
				{ id: customer.id, data },
				{
					onSuccess: () => {
						onOpenChange(false);
					},
				},
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-surface-soft border-border">
				<DialogHeader>
					<DialogTitle className="text-2xl font-black text-foreground tracking-tight uppercase">
						{mode === "create" ? "NUEVO CLIENTE" : "EDITAR CLIENTE"}
					</DialogTitle>
					{mode === "edit" && customer && (
						<p className="text-xs text-muted-foreground font-mono mt-1">
							RUC: {customer.taxId}
						</p>
					)}
				</DialogHeader>

				<div className="mt-4">
					<CustomerForm
						defaultValues={resolvedDefaultValues}
						onSubmit={handleSubmit}
						isLoading={isLoading}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
};

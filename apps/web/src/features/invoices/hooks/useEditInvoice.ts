import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invoicingApi, type UpdateInvoicePayload } from "../api/invoicing.api";
import { invoiceKeys } from "../api/query-keys";

interface EditInvoiceParams {
	id: string;
	data: UpdateInvoicePayload;
}

export const useEditInvoice = () => {
	const queryClient = useQueryClient();

	const editInvoice = useMutation({
		mutationFn: async ({ id, data }: EditInvoiceParams) => {
			return invoicingApi.update(id, data);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
			toast.success("✅ Factura actualizada correctamente");
		},
		onError: (error: Error) => {
			toast.error(`❌ ${error.message}`);
		},
	});

	return {
		editInvoice: editInvoice.mutate,
		isEditing: editInvoice.isPending,
	};
};

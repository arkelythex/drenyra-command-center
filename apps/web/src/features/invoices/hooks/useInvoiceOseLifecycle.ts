import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { presentError } from "@/lib/error-messages";
import {
	type InvoiceOseLifecycle,
	invoicingApi,
} from "../api/invoicing.api";

export function useInvoiceOseLifecycle() {
	return useMutation<InvoiceOseLifecycle, Error, string>({
		mutationFn: async (invoiceId: string) =>
			invoicingApi.getOseLifecycleByInvoice(invoiceId),
		onSuccess: (result) => {
			toast.success("Trazabilidad OSE actualizada", {
				description: `${result.currentStatus} · ${result.transactionId}`,
			});
		},
		onError: (error: Error) => {
			const presentation = presentError(
				error,
				"No se pudo cargar la trazabilidad OSE",
			);
			toast.error(presentation.title, {
				description: presentation.description,
			});
		},
	});
}

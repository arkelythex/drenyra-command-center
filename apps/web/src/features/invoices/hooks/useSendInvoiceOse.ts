import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { presentError } from "@/lib/error-messages";
import { invoicingApi } from "../api/invoicing.api";
import { invoiceKeys } from "../api/query-keys";

export interface SendInvoiceOseResult {
	invoiceId: string;
	transactionId: string;
	oseStatus: string;
	sunatCode?: string;
	sunatMessage?: string;
	processingTime?: number;
}

export function useSendInvoiceOse() {
	const queryClient = useQueryClient();

	return useMutation<SendInvoiceOseResult, Error, string>({
		mutationFn: async (invoiceId: string) =>
			invoicingApi.sendOSE(invoiceId) as Promise<SendInvoiceOseResult>,
		onSuccess: (result) => {
			queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
			toast.success("Factura enviada a OSE", {
				description: `OSE ${result.oseStatus} · Ticket ${result.transactionId}`,
			});
		},
		onError: (error: Error) => {
			const presentation = presentError(error, "No se pudo enviar a OSE");
			toast.error(presentation.title, {
				description: presentation.description,
			});
		},
	});
}

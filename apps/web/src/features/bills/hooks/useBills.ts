import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { presentError } from "@/lib/error-messages";
import { runtimeConfig } from "@/lib/runtime-config";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import {
	BILLS_STALE_TIME_MS,
	STATUS_TRANSITIONS,
	SUCCESS_MESSAGES,
} from "./use-bills.constants";
import { MOCK_BILLS } from "./use-bills.mock-data";
import { fetchBills } from "./use-bills.query";
import { getColumnTotals, groupBillsByStatus } from "./use-bills.selectors";
import type { Bill, BillStatus, BillsView } from "./use-bills.types";
import { persistBillStatusTransition } from "./use-bills.workflow";

export type {
	Bill,
	BillApprovalState,
	BillStatus,
	BillWorkflowEvent,
} from "./use-bills.types";

interface UpdateBillStatusPayload {
	billId: string;
	nextStatus: BillStatus;
	currentBill: Bill;
}

interface BillsMutationContext {
	previousBills?: Bill[];
}

function updateBillInCache(
	previous: Bill[] | undefined,
	billId: string,
	nextStatus: BillStatus,
): Bill[] | undefined {
	if (!previous) return previous;

	return previous.map((bill) =>
		bill.id === billId
			? {
					...bill,
					status: nextStatus,
					paidDate:
						nextStatus === "paid" ? new Date().toISOString() : bill.paidDate,
				}
			: bill,
	);
}

export const useBills = () => {
	const [activeView, setActiveView] = useState<BillsView>("summary");
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const queryClient = useQueryClient();
	const billsQueryKey = ["bills", companyId] as const;

	const { data, isLoading, error } = useQuery({
		queryKey: billsQueryKey,
		queryFn: () => fetchBills(companyId),
		staleTime: BILLS_STALE_TIME_MS,
	});

	const bills = data ?? MOCK_BILLS;

	const billsByStatus = useMemo(() => groupBillsByStatus(bills), [bills]);
	const columnTotals = useMemo(
		() => getColumnTotals(billsByStatus),
		[billsByStatus],
	);

	const updateStatusMutation = useMutation<
		void,
		Error,
		UpdateBillStatusPayload,
		BillsMutationContext
	>({
		mutationFn: persistBillStatusTransition,
		onMutate: async ({ billId, nextStatus }) => {
			await queryClient.cancelQueries({ queryKey: billsQueryKey });
			const previousBills = queryClient.getQueryData<Bill[]>(billsQueryKey);

			queryClient.setQueryData<Bill[]>(billsQueryKey, (oldBills) =>
				updateBillInCache(oldBills, billId, nextStatus),
			);

			return { previousBills };
		},
		onError: (mutationError, _variables, context) => {
			if (context?.previousBills) {
				queryClient.setQueryData(billsQueryKey, context.previousBills);
			}
			const presentation = presentError(
				mutationError,
				"No se pudo actualizar la factura de compra",
			);
			toast.error(presentation.title, {
				description: presentation.description,
			});
		},
		onSuccess: (_, { nextStatus }) => {
			const message = SUCCESS_MESSAGES[nextStatus];
			if (message) toast.success(message);
		},
		onSettled: () => {
			if (!runtimeConfig.mockMode) {
				queryClient.invalidateQueries({ queryKey: billsQueryKey });
			}
		},
	});

	const updateBillStatus = useCallback(
		(billId: string, nextStatus: BillStatus) => {
			const currentBill = bills.find((bill) => bill.id === billId);
			if (!currentBill) return;

			const allowedTransitions = STATUS_TRANSITIONS[currentBill.status];
			if (!allowedTransitions.includes(nextStatus)) {
				toast.error("La transición de estado no está permitida", {
					description: `No puedes mover la factura de compra de ${currentBill.status} a ${nextStatus}.`,
				});
				return;
			}

			updateStatusMutation.mutate({ billId, nextStatus, currentBill });
		},
		[bills, updateStatusMutation],
	);

	const pendingBillId = updateStatusMutation.isPending
		? updateStatusMutation.variables?.billId
		: undefined;

	return {
		billsByStatus,
		columnTotals,
		activeView,
		setActiveView,
		updateBillStatus,
		pendingBillId,
		isLoading,
		error,
	};
};

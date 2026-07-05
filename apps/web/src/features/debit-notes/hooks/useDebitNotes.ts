import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCrudHooks } from "@/lib/crud-api";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { debitNotesApi } from "../api/debit-notes.api";
import { debitNoteKeys } from "../api/query-keys";
import type { CreateDebitNotePayload, DebitNoteRecord } from "../types";

export const dnHooks = createCrudHooks<
	DebitNoteRecord,
	CreateDebitNotePayload,
	{ status: string }
>({
	key: "debit-notes",
	list: (companyId) => debitNotesApi.list({ companyId }),
	getById: (id) => debitNotesApi.getById(id) as Promise<DebitNoteRecord>,
	create: (companyId, data) =>
		debitNotesApi.create({ ...data, companyId }) as Promise<DebitNoteRecord>,
	update: (id, data) =>
		debitNotesApi.updateStatus(id, data.status) as Promise<DebitNoteRecord>,
	delete: async (id) => {
		await debitNotesApi.delete(id);
	},
});

export const useCreateDebitNote = dnHooks.useCreate;
export const useUpdateDebitNoteStatus = dnHooks.useUpdate;
export const useDeleteDebitNote = dnHooks.useDelete;

interface DebitNoteStats {
	total: number;
	draftCount: number;
	sentCount: number;
	acceptedCount: number;
	rejectedCount: number;
	totalAmount: number;
}

interface UseDebitNotesResult {
	debitNotes: DebitNoteRecord[];
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
	searchQuery: string;
	setSearchQuery: (value: string) => void;
	stats: DebitNoteStats;
	summary: unknown;
	createDebitNote: ReturnType<typeof useCreateDebitNote>["mutateAsync"];
	updateStatus: (args: { id: string; status: string }) => void;
	deleteDebitNote: ReturnType<typeof useDeleteDebitNote>["mutate"];
	sendOse: ReturnType<typeof useSendDebitNoteOse>["mutate"];
	refetch: () => Promise<unknown>;
}

function normalizeStats(debitNotes: DebitNoteRecord[]): DebitNoteStats {
	const total = debitNotes.length;
	const draftCount = debitNotes.filter((dn) => dn.status === "DRAFT").length;
	const sentCount = debitNotes.filter((dn) => dn.status === "SENT").length;
	const acceptedCount = debitNotes.filter(
		(dn) => dn.status === "ACCEPTED",
	).length;
	const rejectedCount = debitNotes.filter(
		(dn) => dn.status === "REJECTED",
	).length;
	const totalAmount = debitNotes.reduce(
		(sum, dn) => sum + (Number.parseFloat(dn.totalAmount) || 0),
		0,
	);

	return {
		total,
		draftCount,
		sentCount,
		acceptedCount,
		rejectedCount,
		totalAmount,
	};
}

export function useSendDebitNoteOse() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (id: string) => {
			return debitNotesApi.sendOse(id);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: debitNoteKeys.all });
			toast.success("Nota de débito enviada a SUNAT");
		},
		onError: (error: Error) => {
			toast.error(`Error al enviar a SUNAT: ${error.message}`);
		},
	});
}

export function useDebitNotes(): UseDebitNotesResult {
	const { companyContext } = useActiveCompanyContext();
	const companyId = companyContext.companyId;
	const [searchQuery, setSearchQuery] = useState("");

	const query = useQuery({
		queryKey: debitNoteKeys.list(companyId),
		queryFn: () => debitNotesApi.list({ companyId }),
	});

	const summary = useQuery({
		queryKey: debitNoteKeys.summary(companyId),
		queryFn: () => debitNotesApi.getSummary(companyId),
	});

	const debitNotes = useMemo(() => {
		const list = Array.isArray(query.data) ? query.data : [];
		if (!searchQuery) return list;

		const search = searchQuery.toLowerCase();
		return list.filter(
			(dn) =>
				dn.fullNumber?.toLowerCase().includes(search) ||
				dn.reason?.toLowerCase().includes(search) ||
				dn.referenceInvoiceId?.toLowerCase().includes(search),
		);
	}, [query.data, searchQuery]);

	const stats = useMemo(() => {
		const list = Array.isArray(query.data) ? query.data : [];
		return normalizeStats(list);
	}, [query.data]);

	const createDebitNote = useCreateDebitNote().mutateAsync;
	const { mutate: rawUpdateStatus } = useUpdateDebitNoteStatus();
	const updateStatus = (args: { id: string; status: string }) =>
		rawUpdateStatus({ id: args.id, data: { status: args.status } });
	const deleteDebitNote = useDeleteDebitNote().mutate;
	const sendOse = useSendDebitNoteOse().mutate;

	return {
		debitNotes,
		isLoading: query.isLoading,
		isError: query.isError,
		error: query.error,
		searchQuery,
		setSearchQuery,
		stats,
		summary: summary.data,
		createDebitNote,
		updateStatus,
		deleteDebitNote,
		sendOse,
		refetch: query.refetch,
	};
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createCrudHooks } from "@/lib/crud-api";
import { useActiveCompanyContext } from "@/lib/use-active-company-context";
import { creditNotesApi } from "../api/credit-notes.api";
import { creditNoteKeys } from "../api/query-keys";
import type { CreateCreditNotePayload, CreditNoteRecord } from "../types";

export const cnHooks = createCrudHooks<CreditNoteRecord, CreateCreditNotePayload, { status: string }>({
  key: "credit-notes",
  list: (companyId) => creditNotesApi.list({ companyId }),
  getById: (id) => creditNotesApi.getById(id) as Promise<CreditNoteRecord>,
  create: (companyId, data) => creditNotesApi.create({ ...data, companyId }) as Promise<CreditNoteRecord>,
  update: (id, data) => creditNotesApi.updateStatus(id, data.status) as Promise<CreditNoteRecord>,
  delete: async (id) => { await creditNotesApi.delete(id); },
});

export const useCreateCreditNote = cnHooks.useCreate;
export const useUpdateCreditNoteStatus = cnHooks.useUpdate;
export const useDeleteCreditNote = cnHooks.useDelete;

interface CreditNoteStats {
  total: number;
  anulacionCount: number;
  descuentoCount: number;
  devolucionCount: number;
  otrosCount: number;
  draftCount: number;
  sentCount: number;
  acceptedCount: number;
  rejectedCount: number;
  totalAmount: number;
}

interface UseCreditNotesResult {
  creditNotes: CreditNoteRecord[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  stats: CreditNoteStats;
  summary: unknown;
  createCreditNote: ReturnType<typeof useCreateCreditNote>["mutateAsync"];
  updateStatus: (args: { id: string; status: string }) => void;
  deleteCreditNote: ReturnType<typeof useDeleteCreditNote>["mutate"];
  sendOse: ReturnType<typeof useSendCreditNoteOse>["mutate"];
  refetch: () => Promise<unknown>;
}

function normalizeStats(creditNotes: CreditNoteRecord[]): CreditNoteStats {
  const total = creditNotes.length;
  const anulacionCount = creditNotes.filter((cn) => cn.creditNoteType === 'ANULACION').length;
  const descuentoCount = creditNotes.filter((cn) => cn.creditNoteType === 'DESCUENTO').length;
  const devolucionCount = creditNotes.filter((cn) => cn.creditNoteType === 'DEVOLUCION').length;
  const otrosCount = creditNotes.filter((cn) => cn.creditNoteType === 'OTROS').length;
  const draftCount = creditNotes.filter((cn) => cn.status === 'DRAFT').length;
  const sentCount = creditNotes.filter((cn) => cn.status === 'SENT').length;
  const acceptedCount = creditNotes.filter((cn) => cn.status === 'ACCEPTED').length;
  const rejectedCount = creditNotes.filter((cn) => cn.status === 'REJECTED').length;
  const totalAmount = creditNotes.reduce((sum, cn) => sum + (Number.parseFloat(cn.totalAmount) || 0), 0);

  return {
    total, anulacionCount, descuentoCount, devolucionCount, otrosCount,
    draftCount, sentCount, acceptedCount, rejectedCount, totalAmount,
  };
}

export function useSendCreditNoteOse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return creditNotesApi.sendOse(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
      toast.success("Nota de crédito enviada a SUNAT");
    },
    onError: (error: Error) => {
      toast.error(`Error al enviar a SUNAT: ${error.message}`);
    },
  });
}

export function useCreditNotes(): UseCreditNotesResult {
  const { companyContext } = useActiveCompanyContext();
  const companyId = companyContext.companyId;
  const [searchQuery, setSearchQuery] = useState("");

  const query = useQuery({
    queryKey: creditNoteKeys.list(companyId),
    queryFn: () => creditNotesApi.list({ companyId }),
  });

  const summary = useQuery({
    queryKey: creditNoteKeys.summary(companyId),
    queryFn: () => creditNotesApi.getSummary(companyId),
  });

  const creditNotes = useMemo(() => {
    const list = Array.isArray(query.data) ? query.data : [];
    if (!searchQuery) return list;

    const search = searchQuery.toLowerCase();
    return list.filter(
      (cn) =>
        cn.fullNumber?.toLowerCase().includes(search) ||
        cn.reason?.toLowerCase().includes(search) ||
        cn.referenceInvoiceId?.toLowerCase().includes(search),
    );
  }, [query.data, searchQuery]);

  const stats = useMemo(() => {
    const list = Array.isArray(query.data) ? query.data : [];
    return normalizeStats(list);
  }, [query.data]);

  const createCreditNote = useCreateCreditNote().mutateAsync;
  const { mutate: rawUpdateStatus } = useUpdateCreditNoteStatus();
  const updateStatus = (args: { id: string; status: string }) => rawUpdateStatus({ id: args.id, data: { status: args.status } });
  const deleteCreditNote = useDeleteCreditNote().mutate;
  const sendOse = useSendCreditNoteOse().mutate;

  return {
    creditNotes,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    searchQuery,
    setSearchQuery,
    stats,
    summary: summary.data,
    createCreditNote,
    updateStatus,
    deleteCreditNote,
    sendOse,
    refetch: query.refetch,
  };
}

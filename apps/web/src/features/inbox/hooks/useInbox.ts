import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { captureError, trackEvent } from '@/lib/monitoring';
import { useActiveCompanyContext } from '@/lib/use-active-company-context';
import { HttpClientError } from '@/lib/http-client';
import { inboxApi } from '../api/inbox.api';
import { inboxKeys } from '../inbox.query-keys';
import { inboxTransactionsQueryOptions } from '../inbox.query-options';
import type { InboxTransaction } from '../inbox.types';

export type InboxTab = 'asignados' | 'siguiendo' | 'abiertos' | 'cerrados' | 'Por Validar' | 'Observados' | 'Inconsistentes' | 'Conciliados';
export type Transaction = InboxTransaction;

export const useInbox = () => {
  const { companyContext } = useActiveCompanyContext();
  const companyId = companyContext.companyId;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<InboxTab>('Por Validar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Transaction['status']>>({});

  const {
    data: transactions = [],
    refetch,
    isFetching,
  } = useQuery(
    inboxTransactionsQueryOptions({
      companyId,
      type: 'EXPENSE',
      status: 'DRAFT',
    }),
  );

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      await inboxApi.uploadDocument(file);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inboxKeys.byCompany(companyId) });
    },
  });

  const uploadFile = async (file: File) => {
    try {
      await uploadMutation.mutateAsync(file);
      trackEvent('inbox_upload_requested', {
        file_name: file.name,
        file_size_bytes: file.size,
        file_type: file.type || 'unknown',
      });
      return { success: true as const };
    } catch (error) {
      captureError(error instanceof Error ? error : new Error('Inbox upload failed'), {
        fileName: file.name,
        source: 'features/inbox/useInbox.uploadFile',
      });
      if (error instanceof HttpClientError && error.status && error.status >= 400 && error.status < 500) {
        return { success: false as const, error: error.message };
      }
      return { success: false as const, error: 'Network error' };
    }
  };

  const transactionsWithOverrides = useMemo(
    () =>
      transactions.map((transaction) =>
        statusOverrides[transaction.id]
          ? { ...transaction, status: statusOverrides[transaction.id] }
          : transaction,
      ),
    [transactions, statusOverrides],
  );

  const filteredTransactions = useMemo(
    () =>
      transactionsWithOverrides.filter((transaction) => {
        if (searchQuery && !transaction.vendor.toLowerCase().includes(searchQuery.toLowerCase())) return false;

        if (activeTab === 'Por Validar') return transaction.status === 'pending';
        if (activeTab === 'Conciliados' || activeTab === 'cerrados') {
          return transaction.status === 'closed' || transaction.status === 'confirmed';
        }
        if (activeTab === 'Observados' || activeTab === 'Inconsistentes' || activeTab === 'siguiendo') {
          return transaction.status === 'watching';
        }

        return true;
      }),
    [activeTab, searchQuery, transactionsWithOverrides],
  );

  const handleConfirm = useCallback((id: string) => {
    setStatusOverrides((previous) => ({ ...previous, [id]: 'closed' }));
  }, []);

  const handleWatch = useCallback((id: string) => {
    setStatusOverrides((previous) => ({ ...previous, [id]: 'watching' }));
  }, []);

  return {
    activeTab,
    setActiveTab,
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    handleConfirm,
    handleWatch,
    totalCount: transactions.length,
    uploadFile,
    refresh: refetch,
    loading: isFetching || uploadMutation.isPending,
  };
};

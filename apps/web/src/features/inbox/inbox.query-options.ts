import { queryOptions } from '@tanstack/react-query';
import { captureError } from '@/lib/monitoring';
import { HttpClientError } from '@/lib/http-client';
import { runtimeConfig } from '@/lib/runtime-config';
import { inboxApi } from './api/inbox.api';
import { inboxKeys } from './inbox.query-keys';
import type { InboxQueryFilters, InboxTransaction, InboxTransactionRecord } from './inbox.types';

export const STATIC_DOCUMENTS: InboxTransaction[] = [
  {
    id: 'mock-1',
    vendor: 'AMAZON WEB SERVICES',
    amount: 450.2,
    date: '15 Ene 2026',
    suggestedCategory: 'Servicios Cloud',
    suggestedCode: '6311',
    isAiSuggestion: true,
    status: 'confirmed',
    documentName: 'AWS-Invoice-jan.pdf',
  },
  {
    id: 'mock-2',
    vendor: 'NETFLIX INC.',
    amount: 45.9,
    date: '14 Ene 2026',
    suggestedCategory: 'Suscripciones',
    suggestedCode: '6599',
    isAiSuggestion: true,
    status: 'confirmed',
    documentName: 'NFLX-001292.pdf',
  },
  {
    id: 'mock-3',
    vendor: 'UBER B.V.',
    amount: 24.5,
    date: '12 Ene 2026',
    suggestedCategory: 'Movilidad',
    suggestedCode: '6321',
    isAiSuggestion: true,
    status: 'pending',
    documentName: 'Trip-receipt.pdf',
  },
];

function formatInboxDate(value?: string | null): string {
  if (!value) {
    return new Date().toLocaleDateString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString();
}

export function mapInboxRecordToTransaction(
  item: InboxTransactionRecord,
): InboxTransaction {
  return {
    id: item.id,
    vendor: item.partner?.legalName || item.notes || 'Proveedor Desconocido',
    amount: Number(item.totalAmount ?? 0),
    date: formatInboxDate(item.issueDate),
    suggestedCategory: 'Por clasificar',
    suggestedCode: '---',
    isAiSuggestion: false,
    status: 'pending',
    documentName: item.xmlUrl || undefined,
  };
}

export function inboxTransactionsQueryOptions(filters: InboxQueryFilters) {
  return queryOptions({
    queryKey: inboxKeys.list(filters.companyId, {
      type: filters.type,
      partnerId: filters.partnerId,
      status: filters.status,
    }),
    queryFn: async () => {
      if (runtimeConfig.mockMode) {
        return STATIC_DOCUMENTS;
      }

      try {
        const items = await inboxApi.listTransactions(filters);
        return [...items.map(mapInboxRecordToTransaction), ...STATIC_DOCUMENTS];
      } catch (error) {
        if (
          error instanceof HttpClientError &&
          (error.status === 404 || error.status === 405 || error.status === 501)
        ) {
          return STATIC_DOCUMENTS;
        }

        captureError(
          error instanceof Error ? error : new Error('Failed to fetch inbox transactions'),
          {
            companyId: filters.companyId,
            source: 'features/inbox/inboxTransactionsQueryOptions',
          },
        );

        return STATIC_DOCUMENTS;
      }
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

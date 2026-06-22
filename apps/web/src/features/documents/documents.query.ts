import { queryOptions } from '@tanstack/react-query'
import type { Document } from './types/document.types'

const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    name: 'FAC-001-4421.pdf',
    type: 'PDF',
    category: 'FACTURA (01)',
    ruc: '20100130201',
    series: 'F001',
    size: '1.2 MB',
    date: '2026-06-15',
    amount: 15420.5,
    status: 'linked',
    hasCDR: true,
    thumbnailColor: 'bg-[var(--premium-success)]',
  },
  {
    id: 'doc-2',
    name: 'FAC-001-4422.xml',
    type: 'XML',
    category: 'FACTURA (01)',
    ruc: '20556214899',
    series: 'F001',
    size: '45 KB',
    date: '2026-06-14',
    amount: 2350.0,
    status: 'unlinked',
    hasCDR: false,
    thumbnailColor: 'bg-[var(--premium-action-blue)]',
  },
  {
    id: 'doc-3',
    name: 'BOL-003-1120.pdf',
    type: 'PDF',
    category: 'BOLETA (03)',
    ruc: '10445566771',
    series: 'B003',
    size: '890 KB',
    date: '2026-06-10',
    amount: 120.0,
    status: 'linked',
    hasCDR: true,
    thumbnailColor: 'bg-amber-500',
  },
  {
    id: 'doc-4',
    name: 'FAC-E01-9921.pdf',
    type: 'PDF',
    category: 'FACTURA (01)',
    ruc: '20100130201',
    series: 'E001',
    size: '2.4 MB',
    date: '2026-06-08',
    amount: 5432.1,
    status: 'linked',
    hasCDR: true,
    thumbnailColor: 'bg-[var(--premium-success)]',
  },
]

export const documentsKeys = {
  all: ['documents'] as const,
  byCompany: (companyId: string) => [...documentsKeys.all, companyId] as const,
}

export function getCompanyScopedDocuments(companyId: string): Document[] {
  return MOCK_DOCUMENTS.map((document) => ({
    ...document,
    id: `${companyId}:${document.id}`,
  }))
}

export function documentsQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: documentsKeys.byCompany(companyId),
    queryFn: async () => getCompanyScopedDocuments(companyId),
    staleTime: 60_000,
  })
}

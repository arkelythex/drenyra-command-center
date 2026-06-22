import { queryOptions } from '@tanstack/react-query'
import { creditNotesApi, type CreditNoteListFilters } from './credit-notes.api'
import { creditNoteKeys } from './query-keys'

export function creditNotesListQueryOptions(filters: CreditNoteListFilters) {
  return queryOptions({
    queryKey: creditNoteKeys.list(filters.companyId),
    queryFn: () => creditNotesApi.list(filters),
  })
}

export function creditNoteDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: creditNoteKeys.detail(id),
    queryFn: () => creditNotesApi.getById(id),
  })
}

export function creditNotesSummaryQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: creditNoteKeys.summary(companyId),
    queryFn: () => creditNotesApi.getSummary(companyId),
  })
}

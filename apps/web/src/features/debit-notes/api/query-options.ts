import { queryOptions } from '@tanstack/react-query'
import { debitNotesApi, type DebitNoteListFilters } from './debit-notes.api'
import { debitNoteKeys } from './query-keys'

export function debitNotesListQueryOptions(filters: DebitNoteListFilters) {
  return queryOptions({
    queryKey: debitNoteKeys.list(filters.companyId),
    queryFn: () => debitNotesApi.list(filters),
  })
}

export function debitNoteDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: debitNoteKeys.detail(id),
    queryFn: () => debitNotesApi.getById(id),
  })
}

export function debitNotesSummaryQueryOptions(companyId: string) {
  return queryOptions({
    queryKey: debitNoteKeys.summary(companyId),
    queryFn: () => debitNotesApi.getSummary(companyId),
  })
}

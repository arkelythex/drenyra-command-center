import { queryOptions } from '@tanstack/react-query'
import { readAuthSessionSnapshot } from './auth-session-snapshot'

export const authSessionKeys = {
  all: ['auth', 'session'] as const,
}

export function authSessionQueryOptions() {
  return queryOptions({
    queryKey: authSessionKeys.all,
    queryFn: readAuthSessionSnapshot,
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  })
}

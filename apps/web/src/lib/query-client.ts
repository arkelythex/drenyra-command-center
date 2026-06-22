import { QueryClient } from '@tanstack/react-query'
import { getHttpStatusCode } from './http-client'

let appQueryClient: QueryClient | null = null

export function createAppQueryClient(): QueryClient {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount, error) => {
          const status = getHttpStatusCode(error)
          if (typeof status === 'number' && status < 500) {
            return false
          }
          return failureCount < 2
        },
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
      },
      mutations: {
        retry: 1,
      },
    },
  })

  appQueryClient = queryClient
  return queryClient
}

export function getAppQueryClient(): QueryClient | null {
  return appQueryClient
}

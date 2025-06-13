'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Automatisches Refetching alle 30 Sekunden für Echtzeitdaten
            refetchInterval: 30000,
            // Refetch wenn das Fenster wieder fokussiert wird
            refetchOnWindowFocus: true,
            // Retry bei Fehlern
            retry: 3,
            // Stale time für bessere Performance
            staleTime: 10000, // 10 Sekunden
          },
          mutations: {
            // Retry bei Mutations
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 
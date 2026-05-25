'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Toaster } from 'sonner'
import AuthSyncGate from './AuthSyncGate'

const ReactQueryDevtools =
  process.env.NODE_ENV === 'development'
    ? dynamic(
        () =>
          import('@tanstack/react-query-devtools').then((m) => m.ReactQueryDevtools),
        { ssr: false }
      )
    : () => null

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSyncGate>{children}</AuthSyncGate>
      <Toaster position="top-center" richColors closeButton />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

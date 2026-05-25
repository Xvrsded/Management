declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  }
}

declare module '@tanstack/react-query-devtools' {
  import * as React from 'react'
  export interface DevtoolsOptions {
    initialIsOpen?: boolean
    panelPosition?: 'top' | 'bottom' | 'left' | 'right'
  }
  export const ReactQueryDevtools: React.ComponentType<DevtoolsOptions>
}

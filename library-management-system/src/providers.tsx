'use client'

import { ThemeProvider } from '@/providers/theme-provider'
import { QueryProvider } from '@/providers/query-provider'
import { SessionProvider } from 'next-auth/react'
import { FileUploadProvider } from '@/providers/file-upload-provider'
import { Toaster } from '@/components/ui/toaster'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FileUploadProvider>
            {children}
            <Toaster />
          </FileUploadProvider>
        </ThemeProvider>
      </QueryProvider>
    </SessionProvider>
  )
}

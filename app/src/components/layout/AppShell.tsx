import type { ReactNode } from 'react'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { SearchProvider } from '@/components/command-menu'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Topbar } from '@/components/layout/Topbar'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const defaultOpen =
    typeof document === 'undefined' ||
    document.cookie
      .split(';')
      .find((valor) => valor.trim().startsWith('sidebar_state='))
      ?.split('=')[1] !== 'false'

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SearchProvider>
        <AppSidebar />
        <SidebarInset className="min-h-svh">
          <Topbar />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SearchProvider>
    </SidebarProvider>
  )
}

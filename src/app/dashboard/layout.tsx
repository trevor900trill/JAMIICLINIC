
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'
import { ClinicProvider } from '@/context/clinic-context'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <ClinicProvider>
        <div className="flex h-screen bg-muted/40">
          <SidebarNav />
          <div className="flex flex-col flex-1 sm:pl-14 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </main>
          </div>
        </div>
      </ClinicProvider>
  )
}

"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <div className="flex h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:pl-14 h-full overflow-hidden">
          <header className="sm:pt-6">
            <Header />
          </header>
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 sm:pt-4">
            <div className="grid gap-4 md:gap-8">
                {children}
            </div>
          </main>
        </div>
      </div>
  )
}

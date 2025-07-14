
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <div className="flex h-screen bg-muted/40 overflow-hidden">
        <SidebarNav />
        <div className="flex flex-col flex-1 sm:pl-14">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
  )
}

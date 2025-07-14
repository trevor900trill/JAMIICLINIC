
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <div className="flex h-screen w-full bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col flex-1 w-full">
          <Header />
          <main className="flex-1 p-4 sm:p-6 sm:pl-14 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
  )
}

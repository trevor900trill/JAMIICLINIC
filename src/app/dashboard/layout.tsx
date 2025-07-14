
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:pl-14">
          <Header />
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            <div className="grid gap-4 md:gap-8">
                {children}
            </div>
          </main>
        </div>
      </div>
  )
}

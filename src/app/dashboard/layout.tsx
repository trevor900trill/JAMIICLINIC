
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
      <div className="flex h-screen w-full bg-muted/40 overflow-hidden">
        <SidebarNav />
        <div className="flex flex-col flex-1 w-full">
          <Header />
          <main className="flex-1 overflow-y-auto overflow-x-hidden sm:pl-14">
            <div className="p-4 sm:p-6">
                {children}
            </div>
          </main>
        </div>
      </div>
  )
}

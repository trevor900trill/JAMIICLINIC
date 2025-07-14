"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'
import { useAuth } from '@/context/auth-context'

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user } = useAuth();
  
  const needsOnboarding = user?.reset_initial_password || 
                          (user?.role === 'doctor' && (!user.specialty_set || !user.clinic_created));

  if (needsOnboarding) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="flex flex-1 items-center justify-center">
          {children}
        </main>
      </div>
    )
  }

  return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <SidebarNav />
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            {children}
          </main>
        </div>
      </div>
  )
}

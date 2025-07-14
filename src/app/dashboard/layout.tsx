
"use client"
import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'
import { useAuth } from '@/context/auth-context'
import { usePathname } from 'next/navigation'

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const isOnboardingRoute = [
    '/dashboard/change-password',
    '/dashboard/set-specialty',
    '/onboarding/create-clinic',
    '/onboarding/create-staff'
  ].includes(pathname);

  if (isOnboardingRoute) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="flex flex-1 items-center justify-center p-4 sm:p-6">
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

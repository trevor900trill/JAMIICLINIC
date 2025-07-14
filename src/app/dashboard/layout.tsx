import type { PropsWithChildren } from 'react'
import { SidebarNav } from '@/components/dashboard/sidebar-nav'
import { Header } from '@/components/dashboard/header'
import { useAuth } from '@/context/auth-context'
import { redirect } from 'next/navigation'

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user } = useAuth()
  
  if (user?.reset_initial_password) {
    // This is a client-side check, but for an extra layer of protection,
    // we can use the user state that might be available during server rendering
    // in a more advanced setup. For now, the main redirect is in the login function.
    // Let's add a redirect here in case the user tries to navigate away.
    if (typeof window !== 'undefined' && window.location.pathname !== '/dashboard/change-password') {
       redirect('/dashboard/change-password')
    }
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

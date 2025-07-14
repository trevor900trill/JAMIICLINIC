"use client"
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Home, Users, Building, HeartPulse, PanelLeft, Stethoscope, UserCog } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/auth-context'

const allNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'doctor', 'staff'] },
  { href: '/dashboard/doctors', label: 'Doctors', icon: Stethoscope, roles: ['admin'] },
  { href: '/dashboard/staff', label: 'Staff', icon: Users, roles: ['admin', 'doctor'] },
  { href: '/dashboard/clinics', label: 'Clinics', icon: Building, roles: ['admin', 'doctor'] },
  { href: '/dashboard/patients',label: 'Patients', icon: HeartPulse, roles: ['admin', 'doctor', 'staff'] },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  
  if (!user) return null; // or a loading skeleton

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));
  const pageTitle = navItems.find(item => item.href === pathname)?.label ?? 'Dashboard'

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <nav className="grid gap-6 text-lg font-medium">
             <Link
                href="/dashboard"
                onClick={() => setIsSheetOpen(false)}
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
              >
                <Stethoscope className="h-5 w-5 transition-all group-hover:scale-110" />
                <span className="sr-only">Jamii Clinic</span>
              </Link>
            {navItems.map(item => (
                <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsSheetOpen(false)}
                    className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      
      <h1 className="text-xl font-semibold hidden md:block">{pageTitle}</h1>
      <Badge variant="outline" className="hidden sm:flex items-center gap-2 capitalize">
          <UserCog className="h-4 w-4" />
          {user.role}
      </Badge>
      
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Future search bar can be placed here */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <Avatar>
              <AvatarImage src={user.avatarUrl} alt="User avatar" data-ai-hint="person portrait" />
              <AvatarFallback>{user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}

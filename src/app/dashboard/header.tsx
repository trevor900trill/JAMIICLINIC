
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Users, Building, HeartPulse, PanelLeft, Stethoscope, UserCog } from 'lucide-react'
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/auth-context'
import { useClinic } from '@/context/clinic-context'

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
  const { clinics, selectedClinic, setSelectedClinicId, isLoading } = useClinic()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  
  if (!user) return null; // or a loading skeleton

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));
  
  let pageTitle = 'Dashboard';
  if (pathname.startsWith('/dashboard/patients/')) {
      pageTitle = 'Patient Details';
  } else {
      pageTitle = navItems.find(item => pathname.startsWith(item.href))?.label ?? 'Dashboard'
  }

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const handleClinicChange = (clinicIdStr: string) => {
    const clinicId = parseInt(clinicIdStr, 10);
    setSelectedClinicId(clinicId);
  };
  
  const showClinicSelector = user.role === 'admin' || user.role === 'doctor';

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
      
      <h1 className="text-xl font-semibold">{pageTitle}</h1>
      
      {showClinicSelector && (
        <div className="ml-4">
            <Select onValueChange={handleClinicChange} value={selectedClinic?.clinic_id.toString() ?? "all"} disabled={isLoading || clinics.length === 0}>
              <SelectTrigger className="w-full sm:w-[280px]">
                  <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder={isLoading ? "Loading clinics..." : "Select a clinic"} />
                  </div>
              </SelectTrigger>
              <SelectContent>
                  {user.role === 'admin' && <SelectItem value="all">All Clinics</SelectItem>}
                  {clinics.map((clinic) => (
                      <SelectItem key={clinic.clinic_id} value={String(clinic.clinic_id)}>
                          {clinic.clinic_name}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>
        </div>
      )}

      <div className="ml-auto flex items-center gap-4">
        <Badge variant="outline" className="hidden sm:flex items-center gap-2 capitalize">
            <UserCog className="h-4 w-4" />
            {user.role}
        </Badge>
        
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
      </div>
    </header>
  )
}

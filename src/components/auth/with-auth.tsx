
"use client"

import React, { ComponentType, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const withAuth = <P extends object>(
  WrappedComponent: ComponentType<P>,
  requiredRoles?: UserRole[]
) => {
  const AuthComponent = (props: P) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (isLoading) {
        return; // Wait for user state to be determined
      }

      const isAuthPage = pathname === '/';
      const isPublicOnboarding = ['/change-password', '/set-specialty'].includes(pathname) || pathname.startsWith('/onboarding');
      
      if (!user) {
        // If user is not authenticated, they should only be on the login page.
        if (!isAuthPage) {
          router.replace('/');
        }
        return;
      }
      
      // --- Sequential Onboarding Logic ---
      
      // 1. Force password change if required
      if (user.reset_initial_password && pathname !== '/change-password') {
        router.replace('/change-password');
        return;
      }
      if (!user.reset_initial_password && pathname === '/change-password') {
         router.replace('/dashboard');
         return;
      }

      // 2. Force specialty setting for doctors if password is changed
      if (!user.reset_initial_password && user.role === 'doctor' && !user.specialty_set && pathname !== '/set-specialty') {
        router.replace('/set-specialty');
        return;
      }

      // 3. Force clinic creation for doctors after specialty is set
      if (!user.reset_initial_password && user.role === 'doctor' && user.specialty_set && !user.clinic_created && pathname !== '/onboarding/create-clinic') {
        router.replace('/onboarding/create-clinic');
        return;
      }
      
      // 4. Force staff creation for doctors after clinic is created
      if (!user.reset_initial_password && user.role === 'doctor' && user.specialty_set && user.clinic_created && !user.staff_created && pathname !== '/onboarding/create-staff') {
        router.replace('/onboarding/create-staff');
        return;
      }
      
      // All onboarding complete, or not required. Now, handle general routing.
      
      // If user is fully authenticated and tries to access login or onboarding pages, redirect to dashboard
      if (isAuthPage || isPublicOnboarding) {
        if(!user.reset_initial_password && (user.role !== 'doctor' || user.staff_created)) {
            router.replace('/dashboard');
            return;
        }
      }

      // Role-based access control for other pages
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found'); // Or a dedicated access-denied page
        return;
      }

    }, [user, isLoading, router, pathname, requiredRoles]);

    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // Prevent rendering of pages if a redirect is imminent to avoid flashing content
    if (!user && pathname !== '/') return null;
    if (user && user.reset_initial_password && pathname !== '/change-password') return null;
    if (user && user.role === 'doctor' && !user.specialty_set && pathname !== '/set-specialty' && !user.reset_initial_password) return null;


    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;

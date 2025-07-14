
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
      const isOnboardingPage = ['/change-password', '/set-specialty'].includes(pathname) || pathname.startsWith('/onboarding');

      if (!user) {
        // If user is not authenticated, they should only be on the login page.
        if (!isAuthPage) {
          router.replace('/');
        }
        return;
      }
      
      // --- Start of Sequential Onboarding Logic ---
      
      // 1. Force password change if required
      if (user.reset_initial_password) {
        if (pathname !== '/change-password') {
          router.replace('/change-password');
        }
        return;
      }

      // 2. Force specialty setting for doctors if password has been changed
      if (user.role === 'doctor' && !user.specialty_set) {
         if (pathname !== '/set-specialty') {
            router.replace('/set-specialty');
         }
         return;
      }

      // 3. Force clinic creation for doctors after specialty is set
      if (user.role === 'doctor' && !user.clinic_created) {
          if (pathname !== '/onboarding/create-clinic') {
              router.replace('/onboarding/create-clinic');
          }
          return;
      }
      
      // 4. Force staff creation for doctors after clinic is created
      if (user.role === 'doctor' && !user.staff_created) {
          if (pathname !== '/onboarding/create-staff') {
              router.replace('/onboarding/create-staff');
          }
          return;
      }
      
      // --- End of Onboarding ---
      // All onboarding is complete. Handle general routing.
      
      // If user is fully authenticated and tries to access login or any onboarding pages, redirect to dashboard
      if (isAuthPage || isOnboardingPage) {
        router.replace('/dashboard');
        return;
      }

      // Role-based access control for other pages
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found'); // Or a dedicated access-denied page
        return;
      }

    }, [user, isLoading, router, pathname, requiredRoles]);

    // Show a global loading spinner while authentication status is being determined.
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // Prevent flashing content by only rendering the component when routing logic is complete
    const isAuthPage = pathname === '/';
    if (!user && !isAuthPage) return null; // Don't render protected page if not logged in
    if (user && isAuthPage) return null; // Don't render login page if logged in
    
    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;

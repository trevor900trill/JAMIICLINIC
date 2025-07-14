
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
        return; 
      }

      if (!user) {
        // If not logged in and not on the login page, redirect to login
        if (pathname !== '/') {
          router.replace('/');
        }
        return;
      }
      
      const isPublicOnboardingRoute = pathname === '/change-password' || pathname === '/set-specialty' || pathname.startsWith('/onboarding');
      
      // --- Onboarding Flow ---
      // 1. Force password change (highest priority)
      if (user.reset_initial_password) {
        if (pathname !== '/change-password') {
          router.replace('/change-password');
        }
        return; // Stop further checks
      }
      
      // 2. Force specialty set for doctors
      if (user.role === 'doctor' && !user.specialty_set) {
         if (pathname !== '/set-specialty') {
          router.replace('/set-specialty');
        }
        return; // Stop further checks
      }
      
      // 3. Force clinic creation for doctors
      if (user.role === 'doctor' && !user.clinic_created) {
          if (pathname !== '/onboarding/create-clinic') {
              router.replace('/onboarding/create-clinic');
          }
          return; // Stop further checks
      }

      // If user is authenticated and tries to access public or onboarding routes, redirect to dashboard
      if (pathname === '/' || isPublicOnboardingRoute) {
          router.replace('/dashboard');
          return;
      }

      // --- Role-based Access Control for dashboard routes ---
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found');
        return;
      }

    }, [user, isLoading, router, pathname, requiredRoles]);


    if (isLoading || !user) {
      // Show loader for all pages except the public login page
      if (pathname !== '/') {
        return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
      }
    }
    
    // Prevent rendering of protected pages if user is not available yet
    if (!user && pathname !== '/') {
        return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;

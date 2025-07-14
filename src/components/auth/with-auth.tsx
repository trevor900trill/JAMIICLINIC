
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

      const isPublicRoute = ['/', '/change-password', '/set-specialty'].includes(pathname) || pathname.startsWith('/onboarding');
      
      // If no user, redirect to login page, unless already there.
      if (!user) {
        if (!isPublicRoute || pathname !== '/') { // Allow access only to root login page
            if(pathname !== '/') router.replace('/');
        }
        return;
      }
      
      // --- Onboarding Flow for Authenticated User ---
      // 1. Force password change (highest priority)
      if (user.reset_initial_password) {
        if (pathname !== '/change-password') {
          router.replace('/change-password');
        }
        return;
      }
      
      // 2. Force specialty set for doctors
      if (user.role === 'doctor' && !user.specialty_set) {
         if (pathname !== '/set-specialty') {
          router.replace('/set-specialty');
        }
        return;
      }
      
      // 3. Force clinic creation for doctors
      if (user.role === 'doctor' && !user.clinic_created) {
          if (pathname !== '/onboarding/create-clinic') {
              router.replace('/onboarding/create-clinic');
          }
          return;
      }

      // If user is fully onboarded and tries to access public/onboarding routes, redirect to dashboard
      if (isPublicRoute) {
          router.replace('/dashboard');
          return;
      }

      // --- Role-based Access Control for protected dashboard routes ---
      if (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found');
        return;
      }

    }, [user, isLoading, router, pathname]);

    // Render a loading spinner while auth state is being determined, unless on the public login page
    if (isLoading) {
       return (
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        );
    }
    
    // Prevent rendering of protected pages if user is not authenticated
    if (!user && pathname !== '/') {
        return null;
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;

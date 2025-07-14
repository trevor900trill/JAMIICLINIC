
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
        return; // Wait until loading is complete
      }

      // If not logged in, redirect to home
      if (!user) {
        router.replace('/');
        return;
      }
      
      const isDoctorOnboarding = user.role === 'doctor' && (user.reset_initial_password || !user.specialty_set || !user.clinic_created);

      // --- Onboarding Flow ---
      // 1. Force password change if required (all roles)
      if (user.reset_initial_password) {
        if (pathname !== '/dashboard/change-password') {
          router.replace('/dashboard/change-password');
        }
        return; // Block further checks until password is changed
      }
      
      // 2. Force specialty set for doctors
      if (user.role === 'doctor' && !user.specialty_set) {
        if (pathname !== '/dashboard/set-specialty') {
          router.replace('/dashboard/set-specialty');
        }
        return;
      }

      // 3. Force clinic creation for doctors
      if (user.role === 'doctor' && user.specialty_set && !user.clinic_created) {
         if (pathname !== '/onboarding/create-clinic' && pathname !== '/onboarding/create-staff') {
           router.replace('/onboarding/create-clinic');
         }
         return;
      }

      // --- Post-Onboarding Redirects ---
      // If user is on an onboarding page but doesn't need to be, redirect to dashboard
      const onboardingRoutes = [
        '/dashboard/change-password',
        '/dashboard/set-specialty',
        '/onboarding/create-clinic',
        '/onboarding/create-staff'
      ];

      if (!isDoctorOnboarding && onboardingRoutes.includes(pathname)) {
          router.replace('/dashboard');
          return;
      }
      
      // --- Role-based Access Control ---
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.includes(user.role);
        if (!hasRequiredRole) {
          router.replace('/not-found');
        }
      }
    }, [user, isLoading, router, requiredRoles, pathname]);

    // Show a loader while authentication state is resolving
    if (isLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // --- Prevent rendering if a redirect is imminent ---
    const isRedirecting = 
        (user.reset_initial_password && pathname !== '/dashboard/change-password') ||
        (user.role === 'doctor' && !user.specialty_set && pathname !== '/dashboard/set-specialty') ||
        (user.role === 'doctor' && user.specialty_set && !user.clinic_created && !pathname.startsWith('/onboarding')) ||
        (requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role));

    if (isRedirecting) {
       return null; 
    }

    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;

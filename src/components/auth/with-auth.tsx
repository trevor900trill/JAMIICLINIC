
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
    const { user, isLoading, logout } = useAuth();
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
      
      const isOnboardingRoute = [
        '/dashboard/change-password',
        '/dashboard/set-specialty',
        '/onboarding/create-clinic',
        '/onboarding/create-staff'
      ].includes(pathname);

      // --- Onboarding Flow ---
      // The checks are now in a strict, sequential if/else if structure to enforce order.

      // 1. Force password change (highest priority)
      if (user.reset_initial_password) {
        if (pathname !== '/dashboard/change-password') {
          router.replace('/dashboard/change-password');
        }
      // 2. Force specialty set for doctors
      } else if (user.role === 'doctor' && !user.specialty_set) {
        if (pathname !== '/dashboard/set-specialty') {
          router.replace('/dashboard/set-specialty');
        }
      // 3. Force clinic creation for doctors
      } else if (user.role === 'doctor' && !user.clinic_created) {
         if (pathname !== '/onboarding/create-clinic' && pathname !== '/onboarding/create-staff') {
           router.replace('/onboarding/create-clinic');
         }
      // 4. Role-based Access Control for non-onboarding routes
      } else if (!isOnboardingRoute && requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
        router.replace('/not-found');
      // 5. If user is on an onboarding route but has completed onboarding, redirect to dashboard.
      } else if (isOnboardingRoute) {
        router.replace('/dashboard');
      }

    }, [user, isLoading, router, pathname, requiredRoles]);

    // Show a loader while authentication state is resolving or if a redirect is imminent.
    if (isLoading || !user) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    // --- Prevent rendering if a redirect is imminent to avoid content flashing ---
    if (user) {
        const needsPasswordChange = user.reset_initial_password && pathname !== '/dashboard/change-password';
        const needsSpecialty = !user.reset_initial_password && user.role === 'doctor' && !user.specialty_set && pathname !== '/dashboard/set-specialty';
        const needsClinicCreation = !user.reset_initial_password && user.role === 'doctor' && user.specialty_set && !user.clinic_created && !pathname.startsWith('/onboarding');
        const isOnboardingRoute = ['/dashboard/change-password', '/dashboard/set-specialty', '/onboarding/create-clinic', '/onboarding/create-staff'].includes(pathname);
        const hasCompletedOnboarding = !user.reset_initial_password && (user.role !== 'doctor' || (user.specialty_set && user.clinic_created));
        const wrongRole = !isOnboardingRoute && requiredRoles && requiredRoles.length > 0 && !requiredRoles.includes(user.role);

        if (needsPasswordChange || (user.role === 'doctor' && (needsSpecialty || needsClinicCreation)) || wrongRole) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }

        if (isOnboardingRoute && hasCompletedOnboarding) {
            return (
                <div className="flex h-screen items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            );
        }
    }


    return <WrappedComponent {...props} />;
  };

  AuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return AuthComponent;
};

export default withAuth;
